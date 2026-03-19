import { z } from 'zod'
import { makeCrudRoute, type CrudCtx } from '@open-mercato/shared/lib/crud/factory'
import { CrudHttpError } from '@open-mercato/shared/lib/crud/errors'
import { findOneWithDecryption } from '@open-mercato/shared/lib/encryption/find'
import { PartnerAgency, PartnerTierAssignment } from '../../../../data/entities'
import { tierHistoryQuerySchema } from '../../../../data/validators'
import { E } from '@/.mercato/generated/entities.ids.generated'
import { createPartnershipsCrudOpenApi } from '../../../openapi'
import { createPagedListResponseSchema } from '@open-mercato/shared/lib/openapi/crud'
import type { EntityManager } from '@mikro-orm/postgresql'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['partnerships.tiers.view'] },
}
export const metadata = routeMetadata

function extractOrganizationIdFromUrl(request?: Request): string | null {
  if (!request) return null
  try {
    const url = new URL(request.url)
    // Path: /api/partnerships/agencies/<organizationId>/tier-history
    const segments = url.pathname.split('/')
    const agenciesIdx = segments.indexOf('agencies')
    if (agenciesIdx >= 0 && agenciesIdx + 1 < segments.length) {
      return segments[agenciesIdx + 1] || null
    }
  } catch {}
  return null
}

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: PartnerTierAssignment,
    idField: 'id',
    orgField: 'organizationId',
    tenantField: 'tenantId',
    softDeleteField: null,
  },
  indexer: { entityType: E.partnerships.partner_tier_assignment },
  list: {
    schema: tierHistoryQuerySchema,
    entityId: E.partnerships.partner_tier_assignment,
    fields: [
      'id', 'tier_key', 'granted_at', 'valid_until',
      'reason', 'assigned_by_user_id', 'created_at', 'partner_agency_id',
    ],
    buildFilters: async (_query: any, ctx: CrudCtx) => {
      const agencyOrgId = extractOrganizationIdFromUrl(ctx.request)
      if (!agencyOrgId) {
        throw new CrudHttpError(400, { error: 'Missing organizationId param' })
      }

      const em = ctx.container.resolve('em') as EntityManager
      const tenantId = ctx.auth?.tenantId ?? null
      const organizationId = ctx.selectedOrganizationId ?? ctx.auth?.orgId ?? null
      const agency = await findOneWithDecryption(
        em,
        PartnerAgency as any,
        {
          tenantId,
          organizationId,
          agencyOrganizationId: agencyOrgId,
          deletedAt: null,
        } as any,
        undefined,
        { tenantId, organizationId },
      )
      if (!agency) {
        throw new CrudHttpError(404, { error: 'Partner agency not found' })
      }

      return { partner_agency_id: { $eq: (agency as any).id } }
    },
  },
})

export const { GET } = crud

const tierHistoryItemSchema = z.object({
  id: z.string().uuid(),
  tier_key: z.string(),
  granted_at: z.string(),
  valid_until: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  assigned_by_user_id: z.string().uuid().nullable().optional(),
  created_at: z.string(),
  partner_agency_id: z.string().uuid(),
})

export const openApi = createPartnershipsCrudOpenApi({
  resourceName: 'Tier History',
  querySchema: tierHistoryQuerySchema,
  listResponseSchema: createPagedListResponseSchema(tierHistoryItemSchema),
})
