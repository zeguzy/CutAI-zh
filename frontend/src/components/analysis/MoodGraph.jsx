import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import useStoryboardStore from '../../stores/useStoryboardStore'

const MOOD_LINES = [
  { key: 'tension',  color: '#ef4444', label: 'Tension' },
  { key: 'emotion',  color: '#fbbf24', label: 'Emotion' },
  { key: 'energy',   color: '#10b981', label: 'Energy' },
  { key: 'darkness', color: '#8b5cf6', label: 'Darkness' },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2.5 shadow-xl">
      <p className="text-xs font-semibold text-zinc-200 mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-[11px]">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-zinc-400">{entry.name}:</span>
          <span className="font-mono text-zinc-200">{entry.value?.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

export default function MoodGraph() {
  const scenes = useStoryboardStore((s) => s.scenes)

  const data = scenes
    .filter((s) => s.mood)
    .map((scene) => ({
      name: `S${scene.scene_number}`,
      fullTitle: scene.title,
      tension: scene.mood.tension ?? 0,
      emotion: scene.mood.emotion ?? 0,
      energy: scene.mood.energy ?? 0,
      darkness: scene.mood.darkness ?? 0,
    }))

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center mb-3">
          <BarChart3 className="w-7 h-7 text-surface-600" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-1">No mood data</h3>
        <p className="text-xs text-surface-500 text-center max-w-xs">
          Generate a storyboard to see mood analysis across scenes.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-accent-500" />
        <h3 className="text-sm font-semibold text-zinc-200">Mood Arc</h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#52526a', fontSize: 11, fontFamily: 'monospace' }}
            axisLine={{ stroke: '#1a1a24' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tick={{ fill: '#52526a', fontSize: 11, fontFamily: 'monospace' }}
            axisLine={{ stroke: '#1a1a24' }}
            tickLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-zinc-400">{value}</span>
            )}
          />
          {MOOD_LINES.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 4, fill: line.color, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: line.color, strokeWidth: 2, stroke: '#0a0a0f' }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
