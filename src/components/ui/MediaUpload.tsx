'use client'

import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import styles from './MediaUpload.module.css'

interface UploadedFile {
  id:        string
  url:       string
  mimeType:  string
  sizeBytes: number
  localUrl:  string  // blob URL for preview
  name:      string
}

interface UploadingFile {
  id:       string
  name:     string
  localUrl: string
  progress: number
}

interface MediaUploadProps {
  label?:     string
  maxFiles?:  number
  maxSizeMB?: number
  onChange?:  (files: UploadedFile[]) => void
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaUpload({
  label     = 'Media',
  maxFiles  = 4,
  maxSizeMB = 10,
  onChange,
}: MediaUploadProps) {
  const inputRef              = useRef<HTMLInputElement>(null)
  const [isDragging,  setIsDragging ] = useState(false)
  const [uploaded,    setUploaded   ] = useState<UploadedFile[]>([])
  const [uploading,   setUploading  ] = useState<UploadingFile[]>([])
  const [error,       setError      ] = useState<string | null>(null)

  const canAddMore = uploaded.length + uploading.length < maxFiles

  const uploadFile = useCallback(async (file: File) => {
    setError(null)

    // Validate type
    if (!ACCEPTED.includes(file.type)) {
      setError(`"${file.name}" is not a supported file type.`)
      return
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`"${file.name}" exceeds the ${maxSizeMB}MB limit.`)
      return
    }

    const localUrl  = URL.createObjectURL(file)
    const uploadId  = `uploading-${Date.now()}-${Math.random()}`

    // Add to uploading list
    setUploading((prev) => [...prev, { id: uploadId, name: file.name, localUrl, progress: 0 }])

    // Simulate progress ticks
    const progressInterval = setInterval(() => {
      setUploading((prev) =>
        prev.map((u) =>
          u.id === uploadId
            ? { ...u, progress: Math.min(u.progress + 20, 85) }
            : u
        )
      )
    }, 200)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await api.post('/api/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      clearInterval(progressInterval)

      // Complete progress
      setUploading((prev) =>
        prev.map((u) => u.id === uploadId ? { ...u, progress: 100 } : u)
      )

      // Small delay so user sees 100%
      await new Promise((r) => setTimeout(r, 300))

      const uploadedFile: UploadedFile = {
        id:        data.id,
        url:       data.url,
        mimeType:  data.mimeType,
        sizeBytes: data.sizeBytes,
        localUrl,
        name:      file.name,
      }

      setUploaded((prev) => {
        const next = [...prev, uploadedFile]
        onChange?.(next)
        return next
      })

      setUploading((prev) => prev.filter((u) => u.id !== uploadId))

    } catch {
      clearInterval(progressInterval)
      setUploading((prev) => prev.filter((u) => u.id !== uploadId))
      setError(`Failed to upload "${file.name}". Please try again.`)
      URL.revokeObjectURL(localUrl)
    }
  }, [maxSizeMB, onChange])

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const remaining = maxFiles - uploaded.length - uploading.length
    Array.from(files).slice(0, remaining).forEach(uploadFile)
  }, [maxFiles, uploaded.length, uploading.length, uploadFile])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleRemove = (id: string) => {
    setUploaded((prev) => {
      const next = prev.filter((f) => f.id !== id)
      onChange?.(next)
      return next
    })
  }

  return (
    <div className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}

      {/* Drop zone */}
      {canAddMore && (
        <div
          className={cn(
            styles.dropzone,
            isDragging && styles.dropzoneActive
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          aria-label="Upload media files"
        >
          <svg
            className={styles.dropIcon}
            viewBox="0 0 36 36"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M18 24V12M12 18l6-6 6 6"/>
            <rect x="3" y="3" width="30" height="30" rx="6"/>
            <path d="M3 24l7-7 5 5 5-6 7 8"/>
          </svg>

          <span className={styles.dropTitle}>
            {isDragging ? 'Drop files here' : 'Click or drag to upload'}
          </span>
          <span className={styles.dropSub}>
            Images (JPG, PNG, WebP, GIF) or MP4 video
          </span>
          <span className={styles.dropHint}>
            Max {maxSizeMB}MB per file · Up to {maxFiles} files
          </span>

          <input
            ref={inputRef}
            type="file"
            className={styles.hiddenInput}
            accept={ACCEPTED.join(',')}
            multiple={maxFiles > 1}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Previews */}
      {(uploaded.length > 0 || uploading.length > 0) && (
        <div className={styles.previews}>

          {/* Uploading items */}
          {uploading.map((u) => (
            <div key={u.id} className={styles.previewItem}>
              <img
                src={u.localUrl}
                alt={u.name}
                className={styles.previewImg}
              />
              <div className={styles.progressOverlay}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
                <span className={styles.progressPct}>{u.progress}%</span>
              </div>
            </div>
          ))}

          {/* Uploaded items */}
          {uploaded.map((f) => (
            <div key={f.id} className={styles.previewItem}>
              <img
                src={f.localUrl}
                alt={f.name}
                className={styles.previewImg}
              />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => handleRemove(f.id)}
                aria-label={`Remove ${f.name}`}
              >
                ×
              </button>
              <div className={styles.fileInfo}>
                {formatBytes(f.sizeBytes)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}