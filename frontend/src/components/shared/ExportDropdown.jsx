import { useState, useRef, useEffect } from 'react'
import { Download, FileJson, FileText, Share2, Check } from 'lucide-react'
import { API_URL } from '../../utils/constants'

export default function ExportDropdown({ projectId, projectTitle, genre, sceneCount }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function downloadJSON() {
    setOpen(false)
    const url = `${API_URL}/api/storyboard/${projectId}/export/json`
    const a = document.createElement('a')
    a.href = url
    a.download = ''
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  function downloadPDF() {
    setOpen(false)
    const url = `${API_URL}/api/storyboard/${projectId}/export/pdf`
    const a = document.createElement('a')
    a.href = url
    a.download = ''
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function handleShare() {
    setOpen(false)
    const summary = [
      `🎬 ${projectTitle || 'Untitled'}`,
      genre ? `Genre: ${genre}` : null,
      sceneCount ? `${sceneCount} scenes` : null,
      '',
      'Built with CutAI — AI Film Director & Storyboard Engine',
    ]
      .filter(Boolean)
      .join('\n')

    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-800 border border-surface-700 text-zinc-300 hover:text-accent-400 hover:border-accent-500/40 transition-all"
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-surface-850 border border-surface-700 rounded-xl shadow-xl shadow-black/40 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <button
            onClick={downloadJSON}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs text-zinc-300 hover:bg-surface-750 hover:text-accent-400 transition-colors"
          >
            <FileJson className="w-4 h-4 text-accent-500" />
            Export as JSON
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs text-zinc-300 hover:bg-surface-750 hover:text-accent-400 transition-colors"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            Export as PDF
          </button>
          <div className="border-t border-surface-700" />
          <button
            onClick={handleShare}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs text-zinc-300 hover:bg-surface-750 hover:text-accent-400 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-film-green" />
                Copied to clipboard!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-film-blue" />
                Share Summary
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
