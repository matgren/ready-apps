import { z } from 'zod'

const uuid = () => z.string().uuid()

// ── Agency ─────────────────────────────────────────────────

export const onboardAgencySchema = z.object({
  agencyOrganizationId: uuid(),
})

export type OnboardAgencyInput = z.infer<typeof onboardAgencySchema>

// ── Tier Definition ────────────────────────────────────────

export const createTierDefinitionSchema = z.object({
  key: z.string().trim().min(1).max(50),
  label: z.string().trim().min(1).max(200),
  wicThreshold: z.number().int().min(0).default(0),
  wipThreshold: z.number().int().min(0).default(0),
  minThreshold: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const updateTierDefinitionSchema = z.object({
  id: uuid(),
  label: z.string().trim().min(1).max(200).optional(),
  wicThreshold: z.number().int().min(0).optional(),
  wipThreshold: z.number().int().min(0).optional(),
  minThreshold: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

export type CreateTierDefinitionInput = z.infer<typeof createTierDefinitionSchema>
export type UpdateTierDefinitionInput = z.infer<typeof updateTierDefinitionSchema>

// ── Tier Assignment ────────────────────────────────────────

export const assignTierSchema = z.object({
  partnerAgencyId: uuid(),
  tierKey: z.string().trim().min(1).max(50),
  validUntil: z.string().datetime().optional(),
  reason: z.string().trim().max(500).optional(),
})

export type AssignTierInput = z.infer<typeof assignTierSchema>

// ── Metric Snapshot ────────────────────────────────────────

export const ingestMetricSnapshotSchema = z.object({
  partnerAgencyId: uuid(),
  metricKey: z.enum(['wic', 'wip', 'min']),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number().min(0),
  source: z.enum(['ingest', 'crm', 'manual']).default('ingest'),
})

export type IngestMetricSnapshotInput = z.infer<typeof ingestMetricSnapshotSchema>

// ── RFP Campaign ───────────────────────────────────────────

export const createRfpCampaignSchema = z.object({
  title: z.string().trim().min(1).max(500),
  customerId: uuid().optional(),
})

export const updateRfpCampaignSchema = z.object({
  id: uuid(),
  title: z.string().trim().min(1).max(500).optional(),
  status: z.enum(['draft', 'published', 'closed', 'withdrawn']).optional(),
})

export type CreateRfpCampaignInput = z.infer<typeof createRfpCampaignSchema>
export type UpdateRfpCampaignInput = z.infer<typeof updateRfpCampaignSchema>

// ── RFP Response ───────────────────────────────────────────

export const submitRfpResponseSchema = z.object({
  rfpCampaignId: uuid(),
  partnerAgencyId: uuid(),
  status: z.enum(['invited', 'draft', 'submitted', 'withdrawn', 'selected']).default('draft'),
  score: z.number().min(0).max(100).optional(),
})

export type SubmitRfpResponseInput = z.infer<typeof submitRfpResponseSchema>
