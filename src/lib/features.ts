/**
 * Feature visibility for the Phase 1 launch.
 *
 * Hidden, not deleted. Each of these has UI built but no backend, so showing
 * them means a user can click something that silently does nothing — and for
 * WhatsApp and LINE it implies Meta permissions we are not requesting, which
 * is a review risk.
 *
 * To bring one back: flip the flag and confirm the endpoints exist.
 */
export const FEATURES = {
  /** Requires whatsapp_business_messaging + a backend. Phase 2+. */
  platformWhatsapp: false,
  /** Requires LINE Messaging API + a backend. Phase 2+. */
  platformLine: false,

  /** Claude caption generation. Ships with Annovist Intelligence. */
  aiCaption: false,
  /** Image generation. Ships with Annovist Intelligence. */
  aiImage: false,
  /** Optional pre-save check. Currently sample output — see aiReviewIsPreview. */
  aiReview: true,
  /** Shows the "sample output" banner. Remove when the RAG backend is live. */
  aiReviewIsPreview: true,

    /** Media subsystem is live: upload, library, per-platform validation. */
  mediaUpload: true,
} as const

import type { Platform } from './types'

/** Platforms a user may post to today. */
export const ENABLED_PLATFORMS: Platform[] = [
  'FACEBOOK',
  'INSTAGRAM',
  ...(FEATURES.platformWhatsapp ? (['WHATSAPP'] as Platform[]) : []),
  ...(FEATURES.platformLine ? (['LINE'] as Platform[]) : []),
]