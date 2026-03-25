import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createRequestContainer } from '@open-mercato/shared/lib/di/container'
import { getAuthFromRequest } from '@open-mercato/shared/lib/auth/server'
import type { EntityManager } from '@mikro-orm/postgresql'
import type { EventBus } from '@open-mercato/events/types'
import type { OpenApiMethodDoc, OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'
import { PartnerRfpCampaign } from '../../data/entities'

export const metadata = {
  path: '/partnerships/rfp-campaigns-publish',
  POST: { requireAuth: true, requireFeatures: ['partnerships.rfp.manage'] },
}

const publishSchema = z.object({
  campaignId: z.string().uuid(),
})

async function POST(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = publishSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { campaignId } = parsed.data
  const container = await createRequestContainer()
  const em = container.resolve('em') as EntityManager
  const tenantId = auth.tenantId

  const campaign = await em.findOne(PartnerRfpCampaign, {
    id: campaignId,
    tenantId,
  })

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  if (campaign.status !== 'draft') {
    return NextResponse.json(
      { error: `Campaign is already ${campaign.status}` },
      { status: 422 },
    )
  }

  campaign.status = 'open'
  await em.flush()

  // Emit event (best-effort)
  try {
    const eventBus = container.resolve('eventBus') as EventBus
    void eventBus.emitEvent('partnerships.rfp_campaign.published', {
      campaignId: campaign.id,
      title: campaign.title,
      audience: campaign.audience,
      selectedAgencyIds: campaign.selectedAgencyIds,
      deadline: campaign.deadline.toISOString(),
      tenantId,
    }).catch(() => undefined)
  } catch {
    // Event emission is best-effort
  }

  return NextResponse.json({
    ok: true,
    campaign: {
      id: campaign.id,
      status: campaign.status,
    },
  })
}

// ---------------------------------------------------------------------------
// OpenAPI
// ---------------------------------------------------------------------------

const postDoc: OpenApiMethodDoc = {
  summary: 'Publish a draft RFP campaign (changes status from draft to open)',
  tags: ['Partnerships'],
  requestBody: { schema: publishSchema },
  responses: [
    { status: 200, description: 'Campaign published successfully' },
    { status: 404, description: 'Campaign not found' },
    { status: 422, description: 'Campaign is not in draft status' },
  ],
}

export const openApi: OpenApiRouteDoc = {
  tag: 'Partnerships',
  summary: 'Publish RFP campaign',
  methods: { POST: postDoc },
}

export default POST
