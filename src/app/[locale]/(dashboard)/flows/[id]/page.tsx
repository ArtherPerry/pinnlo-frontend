'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useFlow, useSaveFlow, useUpdateFlowStatus } from '@/hooks/useFlows'
import { Button, PlatformIcon } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import type {  FlowNode, FlowNodeType, FlowNodeData } from '@/lib/types'
import styles from './flowEditor.module.css'

// ── Node config ────────────────────────────────────────────────────
const NODE_CONFIG: Record<FlowNodeType, {
  color:  string
  bg:     string
  border: string
  icon:   string
  label:  string
}> = {
  TRIGGER:   { color: 'var(--color-teal-600)', bg: 'var(--color-teal-50)',       border: '#5DCAA5', icon: '⚡', label: 'Trigger'   },
  MESSAGE:   { color: '#185FA5',                bg: 'var(--color-info-light)',    border: '#85B7EB', icon: '💬', label: 'Message'   },
  CONDITION: { color: '#633806',                bg: 'var(--color-warning-light)', border: 'var(--color-warning)', icon: '🔀', label: 'Condition' },
  ACTION:    { color: '#26215C',                bg: '#EEEDFE',                    border: '#AFA9EC', icon: '⚙️', label: 'Action'    },
  DELAY:     { color: '#444441',                bg: 'var(--color-bg-2)',          border: '#B4B2A9', icon: '⏱', label: 'Delay'     },
  TAG:       { color: '#72243E',                bg: '#FBEAF0',                    border: '#ED93B1', icon: '🏷', label: 'Tag'       },
  ASSIGN:    { color: '#3B6D11',                bg: 'var(--color-success-light)', border: '#97C459', icon: '👤', label: 'Assign'    },
  END:       { color: '#5F5E5A',                bg: 'var(--color-bg-2)',          border: 'var(--color-muted-light)', icon: '🔚', label: 'End'       },
}

const ADD_NODE_TYPES: FlowNodeType[] = [
  'MESSAGE', 'CONDITION', 'ACTION', 'DELAY', 'TAG', 'ASSIGN', 'END',
]

const NODE_W = 200
const NODE_H = 72

// ── Arrow between nodes ────────────────────────────────────────────
function Arrow({
  fromX, fromY, toX, toY, label,
}: {
  fromX: number; fromY: number; toX: number; toY: number; label?: string
}) {
  const midX = (fromX + toX) / 2
  const midY = (fromY + toY) / 2

  const path = `M ${fromX} ${fromY} C ${fromX} ${fromY + 40}, ${toX} ${toY - 40}, ${toX} ${toY}`

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="var(--color-teal-300)"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
      {label && (
        <text
          x={midX}
          y={midY - 6}
          textAnchor="middle"
          fontSize="10"
          fill="var(--color-muted)"
          fontWeight="600"
        >
          {label}
        </text>
      )}
    </g>
  )
}

// ── Node component ─────────────────────────────────────────────────
function FlowNodeBox({
  node,
  isSelected,
  onSelect,
  onDragStart,
}: {
  node:       FlowNode
  isSelected: boolean
  onSelect:   (id: string) => void
  onDragStart: (id: string, e: React.MouseEvent) => void
}) {
  const cfg = NODE_CONFIG[node.type]

  const getPreview = () => {
    if (node.data.message)       return node.data.message.slice(0, 40) + (node.data.message.length > 40 ? '...' : '')
    if (node.data.keywords?.length) return `Keywords: ${node.data.keywords.join(', ')}`
    if (node.data.triggerType)   return node.data.triggerType.replace('_', ' ')
    if (node.data.delayMinutes)  return `Wait ${node.data.delayMinutes} min`
    if (node.data.tag)           return `${node.data.tagAction} tag: ${node.data.tag}`
    if (node.data.assignTo)      return `Assign to ${node.data.assignTo}`
    return cfg.label
  }

  return (
    <div
      className={styles.nodeBox}
      style={{
        left:       node.position.x,
        top:        node.position.y,
        width:      NODE_W,
        minHeight:  NODE_H,
        background: cfg.bg,
        border:     `2px solid ${isSelected ? cfg.color : cfg.border}`,
        boxShadow:  isSelected
          ? `0 0 0 3px ${cfg.bg}, 0 0 0 5px ${cfg.border}`
          : '0 2px 6px rgba(0,0,0,0.08)',
      }}
      onClick={() => onSelect(node.id)}
      onMouseDown={(e) => onDragStart(node.id, e)}
    >
      <div className={styles.nodeIconRow}>
        <span className={styles.nodeIcon}>{cfg.icon}</span>
        <span className={styles.nodeTypeLabel} style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </div>
      <div className={styles.nodeLabel} style={{ color: cfg.color }}>
        {node.label}
      </div>
      <div className={styles.nodePreview} style={{ color: cfg.color }}>
        {getPreview()}
      </div>
    </div>
  )
}

// ── Node config panel ──────────────────────────────────────────────
function NodeConfigPanel({
  node,
  onUpdate,
  onDelete,
  onClose,
}: {
  node:     FlowNode
  onUpdate: (id: string, changes: Partial<FlowNode>) => void
  onDelete: (id: string) => void
  onClose:  () => void
}) {
  const cfg   = NODE_CONFIG[node.type]
  const [label, setLabel] = useState(node.label)
  const [data,  setData ] = useState<FlowNodeData>(node.data)

  const handleSave = () => {
    onUpdate(node.id, { label, data })
    onClose()
  }

  const updateData = (key: keyof FlowNodeData, value: FlowNodeData[keyof FlowNodeData]) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className={styles.configPanel}>
      {/* Header */}
      <div className={styles.configPanelHeader} style={{ background: cfg.bg }}>
        <div className={styles.configPanelHeaderLeft}>
          <span>{cfg.icon}</span>
          <span className={styles.configPanelLabel} style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        <button onClick={onClose} className={styles.configPanelClose} style={{ color: cfg.color }}>×</button>
      </div>

      {/* Config */}
      <div className={styles.configBody}>

        {/* Label */}
        <div>
          <label className={styles.fieldLabel}>Node label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={styles.fieldInput}
          />
        </div>

        {/* Type-specific fields */}
        {node.type === 'TRIGGER' && (
          <>
            <div>
              <label className={styles.fieldLabel}>Trigger type</label>
              <select
                value={data.triggerType ?? 'KEYWORD'}
                onChange={(e) => updateData('tagAction', e.target.value as 'ADD' | 'REMOVE')}
                className={styles.fieldSelect}
              >
                <option value="KEYWORD">Keyword match</option>
                <option value="FIRST_MESSAGE">First message</option>
                <option value="POSTBACK">Button postback</option>
                <option value="SCHEDULE">Scheduled</option>
              </select>
            </div>
            {(data.triggerType ?? 'KEYWORD') === 'KEYWORD' && (
              <div>
                <label className={styles.fieldLabel}>Keywords (comma separated)</label>
                <input
                  value={(data.keywords ?? []).join(', ')}
                  onChange={(e) =>
                    updateData('keywords', e.target.value.split(',').map((k) => k.trim()).filter(Boolean))
                  }
                  placeholder="hello, สวัสดี, hi"
                  className={styles.fieldInput}
                />
              </div>
            )}
          </>
        )}

        {node.type === 'MESSAGE' && (
          <div>
            <label className={styles.fieldLabel}>Message content</label>
            <textarea
              value={data.message ?? ''}
              onChange={(e) => updateData('message', e.target.value)}
              placeholder="Type your message... Use {{name}} for personalisation"
              rows={5}
              className={styles.fieldTextarea}
            />
          </div>
        )}

        {node.type === 'CONDITION' && (
          <>
            <div>
              <label className={styles.fieldLabel}>Condition field</label>
              <select
                value={data.conditionField ?? 'tag'}
                onChange={(e) => updateData('conditionField', e.target.value)}
                className={styles.fieldSelect}
              >
                <option value="tag">Has tag</option>
                <option value="assignedTo">Assigned to</option>
                <option value="message">Message contains</option>
              </select>
            </div>
            <div>
              <label className={styles.fieldLabel}>Value</label>
              <input
                value={data.conditionValue ?? ''}
                onChange={(e) => updateData('conditionValue', e.target.value)}
                placeholder="e.g. vip"
                className={styles.fieldInput}
              />
            </div>
            <div className={styles.conditionInfo}>
              ✅ YES path continues to next connected node<br/>
              ❌ NO path goes to the alternative branch
            </div>
          </>
        )}

        {node.type === 'DELAY' && (
          <div>
            <label className={styles.fieldLabel}>Delay (minutes)</label>
            <input
              type="number"
              value={data.delayMinutes ?? 60}
              onChange={(e) => updateData('delayMinutes', parseInt(e.target.value))}
              min={1}
              max={10080}
              className={styles.fieldInput}
            />
            <p className={styles.delayHint}>
              {data.delayMinutes && data.delayMinutes >= 60
                ? `${(data.delayMinutes / 60).toFixed(1)} hours`
                : `${data.delayMinutes ?? 60} minutes`
              }
            </p>
          </div>
        )}

        {node.type === 'TAG' && (
          <>
            <div>
              <label className={styles.fieldLabel}>Action</label>
              <div className={styles.tagActionRow}>
                {(['ADD', 'REMOVE'] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => updateData('tagAction', a)}
                    className={styles.tagActionBtn}
                    style={{
                      border: `1px solid ${data.tagAction === a
                        ? 'var(--color-teal-500)'
                        : 'var(--color-border)'
                      }`,
                      background: data.tagAction === a
                        ? 'var(--color-teal-50)'
                        : 'var(--color-white)',
                      color: data.tagAction === a
                        ? 'var(--color-teal-600)'
                        : 'var(--color-muted)',
                    }}
                  >
                    {a === 'ADD' ? '+ Add tag' : '− Remove tag'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={styles.fieldLabel}>Tag name</label>
              <input
                value={data.tag ?? ''}
                onChange={(e) => updateData('tag', e.target.value)}
                placeholder="e.g. vip, interested"
                className={styles.fieldInput}
              />
            </div>
          </>
        )}

        {node.type === 'ASSIGN' && (
          <div>
            <label className={styles.fieldLabel}>Assign to</label>
            <select
              value={data.assignTo ?? ''}
              onChange={(e) => updateData('assignTo', e.target.value)}
              className={styles.fieldSelect}
            >
              <option value="">— Select team member —</option>
              <option value="Nattawut C.">Nattawut C. (Owner)</option>
              <option value="Pim S.">Pim S. (Manager)</option>
              <option value="Korn T.">Korn T. (Staff)</option>
            </select>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className={styles.configFooter}>
        {node.type !== 'TRIGGER' && (
          <button
            onClick={() => { onDelete(node.id); onClose() }}
            className={styles.deleteNodeBtn}
          >
            Delete node
          </button>
        )}
        <button
          onClick={handleSave}
          className={styles.applyBtn}
        >
          Apply changes
        </button>
      </div>
    </div>
  )
}

// ── Flow editor ────────────────────────────────────────────────────
export default function FlowEditorPage() {
  const params   = useParams()
  const router   = useRouter()
  const locale   = useLocale()
  const flowId   = params.id as string

  const { data: flow, isLoading } = useFlow(flowId)
  const saveFlow                   = useSaveFlow(flowId)
  const updateStatus               = useUpdateFlowStatus(flowId)
  const toast                      = useToast()

  const [nodes,        setNodes       ] = useState<FlowNode[]>([])
  const [selectedId,   setSelectedId  ] = useState<string | null>(null)
  const [showAddMenu,  setShowAddMenu ] = useState(false)
  const [isDirty,      setIsDirty     ] = useState(false)
  const [dragging,     setDragging    ] = useState<{
    id: string; startMouseX: number; startMouseY: number
    startNodeX: number; startNodeY: number
  } | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)

  // Sync nodes from server
  useEffect(() => {
    if (flow?.nodes) setNodes(flow.nodes)
  }, [flow])

  // ── Drag logic ──
  const handleDragStart = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault()
    const node = nodes.find((n) => n.id === id)
    if (!node) return
    setDragging({
      id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startNodeX:  node.position.x,
      startNodeY:  node.position.y,
    })
  }, [nodes])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragging.startMouseX
    const dy = e.clientY - dragging.startMouseY
    setNodes((prev) =>
      prev.map((n) =>
        n.id === dragging.id
          ? { ...n, position: {
              x: Math.max(0, dragging.startNodeX + dx),
              y: Math.max(0, dragging.startNodeY + dy),
            }}
          : n
      )
    )
    setIsDirty(true)
  }, [dragging])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  // ── Add node ──
  const handleAddNode = (type: FlowNodeType) => {
    const selectedNode = nodes.find((n) => n.id === selectedId)
    const lastNode     = nodes[nodes.length - 1]
    const baseNode     = selectedNode ?? lastNode

    const newNode: FlowNode = {
      id:       `node-${Date.now()}`,
      type,
      label:    NODE_CONFIG[type].label,
      position: {
        x: baseNode ? baseNode.position.x : 160,
        y: baseNode ? baseNode.position.y + NODE_H + 80 : 60,
      },
      data:       {},
      nextNodeId: null,
      yesNodeId:  null,
      noNodeId:   null,
    }

    // Auto-connect from selected or last node
    setNodes((prev) => {
      const updated = prev.map((n) =>
        n.id === (selectedId ?? lastNode?.id) && !n.nextNodeId
          ? { ...n, nextNodeId: newNode.id }
          : n
      )
      return [...updated, newNode]
    })

    setSelectedId(newNode.id)
    setShowAddMenu(false)
    setIsDirty(true)
  }

  // ── Update node ──
  const handleUpdateNode = (id: string, changes: Partial<FlowNode>) => {
    setNodes((prev) =>
      prev.map((n) => n.id === id ? { ...n, ...changes } : n)
    )
    setIsDirty(true)
  }

  // ── Delete node ──
  const handleDeleteNode = (id: string) => {
    setNodes((prev) => {
      const filtered = prev.filter((n) => n.id !== id)
      // Remove references to deleted node
      return filtered.map((n) => ({
        ...n,
        nextNodeId: n.nextNodeId === id ? null : n.nextNodeId,
        yesNodeId:  n.yesNodeId  === id ? null : n.yesNodeId,
        noNodeId:   n.noNodeId   === id ? null : n.noNodeId,
      }))
    })
    setSelectedId(null)
    setIsDirty(true)
  }

  // ── Save ──
  const handleSave = async () => {
    if (!flow) return
    try {
      await saveFlow.mutateAsync({ ...flow, nodes })
      setIsDirty(false)
      toast.show('Flow saved', 'success')
    } catch {
      toast.show('Failed to save flow', 'error')
    }
  }

  // ── Toggle status ──
  const handleToggleStatus = async () => {
    if (!flow) return
    const next = flow.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await updateStatus.mutateAsync(next)
      toast.show(next === 'ACTIVE' ? 'Flow activated' : 'Flow paused', 'success')
    } catch {
      toast.show('Failed to update status', 'error')
    }
  }

  // ── Canvas size ──
  const canvasW = Math.max(800, ...nodes.map((n) => n.position.x + NODE_W + 100))
  const canvasH = Math.max(600, ...nodes.map((n) => n.position.y + NODE_H + 100))

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null

  if (isLoading) return (
    <div className={styles.centerMessage}>
      Loading flow...
    </div>
  )

  if (!flow) return (
    <div className={styles.centerMessage}>
      Flow not found
    </div>
  )

  return (
    <div className={styles.editorRoot}>

      {/* Editor toolbar */}
      <div className={styles.toolbar}>
        {/* Back + title */}
        <div className={styles.toolbarLeft}>
          <button
            onClick={() => router.push(`/${locale}/flows`)}
            className={styles.backBtn}
          >
            ← Flows
          </button>
          <div>
            <div className={styles.flowName}>
              {flow.name}
            </div>
            <div className={styles.flowMeta}>
              <PlatformIcon platform={flow.platform} size={11} />
              {flow.clientName}
              {isDirty && (
                <span className={styles.dirtyIndicator}>
                  · Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.toolbarActions}>
          {/* Add node */}
          <div className={styles.addNodeWrap}>
            <button
              onClick={() => setShowAddMenu((v) => !v)}
              className={styles.addNodeBtn}
            >
              + Add node
            </button>
            {showAddMenu && (
              <div className={styles.addMenu}>
                {ADD_NODE_TYPES.map((type) => {
                  const cfg = NODE_CONFIG[type]
                  return (
                    <button
                      key={type}
                      onClick={() => handleAddNode(type)}
                      className={styles.addMenuItem}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = cfg.bg
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                      }}
                    >
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button
            onClick={handleToggleStatus}
            disabled={updateStatus.isPending}
            className={styles.statusBtn}
          >
            {flow.status === 'ACTIVE' ? '⏸ Pause' : '▶ Activate'}
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={saveFlow.isPending}
            disabled={!isDirty}
          >
            Save flow
          </Button>
        </div>
      </div>

      {/* Canvas + config panel */}
      <div className={styles.canvasArea}>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={styles.canvas}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => {
            setSelectedId(null)
            setShowAddMenu(false)
          }}
        >
          {/* Grid background */}
          <div className={styles.gridBg} />

          {/* SVG arrows */}
          <svg
            className={styles.arrowsSvg}
            style={{ width: canvasW, height: canvasH }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8" markerHeight="6"
                refX="8" refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill="var(--color-teal-400)"
                />
              </marker>
            </defs>
            {nodes.map((node) => {
              const arrows = []

              if (node.nextNodeId) {
                const target = nodes.find((n) => n.id === node.nextNodeId)
                if (target) {
                  arrows.push(
                    <Arrow
                      key={`${node.id}-next`}
                      fromX={node.position.x + NODE_W / 2}
                      fromY={node.position.y + NODE_H}
                      toX={target.position.x + NODE_W / 2}
                      toY={target.position.y}
                      label={node.type === 'CONDITION' ? 'YES' : undefined}
                    />
                  )
                }
              }

              if (node.type === 'CONDITION' && node.noNodeId) {
                const target = nodes.find((n) => n.id === node.noNodeId)
                if (target) {
                  arrows.push(
                    <Arrow
                      key={`${node.id}-no`}
                      fromX={node.position.x + NODE_W}
                      fromY={node.position.y + NODE_H / 2}
                      toX={target.position.x}
                      toY={target.position.y + NODE_H / 2}
                      label="NO"
                    />
                  )
                }
              }

              return arrows
            })}
          </svg>

          {/* Nodes */}
          <div className={styles.nodesLayer} style={{ width: canvasW, height: canvasH }}>
            {nodes.map((node) => (
              <FlowNodeBox
                key={node.id}
                node={node}
                isSelected={selectedId === node.id}
                onSelect={(id) => {
                  setSelectedId(id)
                  setShowAddMenu(false)
                }}
                onDragStart={handleDragStart}
              />
            ))}
          </div>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className={styles.canvasEmpty}>
              <div className={styles.canvasEmptyIcon}>⚡</div>
              <div className={styles.canvasEmptyTitle}>
                No nodes yet
              </div>
              <div className={styles.canvasEmptySub}>
                Click &quot;+ Add node&quot; to build your flow
              </div>
            </div>
          )}
        </div>

        {/* Config panel */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={handleUpdateNode}
            onDelete={handleDeleteNode}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  )
}