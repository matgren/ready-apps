import type { CustomEntitySpec } from '@open-mercato/shared/modules/entities'
import taxonomy from './data/taxonomy-v1.json'

const buckets = taxonomy.buckets

const caseStudyEntity: CustomEntitySpec = {
  id: 'user:case_study',
  label: 'Case Studies',
  description: 'Structured project evidence for partner matching and RFP scoring.',
  labelField: 'title',
  showInSidebar: true,
  fields: [
    { key: 'title', kind: 'text', label: 'Title', required: true, listVisible: true, formEditable: true },
    { key: 'summary', kind: 'multiline', label: 'Summary', formEditable: true },
    { key: 'provider_company_name', kind: 'text', label: 'Provider Company', listVisible: true, formEditable: true },
    { key: 'project_type', kind: 'select', label: 'Project Type', options: buckets.project_type, defaultValue: 'unknown', listVisible: true, formEditable: true },
    { key: 'duration_bucket', kind: 'select', label: 'Duration', options: buckets.duration_bucket, defaultValue: 'unknown', listVisible: true, formEditable: true },
    { key: 'duration_weeks', kind: 'integer', label: 'Duration (weeks)', formEditable: true },
    { key: 'budget_known', kind: 'boolean', label: 'Budget Known', defaultValue: false, listVisible: true, formEditable: true },
    { key: 'budget_bucket', kind: 'select', label: 'Budget Range', options: buckets.budget_bucket, defaultValue: 'unknown', listVisible: true, formEditable: true },
    { key: 'budget_min_usd', kind: 'float', label: 'Budget Min (USD)', formEditable: true },
    { key: 'budget_max_usd', kind: 'float', label: 'Budget Max (USD)', formEditable: true },
    { key: 'delivery_models', kind: 'select', label: 'Delivery Models', options: buckets.delivery_models, multi: true, formEditable: true, listVisible: true },
    { key: 'outcome_kpis', kind: 'multiline', label: 'Outcome KPIs', formEditable: true },
    { key: 'source_url', kind: 'text', label: 'Source URL', formEditable: true },
    { key: 'confidence_score', kind: 'integer', label: 'Confidence Score', defaultValue: 3, listVisible: true, formEditable: true },
    { key: 'is_public_reference', kind: 'boolean', label: 'Public Reference', defaultValue: false, listVisible: true, formEditable: true },
    { key: 'completed_year', kind: 'integer', label: 'Completed Year', listVisible: true, formEditable: true },
  ],
}

// Extension fields only — entity metadata (label, showInSidebar) owned by customers module
const companyProfileFields: CustomEntitySpec = {
  id: 'customers:customer_company_profile',
  fields: [
    { key: 'positioning_summary', kind: 'multiline', label: 'Positioning Summary', formEditable: true },
    { key: 'delivery_models', kind: 'select', label: 'Delivery Models', options: buckets.delivery_models, multi: true, defaultValue: 'hybrid', formEditable: true, listVisible: true },
    { key: 'team_size_bucket', kind: 'select', label: 'Team Size', options: buckets.team_size_bucket, defaultValue: 'unknown', formEditable: true, listVisible: true },
    { key: 'min_project_size_bucket', kind: 'select', label: 'Min Project Size', options: buckets.min_project_size_bucket, defaultValue: 'unknown', formEditable: true, listVisible: true },
    { key: 'hourly_rate_bucket', kind: 'select', label: 'Hourly Rate', options: buckets.hourly_rate_bucket, defaultValue: 'unknown', formEditable: true },
    { key: 'clutch_url', kind: 'text', label: 'Clutch URL', formEditable: true },
    { key: 'profile_confidence', kind: 'integer', label: 'Profile Confidence', defaultValue: 3, formEditable: true },
  ],
}

export const entities = [caseStudyEntity, companyProfileFields]
export default entities
