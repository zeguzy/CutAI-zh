import {
  Maximize,
  Focus,
  RectangleHorizontal,
  Eye,
  Navigation,
  Plane,
  Move,
} from 'lucide-react'

const SHOT_TYPE_CONFIG = {
  wide:              { color: 'text-blue-400 bg-blue-500/15 border-blue-500/30',    icon: Maximize },
  'close-up':        { color: 'text-red-400 bg-red-500/15 border-red-500/30',       icon: Focus },
  medium:            { color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', icon: RectangleHorizontal },
  'over-the-shoulder': { color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', icon: Eye },
  POV:               { color: 'text-purple-400 bg-purple-500/15 border-purple-500/30', icon: Eye },
  aerial:            { color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',    icon: Plane },
  tracking:          { color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', icon: Move },
}

const DEFAULT_CONFIG = { color: 'text-zinc-400 bg-zinc-500/15 border-zinc-500/30', icon: RectangleHorizontal }

export default function CameraAngleTag({ type, label }) {
  const key = (type || '').toLowerCase()
  const config = SHOT_TYPE_CONFIG[key] || DEFAULT_CONFIG
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {label || type}
    </span>
  )
}
