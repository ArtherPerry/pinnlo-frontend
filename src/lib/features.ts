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

    /** Best-posting-time heatmap. Needs hourly engagement data nobody collects yet. */
  analyticsHeatmap: false,
  /** Generated narrative summary. Currently prose built from numbers, not analysis. */
  analystSummary: false,
  /** PDF report export. No generator behind it. */
  reportExport: false,

  /** White-label client reporting. Phase 3, no backend. */
  reportPortals: false,

    /** Needs email/phone/website/timezone/language columns on agency. */
  settingsAgencyProfile: false,
  /** No notification system exists to have preferences about. */
  settingsNotifications: false,
  /** Plan is stored, but there is no billing integration behind it. */
  settingsBilling: false,
} as const

import type { Platform } from './types'

/** Platforms a user may post to today. */
export const ENABLED_PLATFORMS: Platform[] = [
  'FACEBOOK',
  'INSTAGRAM',
  ...(FEATURES.platformWhatsapp ? (['WHATSAPP'] as Platform[]) : []),
  ...(FEATURES.platformLine ? (['LINE'] as Platform[]) : []),
]


/**
 * Which nav items are shown.
 *
 * Every entry below has UI built but no backend endpoints — clicking one gets
 * a page that loads and then fails, which reads as a broken product rather
 * than an unfinished one. Hidden, not deleted: the pages stay in the tree.
 *
 * Anything absent from this map defaults to visible, so a new page appears
 * without needing an entry.
 *
 * To bring one back: verify the endpoints exist, then delete its line.
 */
const NAV_HIDDEN: Record<string, true> = {
  // Out of phase — competitor set shares the same absent /api/competitors.
  competitors: true,
  benchmarks:  true,
  portals:     true,
  listening:   true,
  influencers: true,
  developer:   true,
  flows:       true,

  // No backend yet, in scope later.

  broadcasts: true,
  emails:     true,
}

export function isNavVisible(key: string): boolean {
  return NAV_HIDDEN[key] !== true
}