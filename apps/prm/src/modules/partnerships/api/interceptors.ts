import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { CustomerPipelineStage } from '@open-mercato/core/modules/customers/data/entities'
import { CustomFieldValue } from '@open-mercato/core/modules/entities/data/entities'
import { PRM_SQL_STAGE_ORDER } from '../data/custom-fields'

const DEAL_ENTITY_ID = 'customers:customer_deal'
const WIP_FIELD_KEY = 'wip_registered_at'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'partnerships.wip-stamp-guard',
    targetRoute: 'customers/deals',
    methods: ['PATCH', 'POST'],
    priority: 50,
    async before(request) {
      const customFields = (request.body?.customFields as Record<string, unknown> | undefined)
      if (!customFields || !(WIP_FIELD_KEY in customFields)) {
        return { ok: true }
      }

      const { [WIP_FIELD_KEY]: _stripped, ...rest } = customFields
      return {
        ok: true,
        body: {
          ...request.body,
          customFields: rest,
        },
      }
    },
  },
  {
    id: 'partnerships.wip-stamp-after',
    targetRoute: 'customers/deals',
    methods: ['PATCH'],
    priority: 50,
    async after(_request, response, context) {
      if (response.statusCode !== 200) return {}

      const dealId = response.body.id as string | undefined
      const pipelineStageId = response.body.pipelineStageId as string | undefined

      if (!dealId || !pipelineStageId) return {}

      const stage = await context.em.findOne(CustomerPipelineStage, { id: pipelineStageId })
      if (!stage || stage.order < PRM_SQL_STAGE_ORDER) return {}

      const existingValue = await context.em.findOne(CustomFieldValue, {
        entityId: DEAL_ENTITY_ID,
        recordId: dealId,
        fieldKey: WIP_FIELD_KEY,
        deletedAt: null,
      })

      if (existingValue?.valueText) return {}

      const cfValue = new CustomFieldValue()
      cfValue.entityId = DEAL_ENTITY_ID
      cfValue.recordId = dealId
      cfValue.fieldKey = WIP_FIELD_KEY
      cfValue.valueText = new Date().toISOString()
      cfValue.organizationId = context.organizationId
      cfValue.tenantId = context.tenantId

      context.em.persist(cfValue)
      await context.em.flush()

      return {}
    },
  },
]
