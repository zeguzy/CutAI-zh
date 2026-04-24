import { Music, Gauge, Disc3 } from 'lucide-react'
import useStoryboardStore from '../../stores/useStoryboardStore'

// SVG waveform decoration
function Waveform({ color = '#f59e0b' }) {
  return (
    <svg
      viewBox="0 0 120 32"
      className="w-full h-8 opacity-20"
      preserveAspectRatio="none"
    >
      {Array.from({ length: 40 }, (_, i) => {
        const h = Math.abs(Math.sin(i * 0.4) * Math.cos(i * 0.15)) * 28 + 4
        return (
          <rect
            key={i}
            x={i * 3}
            y={(32 - h) / 2}
            width={1.5}
            height={h}
            rx={0.75}
            fill={color}
          />
        )
      })}
    </svg>
  )
}

const TEMPO_COLORS = {
  slow: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
  moderate: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
  fast: 'text-red-400 bg-red-500/15 border-red-500/30',
}

export default function SoundtrackPanel() {
  const scenes = useStoryboardStore((s) => s.scenes)

  const scenesWithSoundtrack = scenes.filter((s) => s.soundtrack)

  if (!scenesWithSoundtrack.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center mb-3">
          <Music className="w-7 h-7 text-surface-600" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-1">暂无配乐数据</h3>
        <p className="text-xs text-surface-500 text-center max-w-xs">
          生成分镜板后，即可查看每个场景的配乐建议。
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Music className="w-4 h-4 text-accent-500" />
        <h3 className="text-sm font-semibold text-zinc-200">配乐氛围</h3>
      </div>

      {scenesWithSoundtrack.map((scene) => {
        const st = scene.soundtrack
        const tempoStyle = TEMPO_COLORS[st.tempo?.toLowerCase()] || TEMPO_COLORS.moderate

        return (
          <div
            key={scene.id}
            className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden"
          >
            {/* Waveform decoration */}
            <div className="px-4 pt-3">
              <Waveform />
            </div>

            <div className="px-4 pb-4 pt-2">
              {/* Scene label + genre */}
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[10px] font-mono font-bold text-accent-500 bg-accent-500/10 px-1.5 py-0.5 rounded">
                  场景 {scene.scene_number}
                </span>
                <span className="text-xs font-medium text-zinc-300">
                  {st.genre}
                </span>
              </div>

              {/* Tempo + energy */}
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${tempoStyle}`}>
                  {st.tempo}
                </span>
                {st.energy_level != null && (
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3 h-3 text-surface-500" />
                    <div className="w-16 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500 rounded-full transition-all"
                        style={{ width: `${st.energy_level * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-surface-400">
                      {(st.energy_level * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Instruments */}
              {st.instruments?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {st.instruments.map((inst, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono text-zinc-400 bg-surface-750 px-2 py-0.5 rounded-full border border-surface-700"
                    >
                      {inst}
                    </span>
                  ))}
                </div>
              )}

              {/* Reference track */}
              {st.reference_track && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-surface-700/60">
                  <Disc3 className="w-3.5 h-3.5 text-surface-500 animate-[spin_3s_linear_infinite]" />
                  <span className="text-[11px] text-surface-400 italic truncate">
                    {st.reference_track}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
