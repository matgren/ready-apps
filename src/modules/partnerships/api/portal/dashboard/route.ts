import type { NextRequest } from 'next/server'
import { getCustomerAuthFromRequest } from '@open-mercato/core/modules/customer_accounts/lib/customerAuth'
import { createRequestContainer } from '@open-mercato/shared/lib/di/container'
import { resolvePartnerAgency } from '../../../lib/resolvePartnerAgency'
import { PartnerTierAssignment, PartnerMetricSnapshot, PartnerRfpCampaign } from '../../../data/entities'

export const metadata = {
  GET: { requireCustomerAuth: true, requireCustomerFeatures: ['portal.partner.kpi.view'] },
}

export async function GET(req: NextRequest, ctx: any) {
  const auth = await getCustomerAuthFromRequest(req)
  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const container = await createRequestContainer()
  const em = container.resolve('em') as any

  const agencyCtx = await resolvePartnerAgency(em, auth.customerEntityId, auth.tenantId, auth.orgId)
  if (!agencyCtx) {
    return Response.json({ error: 'No partner agency linked to your account' }, { status: 403 })
  }

  const { agency } = agencyCtx

  const tierAssignment = await em.findOne(
    PartnerTierAssignment,
    { tenantId: auth.tenantId, organizationId: auth.orgId, partnerAgencyId: agency.id },
    { orderBy: { createdAt: 'DESC' } },
  )

  const metrics = await em.find(
    PartnerMetricSnapshot,
    { tenantId: auth.tenantId, organizationId: auth.orgId, partnerAgencyId: agency.id },
    { orderBy: { periodEnd: 'DESC' }, limit: 3 },
  )

  const wic = metrics.find((m: PartnerMetricSnapshot) => m.metricKey === 'wic')?.value ?? 0
  const wip = metrics.find((m: PartnerMetricSnapshot) => m.metricKey === 'wip')?.value ?? 0
  const min = metrics.find((m: PartnerMetricSnapshot) => m.metricKey === 'min')?.value ?? 0

  const activeRfps = await em.count(PartnerRfpCampaign, {
    tenantId: auth.tenantId,
    organizationId: auth.orgId,
    status: 'published',
    deletedAt: null,
  })

  return Response.json({
    ok: true,
    data: {
      agency: {
        id: agency.id,
        name: agency.name ?? agency.agencyOrganizationId,
        status: agency.status,
      },
      tier: tierAssignment
        ? {
            key: tierAssignment.tierKey,
            assignedAt: tierAssignment.grantedAt?.toISOString() ?? null,
            validUntil: tierAssignment.validUntil?.toISOString() ?? null,
          }
        : null,
      kpiSummary: { wic, wip, min },
      activeRfpCount: activeRfps,
    },
  })
}
