import { Camera, Video } from 'lucide-react'
import useStoryboardStore from '../../stores/useStoryboardStore'
import CameraAngleTag from './CameraAngleTag'

export default function CameraBreakdown() {
  const scenes = useStoryboardStore((s) => s.scenes)

  // Collect all shots across all scenes
  const allShots = scenes.flatMap((s) => s.shots || [])

  if (!allShots.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center mb-3">
          <Camera className="w-7 h-7 text-surface-600" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-1">暂无镜头数据</h3>
        <p className="text-xs text-surface-500 text-center max-w-xs">
          生成分镜板后，即可查看机位分析。
        </p>
      </div>
    )
  }

  // Count shot types
  const typeCounts = {}
  const angleCounts = {}
  const movementCounts = {}

  for (const shot of allShots) {
    const t = shot.shot_type || 'unknown'
    const a = shot.camera_angle || 'unknown'
    const m = shot.camera_movement || 'unknown'
    typeCounts[t] = (typeCounts[t] || 0) + 1
    angleCounts[a] = (angleCounts[a] || 0) + 1
    movementCounts[m] = (movementCounts[m] || 0) + 1
  }

  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])
  const sortedAngles = Object.entries(angleCounts).sort((a, b) => b[1] - a[1])
  const sortedMovements = Object.entries(movementCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Video className="w-4 h-4 text-accent-500" />
        <h3 className="text-sm font-semibold text-zinc-200">镜头分析</h3>
        <span className="text-[10px] font-mono text-surface-400 ml-auto">
          共 {allShots.length} 个镜头
        </span>
      </div>

      {/* Shot types */}
      <div className="mb-4">
        <h4 className="text-[10px] font-medium text-surface-400 uppercase tracking-wider mb-2">
          镜头类型
        </h4>
        <div className="flex flex-wrap gap-2">
          {sortedTypes.map(([type, count]) => (
            <div key={type} className="flex items-center gap-1.5">
              <CameraAngleTag type={type} />
              <span className="text-[10px] font-mono text-zinc-400">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Camera angles */}
      <div className="mb-4">
        <h4 className="text-[10px] font-medium text-surface-400 uppercase tracking-wider mb-2">
          角度
        </h4>
        <div className="flex flex-wrap gap-2">
          {sortedAngles.map(([angle, count]) => (
            <div key={angle} className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border text-zinc-400 bg-surface-750 border-surface-600">
                {angle}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Camera movements */}
      <div>
        <h4 className="text-[10px] font-medium text-surface-400 uppercase tracking-wider mb-2">
          运动方式
        </h4>
        <div className="flex flex-wrap gap-2">
          {sortedMovements.map(([movement, count]) => (
            <div key={movement} className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border text-zinc-400 bg-surface-750 border-surface-600">
                {movement}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
