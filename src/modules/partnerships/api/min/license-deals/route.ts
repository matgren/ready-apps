import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CrudHttpError } from '@open-mercato/shared/lib/crud/errors'
import { createRequestContainer } from '@open-mercato/shared/lib/di/container'
import { CommandBus } from '@open-mercato/shared/lib/commands/command-bus'
import type { CommandRuntimeContext } from '@open-mercato/shared/lib/commands'
import { resolveOrganizationScopeForRequest } from '@open-mercato/core/modules/directory/utils/organizationScope'
import { PartnerLicenseDeal } from '../../../data/entities'
import {
  licenseDealListQuerySchema,
  createLicenseDealSchema,
  updateLicenseDealSchema,
  attributeLicenseDealSchema,
} from '../../../data/validators'
import { E } from '@/.mercato/generated/entities.ids.generated'
import { createPartnershipsCrudOpenApi } from '../../openapi'
import { createPagedListResponseSchema } from '@open-mercato/shared/lib/openapi/crud'

const rawBodySchema = z.object({}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['partnerships.kpi.view'] },
  POST: { requireAuth: true, requireFeatures: ['partnerships.kpi.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['partnerships.kpi.manage'] },
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
    schema: licenseDealListQuerySchema,
    entityId: E.partnerships.partner_license_deal,
    fields: [
      'id', 'deal_name', 'customer_name', 'deal_type', 'status',
      'is_renewal', 'amount', 'partner_agency_id',
      'attributed_at', 'attributed_by_user_id', 'created_at',
    ],
  },
  actions: {
    create: {
      commandId: 'partnerships.partner_license_deal.create',
      schema: rawBodySchema,
      mapInput: async ({ raw }) => createLicenseDealSchema.parse(raw ?? {}),
      response: ({ result }) => ({ id: result?.id }),
      status: 201,
    },
    update: {
      commandId: 'partnerships.partner_license_deal.update',
      schema: rawBodySchema,
      mapInput: async ({ raw }) => updateLicenseDealSchema.parse(raw ?? {}),
      response: ({ result }) => ({ id: result?.id }),
    },
  },
})

// Export GET and POST from the factory
export const { GET, POST } = crud

// Custom PUT handler: branches between update and attribute commands
export async function PUT(req: NextRequest, ctx: any) {
  const body = await req.json()
  const container = await createRequestContainer()
  const commandBus = container.resolve('commandBus') as CommandBus
  const scope = await resolveOrganizationScopeForRequest({ container, auth: ctx.auth, request: req })
  const effectiveOrgId = scope.selectedId ?? ctx.auth?.orgId ?? null
  const runtimeCtx: CommandRuntimeContext = {
    container,
    auth: ctx.auth,
    organizationScope: scope,
    selectedOrganizationId: effectiveOrgId,
    organizationIds: scope.filterIds ?? (effectiveOrgId ? [effectiveOrgId] : null),
    request: req,
  }

  // If partnerAgencyId is present, use the attribute command
  if (body.partnerAgencyId && body.id) {
    const input = attributeLicenseDealSchema.parse(body)
    const { result } = await commandBus.execute('partnerships.partner_license_deal.attribute', { input, ctx: runtimeCtx })
    return Response.json({ ok: true, data: { id: (result as any).id } })
  }

  const input = updateLicenseDealSchema.parse(body)
  const { result } = await commandBus.execute('partnerships.partner_license_deal.update', { input, ctx: runtimeCtx })
  return Response.json({ ok: true, data: { id: (result as any).id } })
}

const licenseDealListItemSchema = z.object({
  id: z.string().uuid(),
  deal_name: z.string().nullable().optional(),
  customer_name: z.string().nullable().optional(),
  deal_type: z.string().nullable().optional(),
  status: z.string(),
  is_renewal: z.boolean().nullable().optional(),
  amount: z.number().nullable().optional(),
  partner_agency_id: z.string().uuid().nullable().optional(),
  attributed_at: z.string().nullable().optional(),
  attributed_by_user_id: z.string().uuid().nullable().optional(),
  created_at: z.string(),
})

export const openApi = createPartnershipsCrudOpenApi({
  resourceName: 'License Deal',
  querySchema: licenseDealListQuerySchema,
  listResponseSchema: createPagedListResponseSchema(licenseDealListItemSchema),
  create: {
    schema: createLicenseDealSchema,
    description: 'Create a new license deal.',
    status: 201,
  },
  update: {
    schema: updateLicenseDealSchema.or(attributeLicenseDealSchema),
    description: 'Update or attribute a license deal.',
  },
})
