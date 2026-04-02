import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createRequestContainer } from '@open-mercato/shared/lib/di/container'
import { getAuthFromRequest } from '@open-mercato/shared/lib/auth/server'
import type { EntityManager } from '@mikro-orm/postgresql'
import type { OpenApiMethodDoc, OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'
import { TierChangeProposal, TierAssignment } from '../../data/entities'

export const metadata = {
  path: '/partnerships/tier-proposals/action',
  POST: { requireAuth: true, requireFeatures: ['partnerships.tier.manage'] },
}

const actionSchema = z.object({
  proposalId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
  validUntil: z.coerce.date().optional(),
}).refine(
  (data) => data.action !== 'approve' || (data.validUntil && data.validUntil > new Date()),
  { message: 'validUntil is required and must be in the future when approving', path: ['validUntil'] },
)

async function POST(req: Request) {
  const auth = await getAuthFromRequest(req)
  if (!auth?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { proposalId, action, reason } = parsed.data
  const container = await createRequestContainer()
  const em = container.resolve('em') as EntityManager
  const tenantId = auth.tenantId
  const userId = auth.sub

  const proposal = await em.findOne(TierChangeProposal, {
    id: proposalId,
    tenantId,
  })

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
  }

  if (proposal.status !== 'PendingApproval') {
    return NextResponse.json(
      { error: `Proposal is already ${proposal.status.toLowerCase()}` },
      { status: 409 },
    )
  }

  const now = new Date()

  if (action === 'approve') {
    proposal.status = 'Approved'
    proposal.resolvedAt = now

    // Create new TierAssignment
    const assignment = em.create(TierAssignment, {
      organizationId: proposal.organizationId,
      tier: proposal.proposedTier,
      validFrom: now,
      validUntil: parsed.data.validUntil!,
      approvedBy: userId,
      reason: reason || `${proposal.type} approved from ${proposal.currentTier} to ${proposal.proposedTier}`,
      tenantId,
    })
    em.persist(assignment)

    await em.flush()

    return NextResponse.json({
      ok: true,
      proposal: { id: proposal.id, status: 'Approved' },
      tierAssignment: { id: assignment.id, tier: assignment.tier },
    })
  }

  // Reject
  if (!reason) {
    return NextResponse.json(
      { error: 'Reason is required when rejecting a proposal' },
      { status: 422 },
    )
  }

  proposal.status = 'Rejected'
  proposal.rejectionReason = reason
  proposal.resolvedAt = now

  await em.flush()

  return NextResponse.json({
    ok: true,
    proposal: { id: proposal.id, status: 'Rejected' },
  })
}

// ---------------------------------------------------------------------------
// OpenAPI
// ---------------------------------------------------------------------------

const postDoc: OpenApiMethodDoc = {
  summary: 'Approve or reject a tier change proposal (PM only)',
  tags: ['Partnerships'],
  requestBody: { schema: actionSchema },
  responses: [
    { status: 200, description: 'Action completed' },
    { status: 404, description: 'Proposal not found' },
    { status: 409, description: 'Proposal already resolved' },
    { status: 422, description: 'Validation error' },
  ],
}

export const openApi: OpenApiRouteDoc = {
  tag: 'Partnerships',
  summary: 'Tier proposal action',
  methods: { POST: postDoc },
}

export default POST
