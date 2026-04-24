import { create } from 'zustand'
import { API_URL } from '../utils/constants'

const useUIStore = create((set, get) => ({
  // Sidebar / navigation
  activeTab: 'script',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Script editor
  scriptMode: 'write', // 'write' | 'generate'
  scriptText: '',
  setScriptMode: (mode) => set({ scriptMode: mode }),
  setScriptText: (text) => set({ scriptText: text }),

  // Generation pipeline (SSE)
  isGenerating: false,
  sseEvents: [],
  genError: null,
  genResult: null,

  startGeneration: async (payload) => {
    set({ isGenerating: true, sseEvents: [], genError: null, genResult: null })

    try {
      const response = await fetch(`${API_URL}/api/storyboard/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'progress') {
              set((s) => ({ sseEvents: [...s.sseEvents, event] }))
            } else if (event.type === 'complete') {
              set((s) => ({
                sseEvents: [...s.sseEvents, { stage: 'complete', message: event.message, progress: 100 }],
                genResult: event.data,
              }))
            } else if (event.type === 'error') {
              set({ genError: event.message })
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      set({ genError: err.message || '连接失败' })
    } finally {
      set({ isGenerating: false })
    }
  },

  clearGeneration: () => set({ sseEvents: [], genError: null, genResult: null }),
}))

export default useUIStore
