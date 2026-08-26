import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export interface MediaAsset {
  id:           string
  originalName: string
  contentType:  string
  sizeBytes:    number
  width:        number | null
  height:       number | null
  durationMs:   number | null
  /** Direct URL when storage serves publicly; null on local disk. */
  publicUrl:    string | null
  /** Always usable — streams through the API with auth applied. */
  url:          string
  createdAt:    string
}

export const mediaKeys = {
  all:      () => ['media'] as const,
  byClient: (clientId: string) => ['media', 'client', clientId] as const,
}

/** Everything previously uploaded for a client workspace — the library. */
export function useClientMedia(clientId: string | null) {
  return useQuery({
    queryKey: mediaKeys.byClient(clientId ?? 'none'),
    enabled:  !!clientId,
    queryFn: async () => {
      const { data } = await api.get<MediaAsset[]>('/api/media', {
        params: { clientId },
      })
      return data
    },
  })
}

/**
 * Uploads one file to a client workspace.
 *
 * clientId is required by the API — media is scoped to a workspace so one
 * client's images can never be attached to another's post. Callers must not
 * offer upload before a workspace is chosen.
 */
export function useUploadMedia() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      clientId,
      file,
      onProgress,
    }: {
      clientId: string
      file: File
      onProgress?: (percent: number) => void
    }) => {
      const form = new FormData()
      form.append('file', file)

      const { data } = await api.post<MediaAsset>('/api/media', form, {
        params: { clientId },
        // Let the browser set the multipart boundary; setting it by hand breaks the upload
        headers: { 'Content-Type': undefined },
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded / event.total) * 100))
          }
        },
      })
      return data
    },
    onSuccess: (_asset, { clientId }) => {
      qc.invalidateQueries({ queryKey: mediaKeys.byClient(clientId) })
    },
  })
}

export function useDeleteMedia() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; clientId: string }) => {
      await api.delete(`/api/media/${id}`)
    },
    onSuccess: (_data, { clientId }) => {
      qc.invalidateQueries({ queryKey: mediaKeys.byClient(clientId) })
    },
  })
}

// ── Client-side limits, mirroring MediaRules on the backend ───────────────
//
// Enforced server-side regardless; these exist so the user gets told before
// spending time on an upload that will be rejected.

export const MEDIA_LIMITS = {
  imageTypes:   ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  videoTypes:   ['video/mp4', 'video/quicktime'],
  maxImageMB:   15,
  maxVideoMB:   200,
  maxPerPost:   10,
} as const

/**
 * Instagram is the strictest platform we publish to: JPEG/PNG only, 8 MB,
 * aspect ratio between 4:5 and 1.91:1. Used for warnings, not blocking —
 * a Facebook-only post can legitimately use an image Instagram would refuse.
 */
export const INSTAGRAM_LIMITS = {
  types:    ['image/jpeg', 'image/png'],
  maxMB:    8,
  minRatio: 0.8,
  maxRatio: 1.91,
} as const

export function instagramWarning(asset: MediaAsset): string | null {
  if (!asset.contentType.startsWith('image/')) return null

  if (!INSTAGRAM_LIMITS.types.includes(asset.contentType as never)) {
    return `Instagram does not accept ${asset.contentType.replace('image/', '').toUpperCase()}`
  }
  if (asset.sizeBytes > INSTAGRAM_LIMITS.maxMB * 1024 * 1024) {
    return `Over Instagram's ${INSTAGRAM_LIMITS.maxMB} MB limit`
  }
  if (asset.width && asset.height) {
    const ratio = asset.width / asset.height
    if (ratio < INSTAGRAM_LIMITS.minRatio) {
      return `Too tall for Instagram (${asset.width}×${asset.height}) — needs 4:5 or wider`
    }
    if (ratio > INSTAGRAM_LIMITS.maxRatio) {
      return `Too wide for Instagram (${asset.width}×${asset.height}) — needs 1.91:1 or narrower`
    }
  }
  return null
}