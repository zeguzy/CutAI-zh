import { forwardRef, useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  GripVertical,
  MapPin,
  Clock,
  Pencil,
  Check,
  X,
  Trash2,
  RefreshCw,
  Loader2,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Cloud,
  Camera,
  Users,
} from 'lucide-react'
import { formatDuration } from '../../utils/helpers'
import useStoryboardStore from '../../stores/useStoryboardStore'

// Mood → gradient mapping for the visual panel
const MOOD_GRADIENTS = {
  melancholic:  'from-amber-900/60 via-amber-800/30 to-surface-850',
  thrilling:    'from-red-900/60 via-red-800/30 to-surface-850',
  romantic:     'from-pink-900/60 via-pink-800/30 to-surface-850',
  eerie:        'from-blue-900/60 via-indigo-900/30 to-surface-850',
  triumphant:   'from-amber-800/60 via-yellow-900/30 to-surface-850',
  tense:        'from-orange-900/60 via-red-900/30 to-surface-850',
  ominous:      'from-violet-900/60 via-purple-900/30 to-surface-850',
  bittersweet:  'from-cyan-900/60 via-teal-800/30 to-surface-850',
  mysterious:   'from-purple-900/60 via-violet-900/30 to-surface-850',
  calm:         'from-emerald-900/60 via-green-900/30 to-surface-850',
  hopeful:      'from-sky-900/60 via-blue-800/30 to-surface-850',
  dark:         'from-zinc-900/80 via-neutral-900/50 to-surface-850',
  neutral:      'from-zinc-800/50 via-zinc-800/30 to-surface-850',
}

const MOOD_ACCENT = {
  melancholic: 'text-amber-400',
  thrilling:   'text-red-400',
  romantic:    'text-pink-400',
  eerie:       'text-blue-400',
  triumphant:  'text-amber-300',
  tense:       'text-orange-400',
  ominous:     'text-violet-400',
  bittersweet: 'text-cyan-400',
  mysterious:  'text-purple-400',
  calm:        'text-emerald-400',
  hopeful:     'text-sky-400',
  dark:        'text-zinc-400',
  neutral:     'text-zinc-400',
}

const MOOD_BORDER = {
  melancholic: 'border-amber-500/25',
  thrilling:   'border-red-500/25',
  romantic:    'border-pink-500/25',
  eerie:       'border-blue-500/25',
  triumphant:  'border-amber-500/25',
  tense:       'border-orange-500/25',
  ominous:     'border-violet-500/25',
  bittersweet: 'border-cyan-500/25',
  mysterious:  'border-purple-500/25',
  calm:        'border-emerald-500/25',
  hopeful:     'border-sky-500/25',
  dark:        'border-zinc-600/40',
  neutral:     'border-zinc-600/30',
}

const MOOD_COLORS_BADGE = {
  melancholic: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  thrilling:   { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  romantic:    { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' },
  eerie:       { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  triumphant:  { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
  tense:       { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  ominous:     { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  bittersweet: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  mysterious:  { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  calm:        { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  hopeful:     { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  dark:        { bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30' },
  neutral:     { bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30' },
}

function getMoodKey(mood) {
  return (mood || 'neutral').toLowerCase()
}

function getGradient(mood) {
  const k = getMoodKey(mood)
  return MOOD_GRADIENTS[k] || MOOD_GRADIENTS.neutral
}

function getAccent(mood) {
  const k = getMoodKey(mood)
  return MOOD_ACCENT[k] || MOOD_ACCENT.neutral
}

function getBorder(mood) {
  const k = getMoodKey(mood)
  return MOOD_BORDER[k] || MOOD_BORDER.neutral
}

function getBadgeStyle(mood) {
  const k = getMoodKey(mood)
  return MOOD_COLORS_BADGE[k] || MOOD_COLORS_BADGE.neutral
}

// Time of day icon
function TimeIcon({ time }) {
  const t = (time || '').toLowerCase()
  if (t.includes('night')) return <Moon className="w-3 h-3" />
  if (t.includes('dawn') || t.includes('sunrise')) return <Sunrise className="w-3 h-3" />
  if (t.includes('evening') || t.includes('sunset') || t.includes('dusk')) return <Sunset className="w-3 h-3" />
  if (t.includes('morning') || t.includes('afternoon') || t.includes('day')) return <Sun className="w-3 h-3" />
  return <Cloud className="w-3 h-3" />
}

// Camera angle short label
function getCameraLabel(shots) {
  if (!shots || shots.length === 0) return null
  const first = shots[0]
  return first.shot_type || first.camera_angle || null
}

const SceneCard = forwardRef(function SceneCard(
  { scene, isSelected, isDragging, onClick, dragHandleProps, style, onDelete, ...props },
  ref,
) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(scene.title)
  const titleRef = useRef(null)
  const updateScene = useStoryboardStore((s) => s.updateScene)
  const regenerateScene = useStoryboardStore((s) => s.regenerateScene)
  const regenerating = useStoryboardStore((s) => s.regenerating)
  const isRegenerating = regenerating === scene.id

  const mood = scene.mood?.overall_mood || 'neutral'
  const moodBadge = getBadgeStyle(mood)
  const totalDuration = (scene.shots || []).reduce((sum, s) => sum + (s.duration_seconds || 0), 0)
  const cameraLabel = getCameraLabel(scene.shots)
  const characters = scene.characters || []
  const timeOfDay = scene.time_of_day || ''
  const description = scene.description || ''

  useEffect(() => {
    if (editing && titleRef.current) {
      titleRef.current.focus()
      titleRef.current.select()
    }
  }, [editing])

  function handleEditStart(e) {
    e.stopPropagation()
    setEditTitle(scene.title)
    setEditing(true)
  }

  async function handleEditSave(e) {
    e.stopPropagation()
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== scene.title) {
      await updateScene(scene.id, { title: trimmed })
    }
    setEditing(false)
  }

  function handleEditCancel(e) {
    e.stopPropagation()
    setEditing(false)
    setEditTitle(scene.title)
  }

  function handleEditKeyDown(e) {
    if (e.key === 'Enter') handleEditSave(e)
    if (e.key === 'Escape') handleEditCancel(e)
  }

  async function handleRegenerate(e) {
    e.stopPropagation()
    await regenerateScene(scene.id)
  }

  function handleDeleteClick(e) {
    e.stopPropagation()
    if (onDelete) onDelete(scene.id)
  }

  return (
    <motion.div
      ref={ref}
      style={style}
      {...props}
      layout
      whileHover={isDragging ? {} : { y: -4, boxShadow: '0 8px 30px rgba(245, 158, 11, 0.12)' }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        border rounded-xl overflow-hidden cursor-pointer
        transition-colors group relative
        ${getBorder(mood)}
        ${isDragging
          ? 'border-accent-500/50 shadow-xl shadow-accent-500/10 z-50 opacity-90'
          : isSelected
            ? 'border-accent-500/40 ring-1 ring-accent-500/20'
            : 'hover:border-surface-500'
        }
      `}
    >
      {/* Regenerating overlay */}
      {isRegenerating && (
        <div className="absolute inset-0 bg-surface-900/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 text-accent-500 animate-spin mb-2" />
          <span className="text-[10px] font-mono text-accent-400">重新生成中...</span>
        </div>
      )}

      {/* Rich visual panel — mood gradient + scene description */}
      <div className={`relative bg-gradient-to-b ${getGradient(mood)} px-3.5 pt-3.5 pb-3 min-h-[120px] flex flex-col justify-between`}>
        {/* Top row: scene number + time of day + drag handle */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Scene number */}
            <div className="w-6 h-6 rounded bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <span className="text-[11px] font-mono font-bold text-zinc-200">
                {scene.scene_number}
              </span>
            </div>

            {/* Time of day indicator */}
            {timeOfDay && (
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/30 backdrop-blur-sm ${getAccent(mood)}`}>
                <TimeIcon time={timeOfDay} />
                <span className="text-[9px] font-mono uppercase tracking-wider">
                  {timeOfDay}
                </span>
              </div>
            )}
          </div>

          {/* Drag handle */}
          <div
            {...dragHandleProps}
            className="w-6 h-6 rounded bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-3.5 h-3.5 text-zinc-300" />
          </div>
        </div>

        {/* Scene description — elegant monospace */}
        <p className="text-[11px] font-mono text-zinc-300/90 leading-relaxed line-clamp-3 mb-2">
          {description || '暂无描述'}
        </p>

        {/* Camera angle badge overlay */}
        {cameraLabel && (
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm text-zinc-300">
              <Camera className="w-2.5 h-2.5" />
              {cameraLabel}
            </span>
          </div>
        )}

        {/* Action buttons on hover */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="w-6 h-6 rounded bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-accent-500/30 transition-colors"
            title="重新生成场景"
          >
            <RefreshCw className="w-3 h-3 text-zinc-300" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="w-6 h-6 rounded bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/30 transition-colors"
            title="删除场景"
          >
            <Trash2 className="w-3 h-3 text-zinc-300" />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="bg-surface-850 p-3">
        {/* Title — inline editable */}
        {editing ? (
          <div className="flex items-center gap-1 mb-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              ref={titleRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="flex-1 bg-surface-750 border border-accent-500/40 rounded px-1.5 py-0.5 text-sm text-zinc-200 focus:outline-none focus:border-accent-500"
            />
            <button
              onClick={handleEditSave}
              className="w-5 h-5 flex items-center justify-center text-film-green hover:text-green-400"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleEditCancel}
              className="w-5 h-5 flex items-center justify-center text-surface-400 hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 mb-1.5 group/title">
            <h3 className="text-sm font-semibold text-zinc-200 truncate flex-1">
              {scene.title}
            </h3>
            <button
              onClick={handleEditStart}
              className="w-5 h-5 shrink-0 flex items-center justify-center text-surface-500 hover:text-accent-400 opacity-0 group-hover:opacity-100 transition-opacity"
              title="编辑标题"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Location slug */}
        {scene.location && (
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-surface-500 shrink-0" />
            <span className="text-[11px] font-mono text-surface-400 truncate">
              {scene.location}
            </span>
          </div>
        )}

        {/* Character tags */}
        {characters.length > 0 && (
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            <Users className="w-3 h-3 text-surface-500 shrink-0" />
            {characters.slice(0, 3).map((char, i) => (
              <span
                key={i}
                className="text-[9px] font-mono text-zinc-400 bg-surface-750 px-1.5 py-0.5 rounded"
              >
                {char}
              </span>
            ))}
            {characters.length > 3 && (
              <span className="text-[9px] font-mono text-surface-500">
                +{characters.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Bottom row — mood badge + shot count + duration */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${moodBadge.bg} ${moodBadge.text} ${moodBadge.border}`}>
            {mood}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-surface-500">
              {(scene.shots || []).length} 个镜头
            </span>
            {totalDuration > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] font-mono text-surface-500">
                <Clock className="w-2.5 h-2.5" />
                {formatDuration(totalDuration)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
})

export default SceneCard
