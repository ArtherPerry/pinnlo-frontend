'use client'

import { useState, useCallback } from 'react'
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from '@/hooks/useTemplates'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import type {
  MessageTemplate,
  CreateTemplateInput,
  TemplateCategory,
  TemplatePlatform,
} from '@/lib/types'

const CATEGORIES: { value: TemplateCategory | ''; label: string }[] = [
  { value: '',          label: 'All categories' },
  { value: 'GREETING',  label: 'Greeting'       },
  { value: 'FAQ',       label: 'FAQ'            },
  { value: 'PROMOTION', label: 'Promotion'      },
  { value: 'FOLLOW_UP', label: 'Follow-up'      },
  { value: 'CLOSING',   label: 'Closing'        },
  { value: 'CUSTOM',    label: 'Custom'         },
]

const PLATFORMS: { value: TemplatePlatform | ''; label: string }[] = [
  { value: '',          label: 'All platforms' },
  { value: 'ALL',       label: 'All platforms' },
  { value: 'FACEBOOK',  label: 'Facebook'      },
  { value: 'WHATSAPP',  label: 'WhatsApp'      },
  { value: 'LINE',      label: 'LINE'          },
]

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  GREETING:  '#E1F5EE',
  FAQ:       '#E6F1FB',
  PROMOTION: '#FAEEDA',
  FOLLOW_UP: '#EEEDFE',
  CLOSING:   '#F1EFE8',
  CUSTOM:    '#FBEAF0',
}

const CATEGORY_TEXT: Record<TemplateCategory, string> = {
  GREETING:  '#0F6E56',
  FAQ:       '#185FA5',
  PROMOTION: '#633806',
  FOLLOW_UP: '#26215C',
  CLOSING:   '#444441',
  CUSTOM:    '#72243E',
}

// ── Template form modal ────────────────────────────────────────────
function TemplateModal({
  template,
  onClose,
}: {
  template?: MessageTemplate
  onClose:   () => void
}) {
  const isEdit = !!template

  const [name,     setName    ] = useState(template?.name     ?? '')
  const [content,  setContent ] = useState(template?.content  ?? '')
  const [category, setCategory] = useState<TemplateCategory>(template?.category ?? 'GREETING')
  const [platform, setPlatform] = useState<TemplatePlatform>(template?.platform ?? 'ALL')
  const [saving,   setSaving  ] = useState(false)

  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate(template?.id ?? '')
  const toast          = useToast()

  // Detect variables in content
  const detectedVars = (content.match(/\{\{[^}]+\}\}/g) ?? [])
    .filter((v, i, a) => a.indexOf(v) === i)

  const handleSave = async () => {
    if (!name.trim())    { toast.show('Enter a template name', 'warning');    return }
    if (!content.trim()) { toast.show('Enter template content', 'warning'); return }

    setSaving(true)
    try {
      const input: CreateTemplateInput = { name, content, category, platform }
      if (isEdit) {
        await updateTemplate.mutateAsync(input)
        toast.show('Template updated ✓', 'success')
      } else {
        await createTemplate.mutateAsync(input)
        toast.show('Template created ✓', 'success')
      }
      onClose()
    } catch {
      toast.show('Failed to save template', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 200, padding: 'var(--space-6) var(--space-4)',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-lg)',
          width: '100%', maxWidth: '560px',
          boxShadow: 'var(--shadow-lg)',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-6)',
          borderBottom: '0.5px solid var(--color-border)',
        }}>
          <span style={{ fontSize: 'var(--text-h3)', fontWeight: 600 }}>
            {isEdit ? 'Edit template' : 'New template'}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, border: 'none',
              background: 'transparent', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', fontSize: 18, color: 'var(--color-muted)',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: 'var(--space-6)',
          display: 'flex', flexDirection: 'column',
          gap: 'var(--space-4)',
        }}>
          <Input
            label="Template name"
            placeholder="Welcome greeting"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <span style={{
                fontSize: 'var(--text-small)', fontWeight: 600,
                color: 'var(--color-ink)', display: 'block',
                marginBottom: 'var(--space-1)',
              }}>
                Category
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                style={{
                  width: '100%', height: '36px',
                  padding: '0 var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-body)',
                  background: 'var(--color-white)',
                  color: 'var(--color-ink)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {CATEGORIES.filter((c) => c.value !== '').map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <span style={{
                fontSize: 'var(--text-small)', fontWeight: 600,
                color: 'var(--color-ink)', display: 'block',
                marginBottom: 'var(--space-1)',
              }}>
                Platform
              </span>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as TemplatePlatform)}
                style={{
                  width: '100%', height: '36px',
                  padding: '0 var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-body)',
                  background: 'var(--color-white)',
                  color: 'var(--color-ink)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {PLATFORMS.filter((p) => p.value !== '').map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span style={{
              fontSize: 'var(--text-small)', fontWeight: 600,
              color: 'var(--color-ink)', display: 'block',
              marginBottom: 'var(--space-1)',
            }}>
              Content
            </span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your template... Use {{name}}, {{product}} etc. for dynamic variables"
              rows={6}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-body)',
                color: 'var(--color-ink)',
                resize: 'vertical',
                outline: 'none',
                lineHeight: 1.65,
              }}
            />
            <p style={{
              fontSize: 'var(--text-small)',
              color: 'var(--color-muted)',
              marginTop: 'var(--space-1)',
              lineHeight: 1.5,
            }}>
              Use <code style={{ background: 'var(--color-bg-2)', padding: '1px 4px', borderRadius: 3 }}>
                {'{{variable}}'}
              </code> syntax for dynamic content that gets filled in when sending.
            </p>
          </div>

          {/* Detected variables */}
          {detectedVars.length > 0 && (
            <div style={{
              background: 'var(--color-teal-50)',
              border: '0.5px solid var(--color-teal-200)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
            }}>
              <span style={{
                fontSize: 'var(--text-small)', fontWeight: 600,
                color: 'var(--color-teal-700)', display: 'block',
                marginBottom: 'var(--space-1)',
              }}>
                Detected variables
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                {detectedVars.map((v) => (
                  <span key={v} style={{
                    fontSize: 'var(--text-small)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-teal-500)',
                    color: 'white',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 500,
                  }}>
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          gap: 'var(--space-2)',
          padding: 'var(--space-4) var(--space-6)',
          borderTop: '0.5px solid var(--color-border)',
        }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            {isEdit ? 'Save changes' : 'Create template'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Template card ──────────────────────────────────────────────────
function TemplateCard({
  template,
  onEdit,
}: {
  template: MessageTemplate
  onEdit:   (t: MessageTemplate) => void
}) {
  const deleteTemplate = useDeleteTemplate()
  const toast          = useToast()

  const handleDelete = async () => {
    if (!confirm(`Delete template "${template.name}"?`)) return
    try {
      await deleteTemplate.mutateAsync(template.id)
      toast.show('Template deleted', 'success')
    } catch {
      toast.show('Failed to delete template', 'error')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(template.content)
    toast.show('Template content copied ✓', 'success')
  }

  return (
    <div style={{
      background: 'var(--color-white)',
      border: '0.5px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      transition: 'border-color var(--transition-fast)',
    }}>
      {/* Color top strip */}
      <div style={{
        height: 4,
        background: CATEGORY_COLORS[template.category],
      }} />

      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1 }}>

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-body)', color: 'var(--color-ink)', marginBottom: 4 }}>
              {template.name}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 'var(--text-caption)', padding: '2px 8px',
                borderRadius: 'var(--radius-full)', fontWeight: 500,
                background: CATEGORY_COLORS[template.category],
                color: CATEGORY_TEXT[template.category],
              }}>
                {template.category.replace('_', ' ')}
              </span>
              <span style={{
                fontSize: 'var(--text-caption)', padding: '2px 8px',
                borderRadius: 'var(--radius-full)', fontWeight: 500,
                background: 'var(--color-bg-2)', color: 'var(--color-muted)',
              }}>
                {template.platform}
              </span>
            </div>
          </div>
        </div>

        {/* Content preview */}
        <div style={{
          fontSize: 'var(--text-small)',
          color: 'var(--color-ink)',
          background: 'var(--color-bg)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3)',
          lineHeight: 1.6,
          flex: 1,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          minHeight: '80px',
        }}>
          {template.content}
        </div>

        {/* Variables */}
        {template.variables.length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
            {template.variables.map((v) => (
              <span key={v} style={{
                fontSize: 'var(--text-caption)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-teal-50)',
                color: 'var(--color-teal-600)',
                border: '0.5px solid var(--color-teal-200)',
                fontFamily: 'var(--font-mono)',
              }}>
                {v}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 'var(--space-2)',
          borderTop: '0.5px solid var(--color-border)',
        }}>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
            Used {template.usageCount}× · {template.createdBy}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            <button
              onClick={handleCopy}
              style={{
                height: 26, padding: '0 10px',
                borderRadius: 'var(--radius-sm)',
                border: '0.5px solid var(--color-border)',
                background: 'transparent', color: 'var(--color-muted)',
                fontSize: 'var(--text-small)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition-fast)',
              }}
            >
              Copy
            </button>
            <button
              onClick={() => onEdit(template)}
              style={{
                height: 26, padding: '0 10px',
                borderRadius: 'var(--radius-sm)',
                border: '0.5px solid var(--color-border)',
                background: 'transparent', color: 'var(--color-muted)',
                fontSize: 'var(--text-small)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition-fast)',
              }}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              style={{
                height: 26, padding: '0 10px',
                borderRadius: 'var(--radius-sm)',
                border: '0.5px solid var(--color-border)',
                background: 'transparent', color: 'var(--color-muted)',
                fontSize: 'var(--text-small)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition-fast)',
              }}
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────
export default function TemplatesPage() {
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | ''>('')
  const [platformFilter, setPlatformFilter] = useState<TemplatePlatform | ''>('')
  const [search,         setSearch        ] = useState('')
  const [debouncedSearch,setDebouncedSearch] = useState('')
  const [showModal,      setShowModal     ] = useState(false)
  const [editTemplate,   setEditTemplate  ] = useState<MessageTemplate | undefined>()
  const [debounceTimer,  setDebounceTimer ] = useState<ReturnType<typeof setTimeout>>()

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => setDebouncedSearch(value), 300)
    setDebounceTimer(timer)
  }, [debounceTimer])

  const { data: templates, isLoading } = useTemplates({
    category: categoryFilter || undefined,
    platform: platformFilter || undefined,
    search:   debouncedSearch || undefined,
  })

  const handleEdit = (template: MessageTemplate) => {
    setEditTemplate(template)
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    setEditTemplate(undefined)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 600 }}>Message templates</h2>
          <p style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)', marginTop: '2px' }}>
            Reusable messages for CRM replies, bot flows, and broadcasts.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          + New template
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-muted)', pointerEvents: 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6" cy="6" r="4.5"/>
              <path d="M9.5 9.5L13 13"/>
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%', height: '34px',
              padding: '0 var(--space-3) 0 34px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-body)',
              color: 'var(--color-ink)',
              background: 'var(--color-white)',
              outline: 'none',
            }}
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as TemplateCategory | '')}
          style={{
            height: '34px', padding: '0 var(--space-3)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-small)',
            background: 'var(--color-white)',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {/* Platform filter */}
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value as TemplatePlatform | '')}
          style={{
            height: '34px', padding: '0 var(--space-3)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-small)',
            background: 'var(--color-white)',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
          }}
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {templates && (
          <span style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)', marginLeft: 'auto' }}>
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {[1,2,3].map((n) => (
            <div key={n} style={{
              height: 240, borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(90deg, var(--color-bg-2) 25%, var(--color-border) 50%, var(--color-bg-2) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
            }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && templates?.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 'var(--space-3)', padding: 'var(--space-12) var(--space-6)',
          background: 'var(--color-white)',
          border: '0.5px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', textAlign: 'center',
        }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--color-border)" strokeWidth="1.5">
            <rect x="4" y="4" width="40" height="40" rx="4"/>
            <path d="M12 16h24M12 24h18M12 32h12"/>
          </svg>
          <div style={{ fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--color-ink)' }}>
            {debouncedSearch || categoryFilter || platformFilter ? 'No templates found' : 'No templates yet'}
          </div>
          <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-muted)', maxWidth: 280, lineHeight: 1.6 }}>
            {debouncedSearch || categoryFilter || platformFilter
              ? 'Try a different search or filter.'
              : 'Create reusable message templates for your team to use in replies, bot flows and broadcasts.'
            }
          </div>
          {!debouncedSearch && !categoryFilter && !platformFilter && (
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
              + Create first template
            </Button>
          )}
        </div>
      )}

      {/* Grid */}
      {!isLoading && templates && templates.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--space-4)',
        }}>
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <TemplateModal
          template={editTemplate}
          onClose={handleClose}
        />
      )}

    </div>
  )
}