import { z } from 'zod'
import { makeCrudRoute, type CrudCtx } from '@open-mercato/shared/lib/crud/factory'
import { PartnerLicenseDeal } from '../../../data/entities'
import { licenseDealMinQuerySchema } from '../../../data/validators'
import { E } from '@/.mercato/generated/entities.ids.generated'
import { createPartnershipsCrudOpenApi } from '../../openapi'
import { createPagedListResponseSchema } from '@open-mercato/shared/lib/openapi/crud'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['partnerships.kpi.view'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: PartnerLicenseDeal,
    idField: 'id',
    orgField: 'organizationId',
    tenantField: 'tenantId',
    softDeleteField: 'deletedAt',
  },
  indexer: { entityType: E.partnerships.partner_license_deal },
  list: {
    schema: licenseDealMinQuerySchema,
    entityId: E.partnerships.partner_license_deal,
    fields: [
      'id', 'deal_name', 'customer_name', 'deal_type', 'status',
      'is_renewal', 'amount', 'partner_agency_id',
      'attributed_at', 'attributed_by_user_id', 'created_at',
    ],
    buildFilters: async (query: any, _ctx: CrudCtx) => {
      const filters: Record<string, any> = {
        deal_type: { $eq: 'enterprise' },
        status: { $eq: 'won' },
        is_renewal: { $eq: false },
      }

      const year = query.year ?? new Date().getFullYear()
      filters.created_at = {
        $gte: new Date(year, 0, 1).toISOString(),
        $lt: new Date(year + 1, 0, 1).toISOString(),
      }

      return filters
    },
  },
})

export const { GET } = crud

const kpiMinListItemSchema = z.object({
  id: z.string().uuid(),
  deal_name: z.string().nullable().optional(),
  customer_name: z.string().nullable().optional(),
  deal_type: z.string(),
  status: z.string(),
  is_renewal: z.boolean(),
  amount: z.number().nullable().optional(),
  partner_agency_id: z.string().uuid().nullable().optional(),
  attributed_at: z.string().nullable().optional(),
  attributed_by_user_id: z.string().uuid().nullable().optional(),
  created_at: z.string(),
})

export const openApi = createPartnershipsCrudOpenApi({
  resourceName: 'KPI MIN Deal',
  querySchema: licenseDealMinQuerySchema,
  listResponseSchema: createPagedListResponseSchema(kpiMinListItemSchema),
})
