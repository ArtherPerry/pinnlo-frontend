'use client'

import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { AuthedImage } from './AuthedImage'
import {
  useClientMedia,
  useUploadMedia,
  useMediaSpecs,
  useMediaAsset,
  mediaWarnings,
  maxItemsFor,
  acceptAttribute,
  type MediaAsset,
  type MediaSpecs,
} from '@/hooks/useMedia'
import styles from './MediaUpload.module.css'

interface UploadingFile {
  key:      string
  name:     string
  localUrl: string
  progress: number
}

interface MediaUploadProps {
  label?: string
  /** Workspace the media belongs to. Upload is disabled until this is set. */
  clientId: string | null
  /** Selected platforms, for advisory warnings. */
  platforms: string[]
  /** Controlled: the assets currently attached, in publish order. */
  value: MediaAsset[]
  onChange: (assets: MediaAsset[]) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaUpload({
  label = 'Media',
  clientId,
  platforms,
  value,
  onChange,
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [tab,        setTab       ] = useState<'upload' | 'library'>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading,  setUploading ] = useState<UploadingFile[]>([])
  const [error,      setError     ] = useState<string | null>(null)
  const [dragIndex,  setDragIndex ] = useState<number | null>(null)
  const [overIndex,  setOverIndex ] = useState<number | null>(null)
  const [detailId,   setDetailId  ] = useState<string | null>(null)

  const { data: specs }   = useMediaSpecs()
  const { data: library } = useClientMedia(tab === 'library' ? clientId : null)
  const upload            = useUploadMedia()

  const maxItems  = maxItemsFor(platforms, specs)
  const slotsLeft = maxItems - value.length - uploading.length
  const canAdd    = !!clientId && slotsLeft > 0

  // ── Upload ──────────────────────────────────────────────────────────

  const uploadOne = useCallback(async (file: File) => {
    if (!clientId) return
    setError(null)

    const localUrl = URL.createObjectURL(file)
    const key = `up-${Date.now()}-${Math.random()}`
    setUploading((prev) => [...prev, { key, name: file.name, localUrl, progress: 0 }])

    try {
      const asset = await upload.mutateAsync({
        clientId,
        file,
        onProgress: (percent) =>
          setUploading((prev) =>
            prev.map((u) => (u.key === key ? { ...u, progress: percent } : u))
          ),
      })
      onChange([...value, asset])
    } catch (e: unknown) {
      const message =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setError(message ?? `Could not upload "${file.name}"`)
    } finally {
      setUploading((prev) => prev.filter((u) => u.key !== key))
      URL.revokeObjectURL(localUrl)
    }
  }, [clientId, onChange, upload, value])

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || !clientId) return
    Array.from(files).slice(0, slotsLeft).forEach(uploadOne)
  }, [clientId, slotsLeft, uploadOne])

  // ── Attachment list ─────────────────────────────────────────────────

  const remove = (id: string) => onChange(value.filter((a) => a.id !== id))

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  const toggleFromLibrary = (asset: MediaAsset) => {
    const already = value.some((a) => a.id === asset.id)
    if (already) {
      remove(asset.id)
    } else if (slotsLeft > 0) {
      onChange([...value, asset])
    }
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}

      {!clientId ? (
        <div className={cn(styles.dropzone, styles.dropzoneDisabled)}>
          <span className={styles.dropTitle}>Choose a client workspace first</span>
          <span className={styles.dropSub}>
            Media is filed under a workspace so it can only be used for that client.
          </span>
        </div>
      ) : (
        <>
          <div className={styles.tabs} role="tablist">
            <button
              type="button" role="tab" aria-selected={tab === 'upload'}
              className={cn(styles.tab, tab === 'upload' && styles.tabActive)}
              onClick={() => setTab('upload')}
            >
              Upload
            </button>
            <button
              type="button" role="tab" aria-selected={tab === 'library'}
              className={cn(styles.tab, tab === 'library' && styles.tabActive)}
              onClick={() => setTab('library')}
            >
              Library
            </button>
          </div>

          {tab === 'upload' && (
            <div
              className={cn(
                styles.dropzone,
                isDragging && styles.dropzoneActive,
                !canAdd && styles.dropzoneDisabled,
              )}
              onClick={() => canAdd && inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); if (canAdd) setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files) }}
              role="button"
              tabIndex={canAdd ? 0 : -1}
              aria-disabled={!canAdd}
              onKeyDown={(e) => {
                if (canAdd && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  inputRef.current?.click()
                }
              }}
              aria-label="Upload media"
            >
              <svg className={styles.dropIcon} viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="30" height="30" rx="6" />
                <path d="M3 24l7-7 5 5 5-6 7 8" />
              </svg>

              <span className={styles.dropTitle}>
                {slotsLeft <= 0
                  ? `Limit reached (${maxItems} per post)`
                  : isDragging ? 'Drop files here' : 'Click or drag to upload'}
              </span>

              {specs && (
                <>
                  <span className={styles.dropSub}>
                    {specs.uploadImageTypes.map((t) => t.replace('image/', '').toUpperCase()).join(', ')}
                    {' or '}
                    {specs.uploadVideoTypes.map((t) => t.replace('video/', '').toUpperCase()).join(', ')}
                  </span>
                  <span className={styles.dropHint}>
                    Up to {formatBytes(specs.uploadMaxImageBytes)} per image ·{' '}
                    {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft === 1 ? '' : 's'} left` : 'full'}
                  </span>
                </>
              )}

              <input
                ref={inputRef}
                type="file"
                className={styles.hiddenInput}
                accept={acceptAttribute(specs)}
                multiple={maxItems > 1}
                onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
              />
            </div>
          )}

          {tab === 'library' && (
            <div className={styles.library}>
              {!library && <div className={styles.libraryEmpty}>Loading…</div>}
              {library?.length === 0 && (
                <div className={styles.libraryEmpty}>
                  Nothing uploaded for this client yet.
                </div>
              )}
              {library && library.length > 0 && (
                <div className={styles.libraryGrid}>
                  {library.map((asset) => {
                    const selected = value.some((a) => a.id === asset.id)
                    return (
                      <div key={asset.id} className={styles.libraryCell}>
                        <button
                          type="button"
                          className={cn(styles.libraryItem, selected && styles.libraryItemSelected)}
                          onClick={() => toggleFromLibrary(asset)}
                          aria-pressed={selected}
                          disabled={!selected && slotsLeft <= 0}
                        >
                          <AuthedImage
                            src={asset.url}
                            publicUrl={asset.publicUrl}
                            alt={asset.originalName}
                            className={styles.libraryImg}
                          />
                          {selected && <span className={styles.librarySelectedMark}>✓</span>}
                        </button>

                        {/* Separate from the select button: the thumbnail alone
                            does not say whether a file will be refused. */}
                        <button
                          type="button"
                          className={styles.libraryInfo}
                          onClick={() => setDetailId(asset.id)}
                          aria-label={`Details for ${asset.originalName}`}
                        >
                          i
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {detailId && (
        <AssetDetail
          id={detailId}
          platforms={platforms}
          specs={specs}
          onClose={() => setDetailId(null)}
        />
      )}

      {/* In-flight uploads */}
      {uploading.length > 0 && (
        <div className={styles.previews}>
          {uploading.map((u) => (
            <div key={u.key} className={styles.previewItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u.localUrl} alt={u.name} className={styles.previewImg} />
              <div className={styles.progressOverlay}>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${u.progress}%` }} />
                </div>
                <span className={styles.progressPct}>{u.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attached, in publish order */}
      {value.length > 0 && (
        <>
          {value.length > 1 && (
            <p className={styles.orderHint}>
              Drag to reorder. The first image sets the crop for the whole carousel.
            </p>
          )}

          <div className={styles.previews}>
            {value.map((asset, index) => {
              const warnings = mediaWarnings(asset, platforms, specs)
              return (
                <div
                  key={asset.id}
                  className={cn(
                    styles.previewItem,
                    warnings.length > 0 && styles.previewItemWarn,
                    dragIndex === index && styles.previewItemDragging,
                    overIndex === index && dragIndex !== index && styles.previewItemOver,
                  )}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
                  onDragOver={(e) => { e.preventDefault(); setOverIndex(index) }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (dragIndex !== null) move(dragIndex, index)
                    setDragIndex(null)
                    setOverIndex(null)
                  }}
                >
                  <AuthedImage
                    src={asset.url}
                    publicUrl={asset.publicUrl}
                    alt={asset.originalName}
                    className={styles.previewImg}
                  />

                  <span className={styles.positionBadge}>{index + 1}</span>

                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => remove(asset.id)}
                    aria-label={`Remove ${asset.originalName}`}
                  >
                    ×
                  </button>

                  {value.length > 1 && (
                    <div className={styles.moveControls}>
                      <button
                        type="button"
                        className={styles.moveBtn}
                        onClick={() => move(index, index - 1)}
                        disabled={index === 0}
                        aria-label={`Move ${asset.originalName} earlier`}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className={styles.moveBtn}
                        onClick={() => move(index, index + 1)}
                        disabled={index === value.length - 1}
                        aria-label={`Move ${asset.originalName} later`}
                      >
                        ›
                      </button>
                    </div>
                  )}

                  <div className={styles.fileInfo}>
                    {asset.width && asset.height
                      ? `${asset.width}×${asset.height}`
                      : formatBytes(asset.sizeBytes)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Advisory only — the server decides at submit */}
          {value.some((a) => mediaWarnings(a, platforms, specs).length > 0) && (
            <ul className={styles.warnings}>
              {value.flatMap((asset) =>
                mediaWarnings(asset, platforms, specs).map((w) => (
                  <li key={`${asset.id}-${w}`}>
                    <strong>{asset.originalName}</strong> — {w}
                  </li>
                ))
              )}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
/**
 * Everything known about one asset, fetched fresh by id.
 *
 * The point is the warnings: the library grid shows a thumbnail, so there is
 * no way to tell that a file is too tall for Instagram until the post is
 * submitted and refused. mediaWarnings already computes this — nothing
 * surfaced it in the library tab.
 *
 * Fetched by id rather than passed down, because a list loaded before an
 * upload finished processing can be missing the width and height the warnings
 * depend on.
 */
function AssetDetail({
  id,
  platforms,
  specs,
  onClose,
}: {
  id:        string
  platforms: string[]
  specs:     MediaSpecs | undefined
  onClose:   () => void
}) {
  const { data: asset, isLoading, isError } = useMediaAsset(id)

  const warnings = asset ? mediaWarnings(asset, platforms, specs) : []

  return (
    <div className={styles.detailOverlay} onClick={onClose}>
      <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.detailHeader}>
          <span className={styles.detailTitle}>
            {asset?.originalName ?? 'Media details'}
          </span>
          <button className={styles.detailClose} onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {isLoading && <div className={styles.detailBody}>Loading…</div>}
        {isError && <div className={styles.detailBody}>Could not load this file.</div>}

        {asset && (
          <div className={styles.detailBody}>
            <AuthedImage
              src={asset.url}
              publicUrl={asset.publicUrl}
              alt={asset.originalName}
              className={styles.detailImg}
            />

            <dl className={styles.detailFacts}>
              <dt>Type</dt>
              <dd>{asset.contentType}</dd>

              <dt>Size</dt>
              <dd>{formatBytes(asset.sizeBytes)}</dd>

              <dt>Dimensions</dt>
              <dd>
                {asset.width && asset.height ? `${asset.width} × ${asset.height}` : '—'}
              </dd>

              {asset.durationMs != null && (
                <>
                  <dt>Duration</dt>
                  <dd>{(asset.durationMs / 1000).toFixed(1)}s</dd>
                </>
              )}
            </dl>

            {platforms.length > 0 && (
              warnings.length > 0 ? (
                <ul className={styles.detailWarnings}>
                  {warnings.map((w) => <li key={w}>{w}</li>)}
                </ul>
              ) : (
                <div className={styles.detailOk}>
                  Fits the rules for {platforms.join(' and ')}.
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}