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