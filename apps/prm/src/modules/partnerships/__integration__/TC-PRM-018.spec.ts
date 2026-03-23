import { expect, test } from '@playwright/test'
import { getAuthToken, apiRequest } from '@open-mercato/core/helpers/integration/api'
import { readJsonSafe, getTokenContext } from '@open-mercato/core/helpers/integration/generalFixtures'

/**
 * TC-PRM-018: Tier Proposal Approve/Reject (US-5.3)
 *
 * Routes:
 *   GET  /api/partnerships/tier-proposals
 *     Auth: requireAuth + requireFeatures: ['partnerships.tier.approve'] (PM only)
 *   POST /api/partnerships/tier-proposals/action
 *     Auth: requireAuth + requireFeatures: ['partnerships.tier.approve'] (PM only)
 *     Body: { proposalId, action: 'approve'|'reject', reason? }
 *
 * Tests:
 * T1 — PM can list tier proposals (200)
 * T2 — PM can approve a PendingApproval proposal → creates TierAssignment
 * T3 — PM can reject a proposal with reason
 * T4 — Rejecting without reason returns 422
 * T5 — Approving already-resolved proposal returns 409
 * T6 — Non-PM user gets 403 on both endpoints
 *
 * Source: apps/prm/src/modules/partnerships/api/get/tier-proposals.ts
 *         apps/prm/src/modules/partnerships/api/post/tier-proposals-action.ts
 * Phase: 2, WF5 Tier Governance
 */

const PM_EMAIL = 'partnership-manager@demo.local'
const PM_PASSWORD = 'Demo123!'
const ADMIN_EMAIL = 'acme-admin@demo.local'
const ADMIN_PASSWORD = 'Demo123!'

type JsonRecord = Record<string, unknown>
type ProposalItem = {
  id: string
  organizationId: string
  organizationName: string
  currentTier: string
  proposedTier: string
  type: string
  status: string
}

test.describe('TC-PRM-018: Tier Proposal Approve/Reject', () => {
  let pmToken: string
  let adminToken: string

  test.beforeAll(async ({ request }) => {
    pmToken = await getAuthToken(request, PM_EMAIL, PM_PASSWORD)
    adminToken = await getAuthToken(request, ADMIN_EMAIL, ADMIN_PASSWORD)
  })

  test('T1: PM can list tier proposals', async ({ request }) => {
    const res = await apiRequest(request, 'GET', '/api/partnerships/tier-proposals', { token: pmToken })
    expect(res.ok(), `Expected 200, got ${res.status()}`).toBeTruthy()
    const body = await readJsonSafe<{ proposals: ProposalItem[] }>(res)
    expect(body).not.toBeNull()
    expect(Array.isArray(body!.proposals)).toBe(true)
  })

  test('T2: PM approves a PendingApproval proposal', async ({ request }) => {
    // List pending proposals
    const listRes = await apiRequest(request, 'GET', '/api/partnerships/tier-proposals?status=PendingApproval', { token: pmToken })
    const listBody = await readJsonSafe<{ proposals: ProposalItem[] }>(listRes)
    const pending = listBody?.proposals ?? []

    if (pending.length === 0) {
      console.warn('[TC-PRM-018 T2] No PendingApproval proposals in seed data — skipping')
      return
    }

    const proposal = pending[0]
    const res = await apiRequest(request, 'POST', '/api/partnerships/tier-proposals/action', {
      token: pmToken,
      data: { proposalId: proposal.id, action: 'approve', reason: 'Approved via e2e test' },
    })
    expect(res.ok(), `Expected 200, got ${res.status()}`).toBeTruthy()
    const body = await readJsonSafe<JsonRecord>(res)
    expect(body?.ok).toBe(true)
    expect((body?.proposal as JsonRecord)?.status).toBe('Approved')
    expect(body?.tierAssignment).toBeTruthy()
  })

  test('T3: PM rejects a proposal with reason', async ({ request }) => {
    const listRes = await apiRequest(request, 'GET', '/api/partnerships/tier-proposals?status=PendingApproval', { token: pmToken })
    const listBody = await readJsonSafe<{ proposals: ProposalItem[] }>(listRes)
    const pending = listBody?.proposals ?? []

    if (pending.length === 0) {
      console.warn('[TC-PRM-018 T3] No PendingApproval proposals — skipping')
      return
    }

    const proposal = pending[0]
    const res = await apiRequest(request, 'POST', '/api/partnerships/tier-proposals/action', {
      token: pmToken,
      data: { proposalId: proposal.id, action: 'reject', reason: 'KPIs not sustained — rejected via e2e' },
    })
    expect(res.ok(), `Expected 200, got ${res.status()}`).toBeTruthy()
    const body = await readJsonSafe<JsonRecord>(res)
    expect(body?.ok).toBe(true)
    expect((body?.proposal as JsonRecord)?.status).toBe('Rejected')
  })

  test('T4: Reject without reason returns 422', async ({ request }) => {
    const listRes = await apiRequest(request, 'GET', '/api/partnerships/tier-proposals?status=PendingApproval', { token: pmToken })
    const listBody = await readJsonSafe<{ proposals: ProposalItem[] }>(listRes)
    const pending = listBody?.proposals ?? []

    if (pending.length === 0) {
      console.warn('[TC-PRM-018 T4] No PendingApproval proposals — skipping')
      return
    }

    const proposal = pending[0]
    const res = await apiRequest(request, 'POST', '/api/partnerships/tier-proposals/action', {
      token: pmToken,
      data: { proposalId: proposal.id, action: 'reject' },
    })
    expect(res.status()).toBe(422)
  })

  test('T5: Approving already-resolved proposal returns 409', async ({ request }) => {
    // Find any resolved proposal
    const listRes = await apiRequest(request, 'GET', '/api/partnerships/tier-proposals', { token: pmToken })
    const listBody = await readJsonSafe<{ proposals: ProposalItem[] }>(listRes)
    const resolved = (listBody?.proposals ?? []).find((p) => p.status === 'Approved' || p.status === 'Rejected')

    if (!resolved) {
      console.warn('[TC-PRM-018 T5] No resolved proposals — skipping')
      return
    }

    const res = await apiRequest(request, 'POST', '/api/partnerships/tier-proposals/action', {
      token: pmToken,
      data: { proposalId: resolved.id, action: 'approve' },
    })
    expect(res.status()).toBe(409)
  })

  test('T6: Non-PM user gets 403', async ({ request }) => {
    const listRes = await apiRequest(request, 'GET', '/api/partnerships/tier-proposals', { token: adminToken })
    expect(listRes.status()).toBe(403)

    const actionRes = await apiRequest(request, 'POST', '/api/partnerships/tier-proposals/action', {
      token: adminToken,
      data: { proposalId: '00000000-0000-0000-0000-000000000000', action: 'approve' },
    })
    expect(actionRes.status()).toBe(403)
  })
})

export const integrationMeta = {
  description: 'Tier proposal approve/reject — PM can list, approve (creates TierAssignment), reject (requires reason), non-PM 403',
  dependsOnModules: ['partnerships', 'auth'],
}
