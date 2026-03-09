import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Clock } from 'lucide-react'
import { formatDuration } from '../../utils/helpers'

// Mood → node background tint
const MOOD_TINTS = {
  // Warm/amber — happy, triumphant, romantic
  triumphant: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', ring: 'rgba(245, 158, 11, 0.3)' },
  romantic:   { bg: 'rgba(244, 114, 182, 0.15)', border: '#f472b6', ring: 'rgba(244, 114, 182, 0.3)' },
  // Blue — sad, melancholic, bittersweet
  melancholic: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', ring: 'rgba(59, 130, 246, 0.3)' },
  bittersweet: { bg: 'rgba(6, 182, 212, 0.15)', border: '#06b6d4', ring: 'rgba(6, 182, 212, 0.3)' },
  // Red — tense, thrilling
  tense:     { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', ring: 'rgba(239, 68, 68, 0.3)' },
  thrilling: { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', ring: 'rgba(249, 115, 22, 0.3)' },
  ominous:   { bg: 'rgba(239, 68, 68, 0.12)', border: '#dc2626', ring: 'rgba(239, 68, 68, 0.25)' },
  // Purple — mysterious, eerie
  eerie:       { bg: 'rgba(139, 92, 246, 0.15)', border: '#8b5cf6', ring: 'rgba(139, 92, 246, 0.3)' },
  mysterious:  { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', ring: 'rgba(168, 85, 247, 0.3)' },
}

const DEFAULT_TINT = { bg: 'rgba(113, 113, 122, 0.12)', border: '#52525b', ring: 'rgba(113, 113, 122, 0.2)' }

function getTint(mood) {
  const key = (mood || '').toLowerCase()
  return MOOD_TINTS[key] || DEFAULT_TINT
}

function TimelineNode({ data, selected }) {
  const { scene } = data
  const mood = scene.mood?.overall_mood || 'neutral'
  const tint = getTint(mood)
  const totalDuration = (scene.shots || []).reduce((sum, s) => sum + (s.duration_seconds || 0), 0)

  return (
    <div
      className="relative"
      style={{ minWidth: 180 }}
    >
      {/* Source/target handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !border-2 !bg-surface-700 !border-surface-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !border-2 !bg-surface-700 !border-surface-500"
      />

      {/* Node body */}
      <div
        className="rounded-xl px-4 py-3 border-2 transition-shadow cursor-pointer"
        style={{
          background: tint.bg,
          borderColor: selected ? tint.border : 'rgba(255,255,255,0.06)',
          boxShadow: selected ? `0 0 16px ${tint.ring}` : 'none',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Scene number + mood dot */}
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-mono font-bold text-white"
            style={{ backgroundColor: tint.border }}
          >
            {scene.scene_number}
          </div>
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: tint.border }}
          />
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            {mood}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-xs font-semibold text-zinc-200 truncate mb-1.5 max-w-[150px]">
          {scene.title}
        </h4>

        {/* Duration */}
        {totalDuration > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span className="text-[10px] font-mono text-zinc-400">
              {formatDuration(totalDuration)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(TimelineNode)
