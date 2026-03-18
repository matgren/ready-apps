import { Entity, PrimaryKey, Property, Index, Unique, OptionalProps } from '@mikro-orm/core'

// ── PartnerAgency ──────────────────────────────────────────

@Entity({ tableName: 'partner_agencies' })
@Index({ name: 'idx_partner_agencies_tenant_org', properties: ['tenantId', 'organizationId'] })
@Unique({ name: 'uq_partner_agencies_agency_org', properties: ['tenantId', 'organizationId', 'agencyOrganizationId'] })
export class PartnerAgency {
  [OptionalProps]?: 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'agency_organization_id', type: 'uuid' })
  agencyOrganizationId!: string

  @Property({ type: 'text', default: 'active' })
  status: string = 'active'

  @Property({ name: 'onboarded_at', type: Date, nullable: true })
  onboardedAt?: Date | null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()

  @Property({ name: 'deleted_at', type: Date, nullable: true })
  deletedAt?: Date | null
}

// ── PartnerTierDefinition ──────────────────────────────────

@Entity({ tableName: 'partner_tier_definitions' })
@Index({ name: 'idx_partner_tier_defs_tenant_org', properties: ['tenantId', 'organizationId'] })
@Unique({ name: 'uq_partner_tier_defs_key', properties: ['tenantId', 'organizationId', 'key'] })
export class PartnerTierDefinition {
  [OptionalProps]?: 'isActive' | 'createdAt' | 'updatedAt' | 'deletedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ type: 'text' })
  key!: string

  @Property({ type: 'text' })
  label!: string

  @Property({ name: 'wic_threshold', type: 'integer', default: 0 })
  wicThreshold: number = 0

  @Property({ name: 'wip_threshold', type: 'integer', default: 0 })
  wipThreshold: number = 0

  @Property({ name: 'min_threshold', type: 'integer', default: 0 })
  minThreshold: number = 0

  @Property({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean = true

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()

  @Property({ name: 'deleted_at', type: Date, nullable: true })
  deletedAt?: Date | null
}

// ── PartnerTierAssignment ──────────────────────────────────

@Entity({ tableName: 'partner_tier_assignments' })
@Index({ name: 'idx_partner_tier_assign_agency', properties: ['tenantId', 'organizationId', 'partnerAgencyId', 'validUntil'] })
export class PartnerTierAssignment {
  [OptionalProps]?: 'createdAt' | 'updatedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'partner_agency_id', type: 'uuid' })
  partnerAgencyId!: string

  @Property({ name: 'tier_key', type: 'text' })
  tierKey!: string

  @Property({ name: 'granted_at', type: Date })
  grantedAt!: Date

  @Property({ name: 'valid_until', type: Date, nullable: true })
  validUntil?: Date | null

  @Property({ type: 'text', nullable: true })
  reason?: string | null

  @Property({ name: 'assigned_by_user_id', type: 'uuid', nullable: true })
  assignedByUserId?: string | null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}

// ── PartnerMetricSnapshot ──────────────────────────────────

export type MetricKey = 'wic' | 'wip' | 'min'
export type MetricSource = 'ingest' | 'crm' | 'manual'

@Entity({ tableName: 'partner_metric_snapshots' })
@Index({ name: 'idx_partner_metrics_tenant_org', properties: ['tenantId', 'organizationId'] })
@Unique({ name: 'uq_partner_metrics_snapshot', properties: ['tenantId', 'organizationId', 'partnerAgencyId', 'metricKey', 'periodStart', 'periodEnd'] })
export class PartnerMetricSnapshot {
  [OptionalProps]?: 'source' | 'createdAt' | 'updatedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'partner_agency_id', type: 'uuid' })
  partnerAgencyId!: string

  @Property({ name: 'metric_key', type: 'text' })
  metricKey!: MetricKey

  @Property({ name: 'period_start', type: 'date' })
  periodStart!: Date

  @Property({ name: 'period_end', type: 'date' })
  periodEnd!: Date

  @Property({ type: 'numeric' })
  value!: number

  @Property({ type: 'text', default: 'ingest' })
  source: MetricSource = 'ingest'

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}

// ── PartnerRfpCampaign ─────────────────────────────────────

export type RfpCampaignStatus = 'draft' | 'published' | 'closed' | 'withdrawn'

@Entity({ tableName: 'partner_rfp_campaigns' })
@Index({ name: 'idx_partner_rfp_campaigns_tenant_org', properties: ['tenantId', 'organizationId'] })
export class PartnerRfpCampaign {
  [OptionalProps]?: 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ type: 'text' })
  title!: string

  @Property({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId?: string | null

  @Property({ type: 'text', default: 'draft' })
  status: RfpCampaignStatus = 'draft'

  @Property({ name: 'published_at', type: Date, nullable: true })
  publishedAt?: Date | null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()

  @Property({ name: 'deleted_at', type: Date, nullable: true })
  deletedAt?: Date | null
}

// ── PartnerRfpResponse ─────────────────────────────────────

export type RfpResponseStatus = 'invited' | 'draft' | 'submitted' | 'withdrawn' | 'selected'

@Entity({ tableName: 'partner_rfp_responses' })
@Unique({ name: 'uq_partner_rfp_responses_agency_campaign', properties: ['tenantId', 'organizationId', 'rfpCampaignId', 'partnerAgencyId'] })
export class PartnerRfpResponse {
  [OptionalProps]?: 'status' | 'createdAt' | 'updatedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'rfp_campaign_id', type: 'uuid' })
  rfpCampaignId!: string

  @Property({ name: 'partner_agency_id', type: 'uuid' })
  partnerAgencyId!: string

  @Property({ type: 'text', default: 'invited' })
  status: RfpResponseStatus = 'invited'

  @Property({ type: 'numeric', nullable: true })
  score?: number | null

  @Property({ name: 'submitted_at', type: Date, nullable: true })
  submittedAt?: Date | null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}

// ── PartnerLicenseDeal (MIN attribution) ───────────────────

export type LicenseDealStatus = 'pending' | 'won' | 'lost'

@Entity({ tableName: 'partner_license_deals' })
@Index({ name: 'idx_partner_license_deals_tenant_org', properties: ['tenantId', 'organizationId'] })
export class PartnerLicenseDeal {
  [OptionalProps]?: 'status' | 'isRenewal' | 'createdAt' | 'updatedAt' | 'deletedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'customer_id', type: 'uuid' })
  customerId!: string

  @Property({ name: 'deal_type', type: 'text' })
  dealType!: string

  @Property({ type: 'text', default: 'pending' })
  status: LicenseDealStatus = 'pending'

  @Property({ name: 'is_renewal', type: 'boolean', default: false })
  isRenewal: boolean = false

  @Property({ name: 'partner_agency_id', type: 'uuid', nullable: true })
  partnerAgencyId?: string | null

  @Property({ name: 'attributed_at', type: Date, nullable: true })
  attributedAt?: Date | null

  @Property({ name: 'attributed_by_user_id', type: 'uuid', nullable: true })
  attributedByUserId?: string | null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()

  @Property({ name: 'deleted_at', type: Date, nullable: true })
  deletedAt?: Date | null
}

// ── PartnerWicRun ──────────────────────────────────────────

export type WicRunStatus = 'pending' | 'completed' | 'failed'

@Entity({ tableName: 'partner_wic_runs' })
@Index({ name: 'idx_partner_wic_runs_tenant_org', properties: ['tenantId', 'organizationId'] })
export class PartnerWicRun {
  [OptionalProps]?: 'status' | 'createdAt' | 'updatedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'run_date', type: 'date' })
  runDate!: Date

  @Property({ name: 'period_start', type: 'date' })
  periodStart!: Date

  @Property({ name: 'period_end', type: 'date' })
  periodEnd!: Date

  @Property({ name: 'script_version', type: 'text' })
  scriptVersion!: string

  @Property({ type: 'text', default: 'pending' })
  status: WicRunStatus = 'pending'

  @Property({ name: 'raw_output', type: 'text', nullable: true })
  rawOutput?: string | null

  @Property({ name: 'imported_by_user_id', type: 'uuid', nullable: true })
  importedByUserId?: string | null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}

// ── PartnerWicContributionUnit ─────────────────────────────

@Entity({ tableName: 'partner_wic_contribution_units' })
@Index({ name: 'idx_partner_wic_units_tenant_org', properties: ['tenantId', 'organizationId'] })
@Unique({ name: 'uq_partner_wic_units_dedup', properties: ['tenantId', 'organizationId', 'ghProfile', 'monthKey', 'featureKey'] })
export class PartnerWicContributionUnit {
  [OptionalProps]?: 'bountyMultiplier' | 'bountyBonus' | 'createdAt' | 'updatedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'wic_run_id', type: 'uuid' })
  wicRunId!: string

  @Property({ name: 'partner_agency_id', type: 'uuid', nullable: true })
  partnerAgencyId?: string | null

  @Property({ name: 'gh_profile', type: 'text' })
  ghProfile!: string

  @Property({ name: 'month_key', type: 'text' })
  monthKey!: string

  @Property({ name: 'feature_key', type: 'text', nullable: true })
  featureKey?: string | null

  @Property({ name: 'base_score', type: 'numeric' })
  baseScore!: number

  @Property({ name: 'impact_bonus', type: 'numeric', default: 0 })
  impactBonus: number = 0

  @Property({ name: 'bounty_multiplier', type: 'numeric', default: 1 })
  bountyMultiplier: number = 1

  @Property({ name: 'wic_final', type: 'numeric' })
  wicFinal!: number

  @Property({ name: 'wic_level', type: 'text', nullable: true })
  wicLevel?: string | null

  @Property({ name: 'bounty_bonus', type: 'numeric', default: 0 })
  bountyBonus: number = 0

  @Property({ name: 'included_reason', type: 'text', nullable: true })
  includedReason?: string | null

  @Property({ name: 'excluded_reason', type: 'text', nullable: true })
  excludedReason?: string | null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}
