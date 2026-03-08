import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:8000'

function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => setError(err.message))
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f]">
      <h1 className="text-5xl font-bold text-amber-400 mb-4 tracking-tight">
        CutAI
      </h1>
      <p className="text-zinc-400 text-lg mb-8">
        AI Film Director & Storyboard Engine
      </p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 min-w-[300px]">
        <h2 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-3">
          Backend Status
        </h2>
        {error && (
          <p className="text-red-400 font-mono text-sm">Error: {error}</p>
        )}
        {health && (
          <div className="space-y-1">
            <p className="text-emerald-400 font-mono text-sm">
              Status: {health.status}
            </p>
            <p className="text-zinc-300 font-mono text-sm">
              Service: {health.service}
            </p>
          </div>
        )}
        {!health && !error && (
          <p className="text-zinc-500 font-mono text-sm animate-pulse">
            Connecting...
          </p>
        )}
      </div>
    </div>
  )
}

export default App
