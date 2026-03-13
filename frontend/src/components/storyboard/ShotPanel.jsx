import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Camera,
  Move,
  Clock,
  MessageSquare,
  MapPin,
  Hash,
  Pencil,
  RefreshCw,
  Loader2,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Cloud,
  Users,
  Music,
  Activity,
} from 'lucide-react'
import { formatDuration } from '../../utils/helpers'
import useStoryboardStore from '../../stores/useStoryboardStore'

// Film-industry color coding for shot types
const SHOT_TYPE_STYLE = {
  'wide':              { bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-500/30' },
  'close-up':          { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30' },
  'medium':            { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'over-the-shoulder': { bg: 'bg-amber-500/15',  text: 'text-amber-400',  border: 'border-amber-500/30' },
  'POV':               { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  'aerial':            { bg: 'bg-cyan-500/15',   text: 'text-cyan-400',   border: 'border-cyan-500/30' },
  'tracking':          { bg: 'bg-pink-500/15',   text: 'text-pink-400',   border: 'border-pink-500/30' },
}

const ANGLE_STYLE = {
  'eye-level':   { bg: 'bg-zinc-500/15',   text: 'text-zinc-400',   border: 'border-zinc-500/30' },
  'low-angle':   { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  'high-angle':  { bg: 'bg-sky-500/15',    text: 'text-sky-400',    border: 'border-sky-500/30' },
  'dutch-angle': { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  "bird's-eye":  { bg: 'bg-teal-500/15',   text: 'text-teal-400',   border: 'border-teal-500/30' },
}

const MOVEMENT_ARROWS = {
  'static':    { icon: '---', label: 'Static' },
  'pan-left':  { icon: '<--', label: 'Pan Left' },
  'pan-right': { icon: '-->', label: 'Pan Right' },
  'tilt-up':   { icon: ' ^ ', label: 'Tilt Up' },
  'tilt-down': { icon: ' v ', label: 'Tilt Down' },
  'dolly-in':  { icon: '>>>', label: 'Dolly In' },
  'dolly-out': { icon: '<<<', label: 'Dolly Out' },
  'crane':     { icon: ' ~ ', label: 'Crane' },
}

function getBadgeStyle(map, key) {
  const k = (key || '').toLowerCase()
  return map[k] || { bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30' }
}

function TimeIcon({ time }) {
  const t = (time || '').toLowerCase()
  if (t.includes('night')) return <Moon className="w-3.5 h-3.5" />
  if (t.includes('dawn') || t.includes('sunrise')) return <Sunrise className="w-3.5 h-3.5" />
  if (t.includes('evening') || t.includes('sunset') || t.includes('dusk')) return <Sunset className="w-3.5 h-3.5" />
  if (t.includes('morning') || t.includes('afternoon') || t.includes('day')) return <Sun className="w-3.5 h-3.5" />
  return <Cloud className="w-3.5 h-3.5" />
}

// Mood bar component
function MoodBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-surface-400 w-14 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-750 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.round((value || 0) * 100)}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-surface-500 w-8">{((value || 0) * 100).toFixed(0)}%</span>
    </div>
  )
}

// Backdrop overlay
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

// Panel slide
const panelVariants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } },
  exit: { x: '100%', transition: { duration: 0.2 } },
}

// Stagger children
const listVariants = {
  visible: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
}

export default function ShotPanel({ scene, onClose }) {
  const panelRef = useRef(null)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descText, setDescText] = useState(scene.description || '')
  const descRef = useRef(null)

  const updateScene = useStoryboardStore((s) => s.updateScene)
  const regenerating = useStoryboardStore((s) => s.regenerating)
  const isRegenerating = regenerating === scene.id

  // Update local description state when scene changes
  useEffect(() => {
    setDescText(scene.description || '')
    setEditingDesc(false)
  }, [scene.id])

  // Close on click outside
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!scene) return null

  const shots = scene.shots || []
  const characters = scene.characters || []
  const mood = scene.mood || {}
  const soundtrack = scene.soundtrack || {}
  const totalDuration = shots.reduce((sum, s) => sum + (s.duration_seconds || 0), 0)

  async function handleDescSave() {
    const trimmed = descText.trim()
    if (trimmed !== (scene.description || '')) {
      await updateScene(scene.id, { description: trimmed })
    }
    setEditingDesc(false)
  }

  return (
    <AnimatePresence>
      {scene && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-surface-850/95 backdrop-blur-xl border-l border-surface-700 shadow-2xl z-50 flex flex-col"
          >
            {/* Regenerating overlay */}
            {isRegenerating && (
              <div className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent-500 animate-spin mb-3" />
                <span className="text-xs font-mono text-accent-400">Regenerating...</span>
              </div>
            )}

            {/* ============================================ */}
            {/* HEADER — Scene title block (screenplay style) */}
            {/* ============================================ */}
            <div className="shrink-0 border-b border-surface-700/60">
              {/* Slug line bar */}
              <div className="bg-surface-800 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded shrink-0">
                    SCENE {scene.scene_number}
                  </span>
                  <h3 className="text-sm font-semibold text-zinc-100 truncate">
                    {scene.title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-zinc-200 hover:bg-surface-700 transition-all shrink-0 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Meta row: location, time, characters, duration */}
              <div className="px-5 py-2.5 flex flex-wrap items-center gap-3 text-[11px] font-mono text-surface-400">
                {scene.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-surface-500" />
                    {scene.location}
                  </span>
                )}
                {scene.time_of_day && (
                  <span className="flex items-center gap-1 text-amber-400/70">
                    <TimeIcon time={scene.time_of_day} />
                    {scene.time_of_day.toUpperCase()}
                  </span>
                )}
                {totalDuration > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-surface-500" />
                    {formatDuration(totalDuration)}
                  </span>
                )}
                {characters.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-surface-500" />
                    {characters.join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* ============================================ */}
            {/* SCROLLABLE CONTENT */}
            {/* ============================================ */}
            <div className="flex-1 overflow-y-auto">
              {/* Scene description — editable */}
              <div className="px-5 pt-4 pb-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-surface-500 mb-2">Scene Description</div>
                {editingDesc ? (
                  <div className="mb-3">
                    <textarea
                      ref={descRef}
                      value={descText}
                      onChange={(e) => setDescText(e.target.value)}
                      rows={4}
                      className="w-full bg-surface-800 border border-accent-500/40 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 leading-relaxed focus:outline-none focus:border-accent-500 resize-none"
                    />
                    <div className="flex gap-2 justify-end mt-1">
                      <button
                        onClick={() => { setEditingDesc(false); setDescText(scene.description || '') }}
                        className="text-[10px] text-surface-400 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDescSave}
                        className="text-[10px] text-accent-400 hover:text-accent-300 font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingDesc(true)}
                    className="mb-3 p-3 bg-surface-800/50 border border-surface-700/40 rounded-lg cursor-pointer hover:border-accent-500/20 transition-colors group/desc"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-mono text-zinc-300 leading-relaxed flex-1 whitespace-pre-wrap">
                        {scene.description || 'Click to add description...'}
                      </p>
                      <Pencil className="w-3 h-3 text-surface-500 group-hover/desc:text-accent-400 shrink-0 mt-0.5 transition-colors" />
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================ */}
              {/* MOOD & SOUNDTRACK — compact analysis section */}
              {/* ============================================ */}
              <div className="px-5 pb-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Mood analysis */}
                  <div className="bg-surface-800/50 border border-surface-700/40 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Activity className="w-3 h-3 text-surface-400" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-surface-500">Mood</span>
                      {mood.overall_mood && (
                        <span className="text-[9px] font-mono text-accent-400 ml-auto">{mood.overall_mood}</span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <MoodBar label="Tension" value={mood.tension} color="bg-red-500" />
                      <MoodBar label="Emotion" value={mood.emotion} color="bg-blue-400" />
                      <MoodBar label="Energy" value={mood.energy} color="bg-amber-400" />
                      <MoodBar label="Dark" value={mood.darkness} color="bg-violet-500" />
                    </div>
                  </div>

                  {/* Soundtrack vibe */}
                  <div className="bg-surface-800/50 border border-surface-700/40 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Music className="w-3 h-3 text-surface-400" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-surface-500">Soundtrack</span>
                    </div>
                    <div className="space-y-1.5">
                      {soundtrack.genre && (
                        <div className="text-[10px] font-mono text-zinc-400">
                          <span className="text-surface-500">Genre:</span> {soundtrack.genre}
                        </div>
                      )}
                      {soundtrack.tempo && (
                        <div className="text-[10px] font-mono text-zinc-400">
                          <span className="text-surface-500">Tempo:</span> {soundtrack.tempo}
                        </div>
                      )}
                      {soundtrack.instruments && soundtrack.instruments.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {soundtrack.instruments.map((inst, i) => (
                            <span key={i} className="text-[8px] font-mono text-zinc-500 bg-surface-750 px-1 py-0.5 rounded">
                              {inst}
                            </span>
                          ))}
                        </div>
                      )}
                      {soundtrack.reference_track && (
                        <div className="text-[9px] font-mono text-surface-500 italic mt-1 truncate">
                          {soundtrack.reference_track}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================ */}
              {/* SHOT BREAKDOWN — styled as production document */}
              {/* ============================================ */}
              <div className="px-5 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-3.5 h-3.5 text-surface-400" />
                  <span className="text-[10px] font-mono font-medium text-surface-400 uppercase tracking-wider">
                    Shot Breakdown — {shots.length} Shot{shots.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2.5"
                >
                  {shots.map((shot) => (
                    <ShotItem key={shot.id || shot.shot_number} shot={shot} />
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}


function ShotItem({ shot }) {
  const typeStyle = getBadgeStyle(SHOT_TYPE_STYLE, shot.shot_type)
  const angleStyle = getBadgeStyle(ANGLE_STYLE, shot.camera_angle)
  const movement = MOVEMENT_ARROWS[shot.camera_movement] || { icon: '---', label: shot.camera_movement || 'Static' }

  return (
    <motion.div
      variants={itemVariants}
      className="bg-surface-800 border border-surface-700/60 rounded-xl overflow-hidden"
    >
      {/* Shot header strip */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-800 border-b border-surface-700/40">
        {/* Shot number */}
        <div className="flex items-center gap-1">
          <Hash className="w-3 h-3 text-surface-500" />
          <span className="text-xs font-mono font-bold text-zinc-300">
            {shot.shot_number}
          </span>
        </div>

        {/* Shot type badge */}
        <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
          {shot.shot_type}
        </span>

        {/* Camera angle badge */}
        <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${angleStyle.bg} ${angleStyle.text} ${angleStyle.border}`}>
          {shot.camera_angle}
        </span>

        {/* Camera movement with directional indicator */}
        <span className="flex items-center gap-1 text-[10px] font-mono text-surface-400 bg-surface-750 px-1.5 py-0.5 rounded">
          <Move className="w-2.5 h-2.5" />
          {movement.label}
        </span>

        {/* Duration — right-aligned */}
        <span className="flex items-center gap-1 text-[10px] font-mono text-surface-400 ml-auto">
          <Clock className="w-2.5 h-2.5" />
          {formatDuration(shot.duration_seconds || 0)}
        </span>
      </div>

      {/* Shot description body */}
      <div className="px-3.5 py-3">
        <p className="text-xs font-mono text-zinc-300 leading-relaxed">
          {shot.description}
        </p>

        {/* Dialogue — styled as screenplay dialogue */}
        {shot.dialogue && (
          <div className="mt-3 flex gap-2 p-2.5 bg-surface-750/60 rounded-lg border-l-2 border-accent-500/40">
            <MessageSquare className="w-3 h-3 text-accent-500 shrink-0 mt-0.5" />
            <p className="text-xs italic text-accent-300/80 leading-relaxed">
              "{shot.dialogue}"
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
