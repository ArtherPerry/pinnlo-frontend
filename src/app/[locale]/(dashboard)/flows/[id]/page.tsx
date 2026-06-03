'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useFlow, useSaveFlow, useUpdateFlowStatus } from '@/hooks/useFlows'
import { Button, PlatformIcon } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import type {  FlowNode, FlowNodeType, FlowNodeData } from '@/lib/types'

// ── Node config ────────────────────────────────────────────────────
const NODE_CONFIG: Record<FlowNodeType, {
  color:  string
  bg:     string
  border: string
  icon:   string
  label:  string
}> = {
  TRIGGER:   { color: '#0F6E56', bg: '#E1F5EE', border: '#5DCAA5', icon: '⚡', label: 'Trigger'   },
  MESSAGE:   { color: '#185FA5', bg: '#E6F1FB', border: '#85B7EB', icon: '💬', label: 'Message'   },
  CONDITION: { color: '#633806', bg: '#FAEEDA', border: '#EF9F27', icon: '🔀', label: 'Condition' },
  ACTION:    { color: '#26215C', bg: '#EEEDFE', border: '#AFA9EC', icon: '⚙️', label: 'Action'    },
  DELAY:     { color: '#444441', bg: '#F1EFE8', border: '#B4B2A9', icon: '⏱', label: 'Delay'     },
  TAG:       { color: '#72243E', bg: '#FBEAF0', border: '#ED93B1', icon: '🏷', label: 'Tag'       },
  ASSIGN:    { color: '#3B6D11', bg: '#EAF3DE', border: '#97C459', icon: '👤', label: 'Assign'    },
  END:       { color: '#5F5E5A', bg: '#F1EFE8', border: '#888780', icon: '🔚', label: 'End'       },
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
      style={{
        position:     'absolute',
        left:         node.position.x,
        top:          node.position.y,
        width:        NODE_W,
        minHeight:    NODE_H,
        background:   cfg.bg,
        border:       `2px solid ${isSelected ? cfg.color : cfg.border}`,
        borderRadius: 10,
        padding:      '10px 12px',
        cursor:       'grab',
        userSelect:   'none',
        boxShadow:    isSelected
          ? `0 0 0 3px ${cfg.bg}, 0 0 0 5px ${cfg.border}`
          : '0 2px 6px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.15s',
      }}
      onClick={() => onSelect(node.id)}
      onMouseDown={(e) => onDragStart(node.id, e)}
    >
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: 6, marginBottom: 4,
      }}>
        <span style={{ fontSize: 13 }}>{cfg.icon}</span>
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: cfg.color, letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {cfg.label}
        </span>
      </div>
      <div style={{
        fontSize: 12, color: cfg.color,
        lineHeight: 1.4, wordBreak: 'break-word',
        fontWeight: 500,
      }}>
        {node.label}
      </div>
      <div style={{
        fontSize: 11, color: cfg.color,
        opacity: 0.65, marginTop: 2,
        lineHeight: 1.4, wordBreak: 'break-word',
      }}>
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
    <div style={{
      position: 'absolute', top: 0, right: 0,
      width: 280, height: '100%',
      background: 'var(--color-white)',
      borderLeft: '0.5px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 10,
      boxShadow: '-4px 0 16px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '0.5px solid var(--color-border)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        background: cfg.bg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{cfg.icon}</span>
          <span style={{ fontWeight: 600, fontSize: 'var(--text-body)', color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        <button onClick={onClose} style={{
          width: 22, height: 22, border: 'none',
          background: 'transparent', cursor: 'pointer',
          fontSize: 14, color: cfg.color,
          borderRadius: 4,
        }}>×</button>
      </div>

      {/* Config */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: 'var(--space-4)',
        display: 'flex', flexDirection: 'column',
        gap: 'var(--space-3)',
      }}>

        {/* Label */}
        <div>
          <label style={{
            fontSize: 'var(--text-small)', fontWeight: 600,
            color: 'var(--color-ink)', display: 'block', marginBottom: 4,
          }}>Node label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{
              width: '100%', height: 34,
              padding: '0 10px',
              border: '1px solid var(--color-border)',
              borderRadius: 6, fontSize: 13,
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-ink)',
              outline: 'none',
            }}
          />
        </div>

        {/* Type-specific fields */}
        {node.type === 'TRIGGER' && (
          <>
            <div>
              <label style={{
                fontSize: 'var(--text-small)', fontWeight: 600,
                color: 'var(--color-ink)', display: 'block', marginBottom: 4,
              }}>Trigger type</label>
              <select
                value={data.triggerType ?? 'KEYWORD'}
                onChange={(e) => updateData('tagAction', e.target.value as 'ADD' | 'REMOVE')}
                style={{
                  width: '100%', height: 34,
                  padding: '0 8px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6, fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                  background: 'var(--color-white)',
                  color: 'var(--color-ink)',
                }}
              >
                <option value="KEYWORD">Keyword match</option>
                <option value="FIRST_MESSAGE">First message</option>
                <option value="POSTBACK">Button postback</option>
                <option value="SCHEDULE">Scheduled</option>
              </select>
            </div>
            {(data.triggerType ?? 'KEYWORD') === 'KEYWORD' && (
              <div>
                <label style={{
                  fontSize: 'var(--text-small)', fontWeight: 600,
                  color: 'var(--color-ink)', display: 'block', marginBottom: 4,
                }}>Keywords (comma separated)</label>
                <input
                  value={(data.keywords ?? []).join(', ')}
                  onChange={(e) =>
                    updateData('keywords', e.target.value.split(',').map((k) => k.trim()).filter(Boolean))
                  }
                  placeholder="hello, สวัสดี, hi"
                  style={{
                    width: '100%', height: 34,
                    padding: '0 10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 6, fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--color-ink)',
                    outline: 'none',
                  }}
                />
              </div>
            )}
          </>
        )}

        {node.type === 'MESSAGE' && (
          <div>
            <label style={{
              fontSize: 'var(--text-small)', fontWeight: 600,
              color: 'var(--color-ink)', display: 'block', marginBottom: 4,
            }}>Message content</label>
            <textarea
              value={data.message ?? ''}
              onChange={(e) => updateData('message', e.target.value)}
              placeholder="Type your message... Use {{name}} for personalisation"
              rows={5}
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid var(--color-border)',
                borderRadius: 6, fontSize: 13,
                fontFamily: 'var(--font-sans)',
                color: 'var(--color-ink)',
                resize: 'vertical', outline: 'none',
                lineHeight: 1.6,
              }}
            />
          </div>
        )}

        {node.type === 'CONDITION' && (
          <>
            <div>
              <label style={{
                fontSize: 'var(--text-small)', fontWeight: 600,
                color: 'var(--color-ink)', display: 'block', marginBottom: 4,
              }}>Condition field</label>
              <select
                value={data.conditionField ?? 'tag'}
                onChange={(e) => updateData('conditionField', e.target.value)}
                style={{
                  width: '100%', height: 34, padding: '0 8px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6, fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                  background: 'var(--color-white)',
                  color: 'var(--color-ink)',
                }}
              >
                <option value="tag">Has tag</option>
                <option value="assignedTo">Assigned to</option>
                <option value="message">Message contains</option>
              </select>
            </div>
            <div>
              <label style={{
                fontSize: 'var(--text-small)', fontWeight: 600,
                color: 'var(--color-ink)', display: 'block', marginBottom: 4,
              }}>Value</label>
              <input
                value={data.conditionValue ?? ''}
                onChange={(e) => updateData('conditionValue', e.target.value)}
                placeholder="e.g. vip"
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6, fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--color-ink)', outline: 'none',
                }}
              />
            </div>
            <div style={{
              padding: '8px 10px',
              background: 'var(--color-bg)',
              borderRadius: 6,
              fontSize: 12, color: 'var(--color-muted)',
              lineHeight: 1.5,
            }}>
              ✅ YES path continues to next connected node<br/>
              ❌ NO path goes to the alternative branch
            </div>
          </>
        )}

        {node.type === 'DELAY' && (
          <div>
            <label style={{
              fontSize: 'var(--text-small)', fontWeight: 600,
              color: 'var(--color-ink)', display: 'block', marginBottom: 4,
            }}>Delay (minutes)</label>
            <input
              type="number"
              value={data.delayMinutes ?? 60}
              onChange={(e) => updateData('delayMinutes', parseInt(e.target.value))}
              min={1}
              max={10080}
              style={{
                width: '100%', height: 34, padding: '0 10px',
                border: '1px solid var(--color-border)',
                borderRadius: 6, fontSize: 13,
                fontFamily: 'var(--font-sans)',
                color: 'var(--color-ink)', outline: 'none',
              }}
            />
            <p style={{
              fontSize: 11, color: 'var(--color-muted)',
              marginTop: 4,
            }}>
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
              <label style={{
                fontSize: 'var(--text-small)', fontWeight: 600,
                color: 'var(--color-ink)', display: 'block', marginBottom: 4,
              }}>Action</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['ADD', 'REMOVE'] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => updateData('tagAction', a)}
                    style={{
                      flex: 1, height: 32,
                      border: `1px solid ${data.tagAction === a
                        ? 'var(--color-teal-500)'
                        : 'var(--color-border)'
                      }`,
                      borderRadius: 6,
                      background: data.tagAction === a
                        ? 'var(--color-teal-50)'
                        : 'var(--color-white)',
                      color: data.tagAction === a
                        ? 'var(--color-teal-600)'
                        : 'var(--color-muted)',
                      fontSize: 12, fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {a === 'ADD' ? '+ Add tag' : '− Remove tag'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{
                fontSize: 'var(--text-small)', fontWeight: 600,
                color: 'var(--color-ink)', display: 'block', marginBottom: 4,
              }}>Tag name</label>
              <input
                value={data.tag ?? ''}
                onChange={(e) => updateData('tag', e.target.value)}
                placeholder="e.g. vip, interested"
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6, fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--color-ink)', outline: 'none',
                }}
              />
            </div>
          </>
        )}

        {node.type === 'ASSIGN' && (
          <div>
            <label style={{
              fontSize: 'var(--text-small)', fontWeight: 600,
              color: 'var(--color-ink)', display: 'block', marginBottom: 4,
            }}>Assign to</label>
            <select
              value={data.assignTo ?? ''}
              onChange={(e) => updateData('assignTo', e.target.value)}
              style={{
                width: '100%', height: 34, padding: '0 8px',
                border: '1px solid var(--color-border)',
                borderRadius: 6, fontSize: 13,
                fontFamily: 'var(--font-sans)',
                background: 'var(--color-white)',
                color: 'var(--color-ink)',
              }}
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
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        borderTop: '0.5px solid var(--color-border)',
        display: 'flex', gap: 'var(--space-2)',
      }}>
        {node.type !== 'TRIGGER' && (
          <button
            onClick={() => { onDelete(node.id); onClose() }}
            style={{
              height: 30, padding: '0 12px',
              borderRadius: 6,
              border: '0.5px solid var(--color-danger)',
              background: 'var(--color-danger-light)',
              color: 'var(--color-danger)',
              fontSize: 12, cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
            }}
          >
            Delete node
          </button>
        )}
        <button
          onClick={handleSave}
          style={{
            flex: 1, height: 30,
            borderRadius: 6, border: 'none',
            background: 'var(--color-teal-500)',
            color: 'white', fontSize: 12,
            fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
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
      toast.show('Flow saved ✓', 'success')
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
      toast.show(next === 'ACTIVE' ? 'Flow activated ✓' : 'Flow paused', 'success')
    } catch {
      toast.show('Failed to update status', 'error')
    }
  }

  // ── Canvas size ──
  const canvasW = Math.max(800, ...nodes.map((n) => n.position.x + NODE_W + 100))
  const canvasH = Math.max(600, ...nodes.map((n) => n.position.y + NODE_H + 100))

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null

  if (isLoading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', color: 'var(--color-muted)',
    }}>
      Loading flow...
    </div>
  )

  if (!flow) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', color: 'var(--color-muted)',
    }}>
      Flow not found
    </div>
  )

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      gap: 0,
      height: 'calc(100vh - var(--header-height))',
      margin: 'calc(-1 * var(--space-6))',
      overflow: 'hidden',
    }}>

      {/* Editor toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-5)',
        borderBottom: '0.5px solid var(--color-border)',
        background: 'var(--color-white)',
        gap: 'var(--space-3)',
        flexShrink: 0,
        zIndex: 5,
      }}>
        {/* Back + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={() => router.push(`/${locale}/flows`)}
            style={{
              height: 30, padding: '0 10px',
              borderRadius: 'var(--radius-md)',
              border: '0.5px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-muted)',
              fontSize: 'var(--text-small)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            ← Flows
          </button>
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-body)', color: 'var(--color-ink)' }}>
              {flow.name}
            </div>
            <div style={{
              fontSize: 'var(--text-small)',
              color: 'var(--color-muted)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <PlatformIcon platform={flow.platform} size={11} />
              {flow.clientName}
              {isDirty && (
                <span style={{
                  marginLeft: 4,
                  color: 'var(--color-warning)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 500,
                }}>
                  · Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          {/* Add node */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAddMenu((v) => !v)}
              style={{
                height: 32, padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '0.5px solid var(--color-teal-500)',
                background: 'var(--color-teal-50)',
                color: 'var(--color-teal-600)',
                fontSize: 'var(--text-small)',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              + Add node
            </button>
            {showAddMenu && (
              <div style={{
                position: 'absolute', top: '100%', left: 0,
                marginTop: 4,
                background: 'var(--color-white)',
                border: '0.5px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
                overflow: 'hidden',
                zIndex: 100,
                minWidth: 160,
              }}>
                {ADD_NODE_TYPES.map((type) => {
                  const cfg = NODE_CONFIG[type]
                  return (
                    <button
                      key={type}
                      onClick={() => handleAddNode(type)}
                      style={{
                        display: 'flex', alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '8px 14px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-ink)',
                        fontSize: 'var(--text-small)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        textAlign: 'left',
                        transition: 'background var(--transition-fast)',
                      }}
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
            style={{
              height: 32, padding: '0 12px',
              borderRadius: 'var(--radius-md)',
              border: '0.5px solid var(--color-border)',
              background: 'var(--color-white)',
              color: 'var(--color-muted)',
              fontSize: 'var(--text-small)',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
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
      <div style={{
        flex: 1, display: 'flex',
        overflow: 'hidden',
        background: '#F7F6F3',
        position: 'relative',
      }}>

        {/* Canvas */}
        <div
          ref={canvasRef}
          style={{
            flex: 1, overflow: 'auto',
            position: 'relative',
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => {
            setSelectedId(null)
            setShowAddMenu(false)
          }}
        >
          {/* Grid background */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              radial-gradient(circle, #D3D1C7 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }} />

          {/* SVG arrows */}
          <svg
            style={{
              position: 'absolute', top: 0, left: 0,
              width: canvasW, height: canvasH,
              pointerEvents: 'none',
              overflow: 'visible',
            }}
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
          <div style={{
            position: 'relative',
            width: canvasW, height: canvasH,
          }}>
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
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column', gap: 8,
              color: 'var(--color-muted)',
            }}>
              <div style={{ fontSize: 32 }}>⚡</div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-body)' }}>
                No nodes yet
              </div>
              <div style={{ fontSize: 'var(--text-small)' }}>
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