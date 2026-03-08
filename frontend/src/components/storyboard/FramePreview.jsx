import { Image } from 'lucide-react'
import { API_URL } from '../../utils/constants'

export default function FramePreview({ framePath, alt }) {
  const url = framePath
    ? `${API_URL}/${framePath.replace(/\\/g, '/')}`
    : null

  if (!url) {
    return (
      <div className="aspect-video bg-surface-850 rounded-lg border border-surface-700/50 flex flex-col items-center justify-center">
        <Image className="w-10 h-10 text-surface-600 mb-2" />
        <span className="text-[11px] font-mono text-surface-600">
          Frame not generated
        </span>
      </div>
    )
  }

  return (
    <div className="aspect-video bg-surface-850 rounded-lg border border-surface-700/50 overflow-hidden">
      <img
        src={url}
        alt={alt || 'Storyboard frame'}
        className="w-full h-full object-cover"
      />
    </div>
  )
}
