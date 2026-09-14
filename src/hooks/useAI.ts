import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'

// ── Caption generator ─────────────────────────────────────────────
interface CaptionInput {
  topic:      string
  platform:   string
  tone:       string
  language:   string
  clientName?: string
}

interface CaptionResult {
  captions:        string[]
  usageRemaining:  number
  model:           string
}

export function useGenerateCaptions() {
  return useMutation({
    mutationFn: async (input: CaptionInput): Promise<CaptionResult> => {
      const { data } = await api.post('/api/v1/ai/caption', input)
      return data
    },
  })
}

// ── Reply suggestions ─────────────────────────────────────────────
interface ReplyInput {
  message:   string
  platform:  string
  tone?:     string
  threadId?: string
}

interface ReplyResult {
  suggestions:     string[]
  usageRemaining:  number
}

export function useGenerateReplySuggestions() {
  return useMutation({
    mutationFn: async (input: ReplyInput): Promise<ReplyResult> => {
      const { data } = await api.post('/api/v1/ai/reply', input)
      return data
    },
  })
}

// ── Image generation ──────────────────────────────────────────────
interface ImageInput {
  prompt:   string
  style?:   string
  platform?: string
}

interface GeneratedImage {
  id:     string
  url:    string
  prompt: string
}

interface ImageResult {
  images:          GeneratedImage[]
  usageRemaining:  number
}

export function useGenerateImages() {
  return useMutation({
    mutationFn: async (input: ImageInput): Promise<ImageResult> => {
      const { data } = await api.post('/api/v1/ai/image', input)
      return data
    },
  })
}

export interface ReviewInput {
  clientId:  string
  content:   string
  platforms: string[]
  hasMedia:  boolean
  /** Optional — the backend falls back to the client's usual market. */
  market?:   string
}

export interface AIReviewResult {
  review:      string
  market:      string
  generatedAt: string
}

/**
 * Advisory review of draft content, before it is saved.
 *
 * A mutation rather than a query: it costs money on every call, so it runs
 * when the user asks rather than whenever the component mounts.
 */
export function useAIReview() {
  return useMutation({
    mutationFn: async (input: ReviewInput) => {
      const { data } = await api.post<AIReviewResult>('/api/posts/review', input)
      return data
    },
  })
}