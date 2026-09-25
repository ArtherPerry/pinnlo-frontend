'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { X, AlertTriangle, FileText } from 'lucide-react'
import {
  REPORT_LANGUAGES,
  completedMonths,
  useAnalystSummary,
  useApproveSummary,
  useGenerateSummary,
  useUpdateSummary,
  type ReportLanguage,
} from '@/hooks/useReport'
import { useToast } from '@/hooks/useToast'
import { apiErrorMessage, cn, formatDate } from '@/lib/utils'
import styles from './ReportPanel.module.css'

/**
 * The Report button and the panel it opens.
 *
 * A report covers one calendar month. Its summary is written by AI from
 * computed findings, and nothing written by AI goes into a client's report
 * until someone at the agency has approved it.
 */
export function ReportLauncher({ clientId, clientName }: { clientId: string | null; clientName?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className={styles.launch}
        onClick={() => setOpen(true)}
        disabled={!clientId}
      >
        <FileText size={15} aria-hidden="true" /> Report
      </button>
      {open && clientId && (
        <ReportPanel clientId={clientId} clientName={clientName ?? ''} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

function ReportPanel({ clientId, clientName, onClose }: {
  clientId: string
  clientName: string
  onClose: () => void
}) {
  const locale = useLocale()
  const toast  = useToast()
  const months = useMemo(() => completedMonths(12, locale), [locale])

  const [monthKey, setMonthKey] = useState(months[0].key)
  const [language, setLanguage] = useState<ReportLanguage>('en')
  const month = months.find((m) => m.key === monthKey) ?? months[0]
  const vars  = { clientId, from: month.from, to: month.to, language }

  const { data: summary, isLoading } = useAnalystSummary(clientId, month.from, month.to, language)
  const generate = useGenerateSummary()
  const update   = useUpdateSummary()
  const approve  = useApproveSummary()

  const [draft,   setDraft  ] = useState('')
  const [editing, setEditing] = useState(false)

  // A different month, language or saved version starts from the saved text.
  useEffect(() => {
    setDraft(summary?.content ?? '')
    setEditing(false)
  }, [summary?.content, summary?.status, monthKey, language])

  const busy     = generate.isPending || update.isPending || approve.isPending
  const dirty    = !!summary && draft.trim() !== summary.content
  const isDraft  = summary?.status === 'DRAFT'
  const editable = !!summary && (isDraft || editing)
  const langName = REPORT_LANGUAGES.find((l) => l.value === language)?.label

  const run = async (action: () => Promise<unknown>, success: string, failure: string) => {
    try {
      await action()
      toast.show(success, 'success')
    } catch (error) {
      toast.show(apiErrorMessage(error, failure), 'error')
    }
  }

  const handleWrite = () => {
    // Rewriting replaces the text, including anything the agency changed.
    if (summary?.edited || dirty) {
      if (!window.confirm('Rewriting replaces the current text, including your edits. Continue?')) return
    }
    void run(() => generate.mutateAsync(vars), 'Summary written', 'Could not write the summary')
  }

  const handleSave = () =>
    run(() => update.mutateAsync({ ...vars, content: draft }), 'Changes saved', 'Could not save the changes')

  // Unsaved edits are saved first, so what gets approved is what is on screen.
  const handleApprove = () =>
    run(async () => {
      if (dirty) await update.mutateAsync({ ...vars, content: draft })
      await approve.mutateAsync(vars)
    }, 'Summary approved', 'Could not approve the summary')

  const openReport = () =>
    window.open(`/${locale}/reports/print?client=${clientId}&month=${monthKey}&lang=${language}`, '_blank')

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.panel} onClick={(e) => e.stopPropagation()} aria-label="Report">
        <header className={styles.head}>
          <div>
            <h2 className={styles.title}>Report</h2>
            <p className={styles.sub}>{clientName}</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className={styles.controls}>
          <label className={styles.field}>
            <span className={styles.label}>Month</span>
            <select
              className={styles.select}
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              disabled={busy}
            >
              {months.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </label>

          <div className={styles.field}>
            <span className={styles.label}>Language</span>
            <div className={styles.languages} role="group" aria-label="Report language">
              {REPORT_LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  className={cn(styles.language, language === l.value && styles.languageActive)}
                  onClick={() => setLanguage(l.value)}
                  aria-pressed={language === l.value}
                  disabled={busy}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className={styles.summary}>
          <div className={styles.summaryHead}>
            <h3 className={styles.summaryTitle}>Summary</h3>
            {summary && (
              <span className={cn(styles.badge, isDraft ? styles.badgeDraft : styles.badgeApproved)}>
                {isDraft ? 'Draft' : 'Approved'}
              </span>
            )}
          </div>

          {isLoading && <p className={styles.muted}>Loading…</p>}

          {!isLoading && !summary && (
            <div className={styles.empty}>
              <p>No summary for {month.label} in {langName} yet.</p>
              <button type="button" className={styles.primary} onClick={handleWrite} disabled={busy}>
                {generate.isPending ? 'Writing…' : 'Write summary'}
              </button>
              <p className={styles.hint}>
                Written from this month&apos;s figures. You can write it up to three times per month and
                language, and edit it freely.
              </p>
            </div>
          )}

          {summary && (
            <>
              {summary.unverifiedNumbers.length > 0 && (
                <div className={styles.warning}>
                  <AlertTriangle size={15} aria-hidden="true" />
                  <span>
                    Check {summary.unverifiedNumbers.length === 1 ? 'this number' : 'these numbers'} —{' '}
                    {summary.unverifiedNumbers.length === 1 ? 'it does' : 'they do'} not appear in the
                    month&apos;s figures: <strong>{summary.unverifiedNumbers.join(', ')}</strong>
                  </span>
                </div>
              )}

              {editable ? (
                <textarea
                  className={styles.text}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={14}
                  disabled={busy}
                />
              ) : (
                <div className={styles.approvedText}>{summary.content}</div>
              )}

              {!isDraft && !editing && summary.approvedAt && (
                <p className={styles.meta}>
                  Approved by {summary.approvedBy ?? 'someone at the agency'} on{' '}
                  {formatDate(summary.approvedAt, locale, { dateStyle: 'medium' })}
                </p>
              )}

              <div className={styles.actions}>
                {editable ? (
                  <>
                    <button type="button" className={styles.primary} onClick={handleApprove} disabled={busy}>
                      {approve.isPending ? 'Approving…' : 'Approve'}
                    </button>
                    <button type="button" className={styles.secondary} onClick={handleSave} disabled={busy || !dirty}>
                      Save changes
                    </button>
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={handleWrite}
                      disabled={busy || summary.generationsRemaining === 0}
                      title={summary.generationsRemaining === 0 ? 'No rewrites left for this month and language' : undefined}
                    >
                      {generate.isPending ? 'Writing…' : `Rewrite (${summary.generationsRemaining} left)`}
                    </button>
                  </>
                ) : (
                  <button type="button" className={styles.secondary} onClick={() => setEditing(true)} disabled={busy}>
                    Edit
                  </button>
                )}
              </div>

              {!isDraft && editing && (
                <p className={styles.hint}>Saving changes will need a new approval.</p>
              )}
            </>
          )}
        </section>

        <footer className={styles.foot}>
          <button type="button" className={styles.primary} onClick={openReport} disabled={busy}>
            Open report
          </button>
          <p className={styles.hint}>
            {summary?.status === 'APPROVED'
              ? 'The approved summary is included.'
              : 'The report opens without a summary until one is approved.'}
          </p>
        </footer>
      </aside>
    </div>
  )
}