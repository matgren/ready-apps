import { z } from 'zod'
import { WIC_LEVEL_OPTIONS, WIC_SOURCE_OPTIONS } from './custom-fields'

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

export const wicScoringResultSchema = z.object({
  contributorGithubUsername: z.string().min(1, 'GitHub username is required'),
  prId: z.string().min(1, 'PR ID is required'),
  month: z.string().regex(MONTH_REGEX, 'month must be in YYYY-MM format'),
  featureKey: z.string().min(1, 'Feature key is required'),
  level: z.enum(WIC_LEVEL_OPTIONS),
  impactBonus: z.boolean(),
  bountyApplied: z.boolean(),
})

export type WicScoringResult = z.infer<typeof wicScoringResultSchema>

export const wicImportRequestSchema = z.object({
  organizationId: z.string().uuid('organizationId must be a valid UUID'),
  month: z.string().regex(MONTH_REGEX, 'month must be in YYYY-MM format'),
  source: z.enum(WIC_SOURCE_OPTIONS),
  records: z.array(wicScoringResultSchema).min(1, 'At least one record is required').max(500, 'Maximum 500 records per batch'),
})

export type WicImportRequest = z.infer<typeof wicImportRequestSchema>
