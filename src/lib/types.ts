// ── Auth ──────────────────────────────────────────────────────────
export type Role = 'OWNER' | 'MANAGER' | 'STAFF' | 'GUEST' | 'CLIENT_VIEWER'
export type Plan = 'STARTER' | 'PRO' | 'AGENCY' | 'ENTERPRISE'
export type Locale = 'th' | 'en' | 'my' | 'lo'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  agencyId: string
  agencyName: string
  plan: Plan
  locale: Locale
  platformAdmin: boolean
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

// ── API response wrapper ──────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

// ── Platforms ─────────────────────────────────────────────────────
export type Platform =
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'WHATSAPP'
  | 'LINE'

// ── Post ──────────────────────────────────────────────────────────
export type PostStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'CANCELLED'

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'

export interface PostTarget {
  platform:  Platform
  status:    PostStatus
  errorMsg?: string
}

export interface PostApproval {
  id:          string
  status:      ApprovalStatus
  approvedBy?: string
  comment?:    string
  decidedAt?:  string
}

export interface MediaAsset {
  id:       string
  url:      string
  mimeType: string
  sizeBytes: number
}

export interface Post {
  id:          string
  content:     string
  status:      PostStatus
  scheduledAt: string | null
  publishedAt: string | null
  platforms:   Platform[]
  targets:     PostTarget[]
  approval:    PostApproval | null
  media:       MediaAsset[]
  labels:      string[]
  clientId:    string
  clientName:  string
  createdBy:   string
  createdAt:   string
  updatedAt:   string
}

export interface CreatePostInput {
  clientId:    string
  content:     string
  platforms:   Platform[]
  scheduledAt: string | null
  labels?:     string[]
}

export interface PostFormValues {
  clientId:    string
  platforms:   Platform[]
  content:     string
  scheduledAt: string
  labels:      string
}

// ── CRM ───────────────────────────────────────────────────────────
export type ContactSource =
  | 'MESSENGER'
  | 'WHATSAPP'
  | 'LINE'
  | 'MANUAL'
  | 'CSV_IMPORT'

export type ActivityType =
  | 'MESSENGER_MESSAGE'
  | 'WHATSAPP_MESSAGE'
  | 'LINE_MESSAGE'
  | 'NOTE'
  | 'TAG_ADDED'
  | 'TAG_REMOVED'
  | 'ASSIGNED'
  | 'UNASSIGNED'
  | 'STATUS_CHANGED'

export interface ContactActivity {
  id:        string
  type:      ActivityType
  content:   string
  createdBy: string
  createdAt: string
}

export interface Contact {
  id:          string
  name:        string
  phone:       string | null
  email:       string | null
  fbPsid:      string | null
  waId:        string | null
  lineUid:     string | null
  source:      ContactSource
  tags:        string[]
  assignedTo:  string | null
  clientId:    string
  clientName:  string
  notes:       string | null
  lastActiveAt: string | null
  createdAt:   string
  activities:  ContactActivity[]
}

export interface CreateContactInput {
  name:       string
  phone?:     string
  email?:     string
  clientId:   string
  source:     ContactSource
  tags?:      string[]
  assignedTo?: string
  notes?:     string
}

// ── Competitor tracking ───────────────────────────────────────────
export type CompetitorPlatform = 'FACEBOOK' | 'INSTAGRAM'

export interface FollowerSnapshot {
  date:      string
  followers: number
  change:    number
}

export interface Competitor {
  id:              string
  name:            string
  platform:        CompetitorPlatform
  pageUrl:         string
  pageId:          string
  avatarUrl:       string | null
  followers:       number
  followerGrowth:  number   // % change last 30 days
  avgEngagement:   number   // % engagement rate
  postsPerWeek:    number
  clientId:        string
  clientName:      string
  snapshots:       FollowerSnapshot[]
  createdAt:       string
  lastSyncedAt:    string
}

export interface CreateCompetitorInput {
  name:      string
  platform:  CompetitorPlatform
  pageUrl:   string
  clientId:  string
}

// ── Benchmark groups ──────────────────────────────────────────────
export interface BenchmarkMember {
  id:            string
  name:          string
  platform:      CompetitorPlatform
  followers:     number
  engagementRate: number
  postsPerWeek:  number
  isOwn:         boolean   // true = our client page, false = competitor
}

export interface BenchmarkGroup {
  id:        string
  name:      string
  clientId:  string
  clientName: string
  members:   BenchmarkMember[]
  createdAt: string
}

export interface CreateBenchmarkGroupInput {
  name:          string
  clientId:      string
  competitorIds: string[]
}

// ── White-label portal ────────────────────────────────────────────
export type PortalStatus = 'ACTIVE' | 'INACTIVE' | 'PASSWORD_PROTECTED'

export interface PortalBranding {
  logoUrl:        string | null
  primaryColor:   string
  companyName:    string
  customDomain:   string | null
}

export interface ReportPortal {
  id:          string
  clientId:    string
  clientName:  string
  status:      PortalStatus
  shareToken:  string
  shareUrl:    string
  password:    string | null
  branding:    PortalBranding
  sections:    PortalSection[]
  lastViewedAt: string | null
  viewCount:   number
  createdAt:   string
}

export type PortalSectionType =
  | 'PAGE_OVERVIEW'
  | 'POST_PERFORMANCE'
  | 'AUDIENCE_GROWTH'
  | 'TOP_POSTS'
  | 'CUSTOM_MESSAGE'

export interface PortalSection {
  id:      string
  type:    PortalSectionType
  title:   string
  enabled: boolean
  order:   number
}

// ── Social listening ──────────────────────────────────────────────
export type ListeningPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER'
export type SentimentType     = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
export type AlertFrequency    = 'REALTIME' | 'DAILY' | 'WEEKLY'

export interface ListeningQuery {
  id:           string
  keyword:      string
  platforms:    ListeningPlatform[]
  language:     string
  alertEnabled: boolean
  alertFrequency: AlertFrequency
  mentionCount: number
  sentimentBreakdown: {
    positive: number
    neutral:  number
    negative: number
  }
  createdAt:   string
  lastFoundAt: string | null
}

export interface Mention {
  id:          string
  queryId:     string
  keyword:     string
  platform:    ListeningPlatform
  content:     string
  author:      string
  authorUrl:   string
  postUrl:     string
  sentiment:   SentimentType
  engagement:  number
  foundAt:     string
}

export interface CreateListeningQueryInput {
  keyword:        string
  platforms:      ListeningPlatform[]
  language:       string
  alertEnabled:   boolean
  alertFrequency: AlertFrequency
}

// ── Influencer discovery ──────────────────────────────────────────
export type InfluencerTier =
  | 'NANO'        // 1K–10K
  | 'MICRO'       // 10K–100K
  | 'MACRO'       // 100K–1M
  | 'MEGA'        // 1M+

export interface Influencer {
  id:              string
  name:            string
  handle:          string
  platform:        'FACEBOOK' | 'INSTAGRAM'
  avatarUrl:       string | null
  followers:       number
  tier:            InfluencerTier
  engagementRate:  number
  avgLikes:        number
  avgComments:     number
  postsPerWeek:    number
  categories:      string[]
  location:        string
  language:        string
  email:           string | null
  profileUrl:      string
  recentPosts:     InfluencerPost[]
  score:           number  // Pinnlo relevance score 0-100
}

export interface InfluencerPost {
  id:         string
  content:    string
  imageUrl:   string | null
  likes:      number
  comments:   number
  shares:     number
  postedAt:   string
}

export interface InfluencerSearchParams {
  keyword?:       string
  platform?:      string
  tier?:          InfluencerTier
  minEngagement?: number
  location?:      string
  language?:      string
}

// ── REST API access ───────────────────────────────────────────────
export type ApiKeyStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED'

export interface ApiKey {
  id:          string
  name:        string
  keyPrefix:   string    // e.g. "pk_live_abc..." — never full key
  status:      ApiKeyStatus
  permissions: string[]
  lastUsedAt:  string | null
  expiresAt:   string | null
  createdAt:   string
  requestsToday:  number
  requestsMonth:  number
}

export interface ApiUsageStats {
  requestsToday:   number
  requestsMonth:   number
  monthlyLimit:    number
  successRate:     number
  avgResponseMs:   number
  topEndpoints:    { path: string; count: number }[]
}

// ── Analytics ──────────────────────────────────────────────────────
export interface AnalyticsOverview {
  totalFollowers:  number
  followerGrowth:  number
  totalReach:      number
  reachGrowth:     number
  totalEngagement: number
  engagementRate:  number
  postsPublished:  number
}

export interface AnalyticsHistoryPoint {
  date:       string
  followers:  number
  reach:      number
  engagement: number
  posts:      number
}

export interface PostPerformance {
  id:             string
  content:        string
  platform:       string
  clientName:     string
  publishedAt:    string
  likes:          number
  comments:       number
  shares:         number
  reach:          number
  engagementRate: number
}

export interface HeatmapCell {
  day:   string
  hour:  number
  score: number
  label: string
}

// ── Comment moderation inbox ───────────────────────────────────────
export type InboxPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP' | 'LINE'
export type InboxThreadType = 'COMMENT' | 'DM'
export type InboxThreadStatus = 'OPEN' | 'CLOSED' | 'SPAM'
export type InboxMessageType = 'INBOUND' | 'OUTBOUND'

export interface InboxMessage {
  id:        string
  type:      InboxMessageType
  content:   string
  author:    string
  sentAt:    string
  isRead:    boolean
}

export interface InboxThread {
  id:          string
  type:        InboxThreadType
  platform:    InboxPlatform
  clientId:    string
  clientName:  string
  status:      InboxThreadStatus
  author:      string
  authorId:    string
  preview:     string
  unreadCount: number
  postContent: string | null
  messages:    InboxMessage[]
  lastMessageAt: string
  assignedTo:  string | null
}

// ── Message templates ─────────────────────────────────────────────
export type TemplateCategory =
  | 'GREETING'
  | 'FAQ'
  | 'PROMOTION'
  | 'FOLLOW_UP'
  | 'CLOSING'
  | 'CUSTOM'

export type TemplatePlatform = 'FACEBOOK' | 'WHATSAPP' | 'LINE' | 'ALL'

export interface MessageTemplate {
  id:          string
  name:        string
  content:     string
  category:    TemplateCategory
  platform:    TemplatePlatform
  variables:   string[]   // e.g. ['{{name}}', '{{product}}']
  usageCount:  number
  createdBy:   string
  createdAt:   string
  updatedAt:   string
}

export interface CreateTemplateInput {
  name:     string
  content:  string
  category: TemplateCategory
  platform: TemplatePlatform
}

// ── Broadcast campaigns ───────────────────────────────────────────
export type BroadcastStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENDING'
  | 'SENT'
  | 'FAILED'

export type BroadcastPlatform = 'FACEBOOK' | 'WHATSAPP' | 'LINE'

export interface BroadcastCampaign {
  id:             string
  name:           string
  platform:       BroadcastPlatform
  clientId:       string
  clientName:     string
  status:         BroadcastStatus
  message:        string
  templateId:     string | null
  recipientCount: number
  sentCount:      number
  failedCount:    number
  openRate:       number | null
  scheduledAt:    string | null
  sentAt:         string | null
  createdBy:      string
  createdAt:      string
  tags:           string[]   // filter contacts by tag
}

export interface CreateBroadcastInput {
  name:        string
  platform:    BroadcastPlatform
  clientId:    string
  message:     string
  templateId?: string
  tags:        string[]
  scheduledAt?: string
}

// ── Email campaigns ───────────────────────────────────────────────
export type EmailCampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENDING'
  | 'SENT'
  | 'FAILED'

export interface EmailCampaign {
  id:             string
  name:           string
  subject:        string
  previewText:    string
  body:           string
  clientId:       string
  clientName:     string
  status:         EmailCampaignStatus
  recipientCount: number
  sentCount:      number
  openCount:      number
  clickCount:     number
  openRate:       number | null
  clickRate:      number | null
  scheduledAt:    string | null
  sentAt:         string | null
  createdBy:      string
  createdAt:      string
  tags:           string[]
  fromName:       string
  fromEmail:      string
}

export interface CreateEmailCampaignInput {
  name:        string
  subject:     string
  previewText: string
  body:        string
  clientId:    string
  fromName:    string
  fromEmail:   string
  tags:        string[]
  scheduledAt?: string
}

// ── Bot flows ─────────────────────────────────────────────────────
export type FlowNodeType =
  | 'TRIGGER'
  | 'MESSAGE'
  | 'CONDITION'
  | 'ACTION'
  | 'DELAY'
  | 'TAG'
  | 'ASSIGN'
  | 'END'

export type FlowTriggerType =
  | 'KEYWORD'
  | 'FIRST_MESSAGE'
  | 'POSTBACK'
  | 'SCHEDULE'

export type FlowPlatform = 'FACEBOOK' | 'WHATSAPP' | 'LINE'
export type FlowStatus   = 'ACTIVE' | 'INACTIVE' | 'DRAFT'

export interface FlowNodePosition {
  x: number
  y: number
}

export interface FlowNodeData {
  // TRIGGER
  triggerType?:   FlowTriggerType
  keywords?:      string[]
  // MESSAGE
  message?:       string
  templateId?:    string
  // CONDITION
  conditionField?: string
  conditionOp?:   'equals' | 'contains' | 'exists'
  conditionValue?: string
  // ACTION
  actionType?:    'SEND_EMAIL' | 'WEBHOOK' | 'CREATE_CONTACT'
  actionConfig?:  Record<string, string>
  // DELAY
  delayMinutes?:  number
  // TAG
  tag?:           string
  tagAction?:     'ADD' | 'REMOVE'
  // ASSIGN
  assignTo?:      string
}

export interface FlowNode {
  id:       string
  type:     FlowNodeType
  label:    string
  position: FlowNodePosition
  data:     FlowNodeData
  nextNodeId:      string | null
  yesNodeId?:      string | null  // for CONDITION
  noNodeId?:       string | null  // for CONDITION
}

export interface BotFlow {
  id:          string
  name:        string
  description: string
  platform:    FlowPlatform
  clientId:    string
  clientName:  string
  status:      FlowStatus
  nodes:       FlowNode[]
  triggerCount: number
  completionRate: number
  createdBy:   string
  createdAt:   string
  updatedAt:   string
}

export interface CreateFlowInput {
  name:        string
  description: string
  platform:    FlowPlatform
  clientId:    string
}
