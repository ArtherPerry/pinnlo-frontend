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
  /** Direct URL when storage serves publicly. Null on local disk. */
  publicUrl:    string | null
  /** Streams through the API with auth applied. Always present. */
  url:          string
  createdAt:    string
}

export const mediaKeys = {
  all:      () => ['media'] as const,
  specs:    () => ['media', 'specs'] as const,
  byClient: (clientId: string) => ['media', 'client', clientId] as const,
}

// ── Platform specs, served by the backend ─────────────────────────────────
//
// Fetched rather than restated in TypeScript: MediaRules on the server is the
// single source of truth, so adding TikTok or LINE means editing one file.

export interface PlatformSpec {
  defined:          boolean
  verified?:        boolean
  imageTypes?:      string[]
  videoTypes?:      string[]
  maxImageBytes?:   number
  maxVideoBytes?:   number
  minAspectRatio?:  number | null
  maxAspectRatio?:  number | null
  minWidth?:        number | null
  maxWidth?:        number | null
  maxItemsPerPost?: number
  minVideoSeconds?: number | null
  maxVideoSeconds?: number | null
}

export interface MediaSpecs {
  uploadImageTypes:    string[]
  uploadVideoTypes:    string[]
  uploadMaxImageBytes: number
  uploadMaxVideoBytes: number
  platforms:           Record<string, PlatformSpec>
}

export function useMediaSpecs() {
  return useQuery({
    queryKey:  mediaKeys.specs(),
    staleTime: 60 * 60 * 1000,   // platform rules change rarely
    queryFn: async () => {
      const { data } = await api.get<MediaSpecs>('/api/media/specs')
      return data
    },
  })
}

// ── Queries and mutations ─────────────────────────────────────────────────

/** Everything previously uploaded for a client workspace — the library. */
export function useClientMedia(clientId: string | null) {
  return useQuery({
    queryKey: mediaKeys.byClient(clientId ?? 'none'),
    enabled:  !!clientId,
    queryFn: async () => {
      const { data } = await api.get<MediaAsset[]>('/api/media', { params: { clientId } })
      return data
    },
  })
}

/**
 * Uploads one file to a client workspace.
 *
 * clientId is required: media is scoped to a workspace so one client's images
 * can never be attached to another's post. Callers must not offer upload
 * before a workspace has been chosen.
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
        // The axios instance defaults to application/json. Clearing it lets
        // axios detect FormData and set multipart with the correct boundary;
        // hardcoding 'multipart/form-data' omits the boundary and fails.
        headers: { 'Content-Type': undefined },
        timeout: 120_000,   // large files outlive the 15s default
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

// ── Advisory validation ───────────────────────────────────────────────────

const mb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1)

/**
 * Warnings for one asset against every selected platform.
 *
 * Advisory only: the server decides at submit. This exists so a user is told
 * before writing a caption around an image that will be refused. A platform
 * with no defined spec says so rather than passing silently.
 */
export function mediaWarnings(
  asset: MediaAsset,
  platforms: string[],
  specs: MediaSpecs | undefined,
): string[] {
  if (!specs) return []

  const warnings: string[] = []
  const isImage = asset.contentType.startsWith('image/')
  const isVideo = asset.contentType.startsWith('video/')

  for (const platform of platforms) {
    const spec = specs.platforms[platform]

    if (!spec?.defined) {
      warnings.push(`${platform}: media rules not defined yet`)
      continue
    }

    if (isImage) {
      if (spec.imageTypes && !spec.imageTypes.includes(asset.contentType)) {
        warnings.push(`${platform} doesn't accept ${asset.contentType.replace('image/', '').toUpperCase()}`)
        continue
      }
      if (spec.maxImageBytes && asset.sizeBytes > spec.maxImageBytes) {
        warnings.push(`Over ${platform}'s ${mb(spec.maxImageBytes)} MB limit`)
      }
      if (asset.width && asset.height) {
        const ratio = asset.width / asset.height
        if (spec.minWidth && asset.width < spec.minWidth) {
          warnings.push(`${platform} needs at least ${spec.minWidth}px wide`)
        }
        if (spec.maxWidth && asset.width > spec.maxWidth) {
          warnings.push(`${platform} allows at most ${spec.maxWidth}px wide`)
        }
        if (spec.minAspectRatio && ratio < spec.minAspectRatio) {
          warnings.push(`Too tall for ${platform} (${asset.width}×${asset.height})`)
        }
        if (spec.maxAspectRatio && ratio > spec.maxAspectRatio) {
          warnings.push(`Too wide for ${platform} (${asset.width}×${asset.height})`)
        }
      }
    } else if (isVideo) {
      if (spec.videoTypes && !spec.videoTypes.includes(asset.contentType)) {
        warnings.push(`${platform} doesn't accept ${asset.contentType}`)
        continue
      }
      if (spec.maxVideoBytes && asset.sizeBytes > spec.maxVideoBytes) {
        warnings.push(`Over ${platform}'s ${mb(spec.maxVideoBytes)} MB limit`)
      }
    }
  }

  return warnings
}

/** Lowest per-post item cap across the selected platforms. */
export function maxItemsFor(platforms: string[], specs: MediaSpecs | undefined): number {
  if (!specs) return 10
  const caps = platforms
    .map((p) => specs.platforms[p]?.maxItemsPerPost)
    .filter((n): n is number => typeof n === 'number')
  return caps.length > 0 ? Math.min(...caps) : 10
}

/** Human-readable list of what can be uploaded at all. */
export function acceptAttribute(specs: MediaSpecs | undefined): string {
  if (!specs) return 'image/*'
  return [...specs.uploadImageTypes, ...specs.uploadVideoTypes].join(',')
}

/**
 * One asset, fetched by id.
 *
 * The library list carries full records, so this is not needed to render the
 * grid. It backs the detail view, where the authoritative record matters: a
 * list fetched before an upload finished processing can be missing the width
 * and height that decide whether Instagram will accept the file.
 */
export function useMediaAsset(id: string | null) {
  return useQuery({
    queryKey: ['media', 'detail', id ?? 'none'],
    enabled:  !!id,
    queryFn: async () => {
      const { data } = await api.get<MediaAsset>(`/api/media/${id}`)
      return data
    },
  })
}