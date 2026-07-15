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
import styles from './templates.module.css'

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
  GREETING:  'var(--color-teal-50)',
  FAQ:       'var(--color-info-light)',
  PROMOTION: 'var(--color-warning-light)',
  FOLLOW_UP: '#EEEDFE',
  CLOSING:   'var(--color-bg-2)',
  CUSTOM:    '#FBEAF0',
}

const CATEGORY_TEXT: Record<TemplateCategory, string> = {
  GREETING:  'var(--color-teal-600)',
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
        toast.show('Template updated', 'success')
      } else {
        await createTemplate.mutateAsync(input)
        toast.show('Template created', 'success')
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
      className={styles.modalOverlay}
      onClick={onClose}
    >
      <div
        className={styles.modalBox}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>
            {isEdit ? 'Edit template' : 'New template'}
          </span>
          <button
            onClick={onClose}
            className={styles.modalClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <Input
            label="Template name"
            placeholder="Welcome greeting"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className={styles.fieldGrid}>
            <div>
              <span className={styles.fieldLabel}>
                Category
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                className={styles.fieldSelect}
              >
                {CATEGORIES.filter((c) => c.value !== '').map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <span className={styles.fieldLabel}>
                Platform
              </span>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as TemplatePlatform)}
                className={styles.fieldSelect}
              >
                {PLATFORMS.filter((p) => p.value !== '').map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className={styles.fieldLabel}>
              Content
            </span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your template... Use {{name}}, {{product}} etc. for dynamic variables"
              rows={6}
              className={styles.contentTextarea}
            />
            <p className={styles.contentHelp}>
              Use <code className={styles.inlineCode}>
                {'{{variable}}'}
              </code> syntax for dynamic content that gets filled in when sending.
            </p>
          </div>

          {/* Detected variables */}
          {detectedVars.length > 0 && (
            <div className={styles.varsBox}>
              <span className={styles.varsLabel}>
                Detected variables
              </span>
              <div className={styles.varsWrap}>
                {detectedVars.map((v) => (
                  <span key={v} className={styles.varChip}>
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
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
    toast.show('Template content copied', 'success')
  }

  return (
    <div className={styles.card}>
      {/* Color top strip */}
      <div className={styles.colorStrip} style={{ background: CATEGORY_COLORS[template.category] }} />

      <div className={styles.cardBody}>

        {/* Top row */}
        <div className={styles.cardTopRow}>
          <div className={styles.cardNameWrap}>
            <div className={styles.cardName}>
              {template.name}
            </div>
            <div className={styles.badgeRow}>
              <span
                className={styles.categoryBadge}
                style={{
                  background: CATEGORY_COLORS[template.category],
                  color: CATEGORY_TEXT[template.category],
                }}
              >
                {template.category.replace('_', ' ')}
              </span>
              <span className={styles.platformBadge}>
                {template.platform}
              </span>
            </div>
          </div>
        </div>

        {/* Content preview */}
        <div className={styles.contentPreview}>
          {template.content}
        </div>

        {/* Variables */}
        {template.variables.length > 0 && (
          <div className={styles.cardVarsWrap}>
            {template.variables.map((v) => (
              <span key={v} className={styles.cardVarChip}>
                {v}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className={styles.cardFooter}>
          <div className={styles.cardUsage}>
            Used {template.usageCount}× · {template.createdBy}
          </div>
          <div className={styles.cardActionsWrap}>
            <button
              onClick={handleCopy}
              className={styles.cardActionBtn}
            >
              Copy
            </button>
            <button
              onClick={() => onEdit(template)}
              className={styles.cardActionBtn}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className={styles.cardActionBtn}
              aria-label={`Delete ${template.name}`}
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
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Message templates</h2>
          <p className={styles.pageSub}>
            Reusable messages for CRM replies, bot flows, and broadcasts.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          + New template
        </Button>
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
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
            className={styles.searchInput}
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as TemplateCategory | '')}
          className={styles.filterSelect}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {/* Platform filter */}
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value as TemplatePlatform | '')}
          className={styles.filterSelect}
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {templates && (
          <span className={styles.resultCount}>
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className={styles.cardsGrid}>
          {[1,2,3].map((n) => (
            <div key={n} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && templates?.length === 0 && (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--color-border)" strokeWidth="1.5">
            <rect x="4" y="4" width="40" height="40" rx="4"/>
            <path d="M12 16h24M12 24h18M12 32h12"/>
          </svg>
          <div className={styles.emptyTitle}>
            {debouncedSearch || categoryFilter || platformFilter ? 'No templates found' : 'No templates yet'}
          </div>
          <div className={styles.emptySub}>
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
        <div className={styles.cardsGrid}>
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