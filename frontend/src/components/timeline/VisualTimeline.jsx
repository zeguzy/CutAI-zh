import { useEffect, useMemo, useCallback } from 'react'
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Clock } from 'lucide-react'
import useStoryboardStore from '../../stores/useStoryboardStore'
import TimelineNode from './TimelineNode'

// Register custom node types (stable reference)
const nodeTypes = { timeline: TimelineNode }

// Spacing between nodes
const NODE_GAP_X = 260
const NODE_START_X = 50
const NODE_Y = 120

export default function VisualTimeline() {
  const scenes = useStoryboardStore((s) => s.scenes)
  const selectedSceneId = useStoryboardStore((s) => s.selectedSceneId)
  const selectScene = useStoryboardStore((s) => s.selectScene)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Rebuild nodes/edges when scenes change (one-way: Zustand → React Flow)
  useEffect(() => {
    if (!scenes.length) {
      setNodes([])
      setEdges([])
      return
    }

    const newNodes = scenes.map((scene, i) => ({
      id: String(scene.id),
      type: 'timeline',
      position: { x: NODE_START_X + i * NODE_GAP_X, y: NODE_Y },
      data: { scene },
      selected: scene.id === selectedSceneId,
    }))

    const newEdges = scenes.slice(0, -1).map((scene, i) => ({
      id: `e-${scene.id}-${scenes[i + 1].id}`,
      source: String(scene.id),
      target: String(scenes[i + 1].id),
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3a3a4a', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#52526a',
        width: 16,
        height: 16,
      },
    }))

    setNodes(newNodes)
    setEdges(newEdges)
  }, [scenes, selectedSceneId, setNodes, setEdges])

  // Node click → select scene in Zustand (one-way callback)
  const onNodeClick = useCallback(
    (_event, node) => {
      const sceneId = Number(node.id) || node.id
      selectScene(selectedSceneId === sceneId ? null : sceneId)
    },
    [selectScene, selectedSceneId],
  )

  // Empty state
  if (!scenes.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-surface-600" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-1">暂无时间线</h3>
        <p className="text-xs text-surface-500 text-center max-w-xs">
          请先生成分镜板。可视化时间线将在此处按顺序展示各个场景。
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-[500px] rounded-xl border border-surface-700 overflow-hidden bg-surface-850">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        className="cutai-timeline"
      >
        <Controls
          showInteractive={false}
          className="!bg-surface-800 !border-surface-700 !shadow-xl [&>button]:!bg-surface-750 [&>button]:!border-surface-600 [&>button]:!text-zinc-400 [&>button:hover]:!bg-surface-700"
        />
        <Background
          color="#1a1a24"
          gap={24}
          size={1}
        />
      </ReactFlow>
    </div>
  )
}
