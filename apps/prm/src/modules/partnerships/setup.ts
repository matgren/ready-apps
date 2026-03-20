import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { cf } from '@open-mercato/shared/modules/dsl'
import { CustomerPipeline, CustomerPipelineStage } from '@open-mercato/core/modules/customers/data/entities'
import { Dictionary, DictionaryEntry } from '@open-mercato/core/modules/dictionaries/data/entities'
import { ensureCustomFieldDefinitions } from '@open-mercato/core/modules/entities/lib/field-definitions'
import { E } from '#generated/entities.ids.generated'
import {
  PRM_PIPELINE_NAME,
  PRM_PIPELINE_STAGES,
  COMPANY_PROFILE_FIELDS,
  CASE_STUDY_FIELDS,
  WIP_REGISTERED_AT_FIELD,
  SERVICES_OPTIONS,
  INDUSTRIES_OPTIONS,
  TECHNOLOGIES_OPTIONS,
  VERTICALS_OPTIONS,
  BUDGET_BUCKET_OPTIONS,
  DURATION_BUCKET_OPTIONS,
} from './data/custom-fields'

// ---------------------------------------------------------------------------
// Dictionary definitions
// ---------------------------------------------------------------------------

type DictionaryDef = {
  key: string
  name: string
  options: readonly string[]
}

const DICTIONARIES: DictionaryDef[] = [
  { key: 'prm_services', name: 'Services', options: SERVICES_OPTIONS },
  { key: 'prm_industries', name: 'Industries', options: INDUSTRIES_OPTIONS },
  { key: 'prm_technologies', name: 'Technologies', options: TECHNOLOGIES_OPTIONS },
  { key: 'prm_verticals', name: 'Verticals', options: VERTICALS_OPTIONS },
  { key: 'prm_budget_bucket', name: 'Budget Bucket', options: BUDGET_BUCKET_OPTIONS },
  { key: 'prm_duration_bucket', name: 'Duration Bucket', options: DURATION_BUCKET_OPTIONS },
]

// ---------------------------------------------------------------------------
// Field definition mapping helpers
// ---------------------------------------------------------------------------

/**
 * Maps custom-fields.ts FieldDefinition types to OM CustomFieldDefinition
 * via the cf.* DSL helpers.
 */
function mapFieldDefinitions(
  fields: typeof COMPANY_PROFILE_FIELDS | typeof CASE_STUDY_FIELDS
) {
  return fields.map((field) => {
    const opts: Record<string, unknown> = { label: field.label }
    if (field.required) opts.required = true
    if (field.hidden === true) opts.listVisible = false

    switch (field.type) {
      case 'text':
        return cf.text(field.key, opts)
      case 'long_text':
        return cf.multiline(field.key, opts)
      case 'number':
        return cf.integer(field.key, opts)
      case 'boolean':
        return cf.boolean(field.key, opts)
      case 'date':
      case 'date_time':
        // OM stores dates as text custom fields with a date-like key convention
        return cf.text(field.key, opts)
      case 'select':
        return cf.select(field.key, field.options ?? [], opts)
      case 'multi_select':
        return cf.select(field.key, field.options ?? [], { ...opts, multi: true })
      default:
        return cf.text(field.key, opts)
    }
  })
}

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

type SeedScope = { tenantId: string; organizationId: string }

async function seedPrmPipeline(
  em: import('@mikro-orm/postgresql').EntityManager,
  scope: SeedScope
): Promise<void> {
  const existing = await em.findOne(CustomerPipeline, {
    tenantId: scope.tenantId,
    organizationId: scope.organizationId,
    name: PRM_PIPELINE_NAME,
  })
  if (existing) return

  const pipeline = em.create(CustomerPipeline, {
    tenantId: scope.tenantId,
    organizationId: scope.organizationId,
    name: PRM_PIPELINE_NAME,
    isDefault: false,
  })
  em.persist(pipeline)
  await em.flush()

  for (const stage of PRM_PIPELINE_STAGES) {
    em.persist(
      em.create(CustomerPipelineStage, {
        tenantId: scope.tenantId,
        organizationId: scope.organizationId,
        pipelineId: pipeline.id,
        label: stage.name,
        order: stage.order,
      })
    )
  }
  await em.flush()
}

async function seedCustomFields(
  em: import('@mikro-orm/postgresql').EntityManager,
  scope: SeedScope
): Promise<void> {
  const fieldSets = [
    {
      entity: E.customers.customer_deal,
      fields: [
        cf.text(WIP_REGISTERED_AT_FIELD.key, {
          label: WIP_REGISTERED_AT_FIELD.label,
          listVisible: false,
        }),
      ],
    },
    {
      entity: E.customers.customer_company_profile,
      fields: mapFieldDefinitions(COMPANY_PROFILE_FIELDS),
    },
    {
      entity: 'partnerships:case_study',
      fields: mapFieldDefinitions(CASE_STUDY_FIELDS),
    },
  ]

  await ensureCustomFieldDefinitions(em, fieldSets, {
    organizationId: null,
    tenantId: scope.tenantId,
  })
}

async function seedDictionaries(
  em: import('@mikro-orm/postgresql').EntityManager,
  scope: SeedScope
): Promise<void> {
  for (const dict of DICTIONARIES) {
    let dictionary = await em.findOne(Dictionary, {
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
      key: dict.key,
    })

    if (!dictionary) {
      dictionary = em.create(Dictionary, {
        tenantId: scope.tenantId,
        organizationId: scope.organizationId,
        key: dict.key,
        name: dict.name,
        isSystem: true,
      })
      em.persist(dictionary)
      await em.flush()
    }

    for (const option of dict.options) {
      const normalized = option.toLowerCase()
      const existing = await em.findOne(DictionaryEntry, {
        dictionary,
        tenantId: scope.tenantId,
        organizationId: scope.organizationId,
        normalizedValue: normalized,
      })
      if (!existing) {
        em.persist(
          em.create(DictionaryEntry, {
            dictionary,
            tenantId: scope.tenantId,
            organizationId: scope.organizationId,
            value: option,
            normalizedValue: normalized,
            label: option,
          })
        )
      }
    }
    await em.flush()
  }
}

// ---------------------------------------------------------------------------
// Module setup
// ---------------------------------------------------------------------------

export const setup: ModuleSetupConfig = {
  seedDefaults: async (ctx) => {
    const scope: SeedScope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    await seedPrmPipeline(ctx.em, scope)
    await seedCustomFields(ctx.em, scope)
    await seedDictionaries(ctx.em, scope)
  },

  defaultRoleFeatures: {
    partner_admin: [
      'customers.*',
      'partnerships.manage',
      'partnerships.widgets.onboarding-checklist',
    ],
    partner_member: [
      'customers.*',
      'partnerships.widgets.wip-count',
      'partnerships.widgets.onboarding-checklist',
    ],
    partner_contributor: [
      'partnerships.widgets.onboarding-checklist',
    ],
    partnership_manager: [
      'customers.people.view',
      'customers.companies.view',
      'customers.deals.view',
      'customers.pipelines.view',
      'partnerships.manage',
      'partnerships.widgets.wip-count',
    ],
  },
}

export default setup
