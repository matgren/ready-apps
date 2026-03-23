import { expect, test } from '@playwright/test'
import { getAuthToken, apiRequest } from '@open-mercato/core/helpers/integration/api'
import { readJsonSafe, getTokenContext } from '@open-mercato/core/helpers/integration/generalFixtures'

/**
 * TC-PRM-009: WIC Import API
 *
 * Route: POST /api/partnerships/wic/import
 * Auth:  requireAuth + requireFeatures: ['partnerships.wic.import'] (PM only)
 * Body:  WicImportRequest { organizationId, month, source, records }
 *
 * Tests:
 * T1 — Valid WIC import succeeds
 * T2 — Within-batch dedup rejects (422, duplicate_in_batch)
 * T3 — Unmatched GH username rejects (422, unmatchedUsernames)
 * T4 — Re-import archives previous records
 * T5 — WIC score computation is correct (L2 + impactBonus + bounty = 2.25)
 *
 * Source: apps/prm/src/modules/partnerships/api/post/wic-import.ts
 * Phase: 2, WF3 WIC
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PM_EMAIL = 'partnership-manager@demo.local'
const PM_PASSWORD = 'Demo123!'
const ADMIN_EMAIL = 'acme-admin@demo.local'
const ADMIN_PASSWORD = 'Demo123!'

type JsonRecord = Record<string, unknown>

type WicImportResponse = {
  imported: number
  archived: number
  assessmentId: string
}

type WicScoresResponse = {
  records: Array<{
    recordId: string
    contributorGithubUsername: string
    prId: string
    month: string
    featureKey: string
    level: string
    impactBonus: boolean
    bountyApplied: boolean
    wicScore: number
    assessmentSource: string
  }>
  month: string
  totalWicScore: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a unique far-future month per test suite run to avoid collisions
 * when the same ephemeral DB is reused across multiple test invocations.
 */
const _suiteRunId = Date.now()
function testMonth(): string {
  // Map timestamp to a unique YYYY-MM in the 2100–2199 range
  const offset = _suiteRunId % 1200 // 100 years × 12 months
  const year = 2100 + Math.floor(offset / 12)
  const month = (offset % 12) + 1
  return `${year}-${String(month).padStart(2, '0')}`
}

/** Get the Acme org's organizationId from an Acme user's token. */
function getAcmeOrgId(token: string): string {
  const { organizationId } = getTokenContext(token)
  expect(organizationId, 'Acme admin token should include an organizationId').toBeTruthy()
  return organizationId
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('TC-PRM-009: WIC Import API', () => {
  // Use the seeded GH username from seedExamples (stored in custom_field_values)
  const GH_USERNAME = 'carol-acme'
  let pmToken: string
  let adminToken: string
  let acmeOrgId: string

  test.beforeAll(async ({ request }) => {
    pmToken = await getAuthToken(request, PM_EMAIL, PM_PASSWORD)
    adminToken = await getAuthToken(request, ADMIN_EMAIL, ADMIN_PASSWORD)
    acmeOrgId = getAcmeOrgId(adminToken)
  })

  // -------------------------------------------------------------------------
  // T1: Valid WIC import succeeds
  // -------------------------------------------------------------------------
  test('T1: Valid WIC import succeeds', async ({ request }) => {
    const month = testMonth()
    const res = await apiRequest(request, 'POST', '/api/partnerships/wic/import', {
      token: pmToken,
      data: {
        organizationId: acmeOrgId,
        month,
        source: 'manual_import',
        records: [
          {
            contributorGithubUsername: GH_USERNAME,
            prId: 'PR-T1-001',
            month,
            featureKey: 'feat.auth.login',
            level: 'L2',
            impactBonus: false,
            bountyApplied: false,
          },
        ],
      },
    })

    expect(res.status(), `POST /api/partnerships/wic/import should return 200, got ${res.status()}`).toBe(200)

    const body = await readJsonSafe<WicImportResponse>(res)
    expect(body, 'response body must not be null').not.toBeNull()
    expect(body!.imported, 'imported must be > 0').toBeGreaterThan(0)
    expect(body!.archived, 'archived should be 0 on first import').toBe(0)
    expect(typeof body!.assessmentId, 'assessmentId must be a string').toBe('string')
    expect(body!.assessmentId.length, 'assessmentId must not be empty').toBeGreaterThan(0)
  })

  // -------------------------------------------------------------------------
  // T2: Within-batch dedup rejects
  // -------------------------------------------------------------------------
  test('T2: Within-batch duplicate rejects with 422', async ({ request }) => {
    const month = '2099-02'
    const duplicateRecord = {
      contributorGithubUsername: GH_USERNAME,
      prId: 'PR-T2-001',
      month,
      featureKey: 'feat.dup.check',
      level: 'L3',
      impactBonus: false,
      bountyApplied: false,
    }

    const res = await apiRequest(request, 'POST', '/api/partnerships/wic/import', {
      token: pmToken,
      data: {
        organizationId: acmeOrgId,
        month,
        source: 'manual_import',
        records: [
          duplicateRecord,
          // Exact same (contributor, month, featureKey) — duplicate
          { ...duplicateRecord, prId: 'PR-T2-002' },
        ],
      },
    })

    expect(res.status(), 'Duplicate in batch should return 422').toBe(422)
    const body = await readJsonSafe<JsonRecord>(res)
    expect(body, 'response body must not be null').not.toBeNull()
    expect(typeof body!.error, 'error field must be a string').toBe('string')
    expect(
      (body!.error as string).toLowerCase(),
      'error should mention "duplicate"',
    ).toContain('duplicate')
  })

  // -------------------------------------------------------------------------
  // T3: Unmatched GH username rejects
  // -------------------------------------------------------------------------
  test('T3: Unmatched GH username rejects with 422', async ({ request }) => {
    const month = '2099-03'
    const bogusUsername = `nonexistent-user-${Date.now()}`

    const res = await apiRequest(request, 'POST', '/api/partnerships/wic/import', {
      token: pmToken,
      data: {
        organizationId: acmeOrgId,
        month,
        source: 'manual_import',
        records: [
          {
            contributorGithubUsername: bogusUsername,
            prId: 'PR-T3-001',
            month,
            featureKey: 'feat.nonexistent.user',
            level: 'L1',
            impactBonus: false,
            bountyApplied: false,
          },
        ],
      },
    })

    expect(res.status(), 'Unmatched username should return 422').toBe(422)
    const body = await readJsonSafe<JsonRecord>(res)
    expect(body, 'response body must not be null').not.toBeNull()

    const unmatched = body!.unmatchedUsernames as string[] | undefined
    expect(Array.isArray(unmatched), 'unmatchedUsernames must be an array').toBe(true)
    expect(unmatched, 'unmatchedUsernames must contain the bogus username').toContain(bogusUsername)
  })

  // -------------------------------------------------------------------------
  // T4: Re-import archives previous records
  // -------------------------------------------------------------------------
  test('T4: Re-import archives previous records', async ({ request }) => {
    const month = '2099-04'
    const importBody = {
      organizationId: acmeOrgId,
      month,
      source: 'manual_import' as const,
      records: [
        {
          contributorGithubUsername: GH_USERNAME,
          prId: 'PR-T4-001',
          month,
          featureKey: 'feat.archive.test',
          level: 'L4' as const,
          impactBonus: false,
          bountyApplied: false,
        },
      ],
    }

    // First import
    const res1 = await apiRequest(request, 'POST', '/api/partnerships/wic/import', {
      token: pmToken,
      data: importBody,
    })
    expect(res1.status(), 'First import should return 200').toBe(200)
    const body1 = await readJsonSafe<WicImportResponse>(res1)
    expect(body1!.imported).toBe(1)
    expect(body1!.archived, 'First import should have 0 archived').toBe(0)

    // Second import for same org+month — should archive the first batch
    const res2 = await apiRequest(request, 'POST', '/api/partnerships/wic/import', {
      token: pmToken,
      data: {
        ...importBody,
        records: [
          {
            contributorGithubUsername: GH_USERNAME,
            prId: 'PR-T4-002',
            month,
            featureKey: 'feat.archive.test.v2',
            level: 'L2' as const,
            impactBonus: true,
            bountyApplied: false,
          },
        ],
      },
    })
    expect(res2.status(), 'Second import should return 200').toBe(200)
    const body2 = await readJsonSafe<WicImportResponse>(res2)
    expect(body2!.imported).toBe(1)
    expect(body2!.archived, 'Second import must archive previous records').toBeGreaterThan(0)
  })

  // -------------------------------------------------------------------------
  // T5: WIC score computation is correct
  // -------------------------------------------------------------------------
  test('T5: WIC score computation — L2 + impactBonus + bounty = 2.25', async ({ request }) => {
    const month = '2099-05'

    // Import a record with known values: L2 (base=1.0), impactBonus=true (+0.5), bountyApplied=true (*1.5)
    // Expected: (1.0 + 0.5) * 1.5 = 2.25
    const res = await apiRequest(request, 'POST', '/api/partnerships/wic/import', {
      token: pmToken,
      data: {
        organizationId: acmeOrgId,
        month,
        source: 'manual_import',
        records: [
          {
            contributorGithubUsername: GH_USERNAME,
            prId: 'PR-T5-001',
            month,
            featureKey: 'feat.score.check',
            level: 'L2',
            impactBonus: true,
            bountyApplied: true,
          },
        ],
      },
    })
    expect(res.status(), 'Import should return 200').toBe(200)

    // Fetch via GET /api/partnerships/wic-scores to verify the computed score
    const scoresRes = await apiRequest(
      request,
      'GET',
      `/api/partnerships/wic-scores?month=${month}&organizationId=${encodeURIComponent(acmeOrgId)}`,
      { token: pmToken },
    )
    expect(scoresRes.ok(), `GET /api/partnerships/wic-scores failed: ${scoresRes.status()}`).toBeTruthy()
    const scoresBody = await readJsonSafe<WicScoresResponse>(scoresRes)
    expect(scoresBody, 'response body must not be null').not.toBeNull()
    expect(scoresBody!.records.length, 'Should have at least 1 record').toBeGreaterThanOrEqual(1)

    // Find the record we just imported
    const record = scoresBody!.records.find((r) => r.prId === 'PR-T5-001')
    expect(record, 'Record PR-T5-001 must appear in wic-scores').toBeDefined()
    expect(record!.wicScore, 'WIC score must be 2.25 for L2 + impactBonus + bounty').toBe(2.25)
    expect(record!.level).toBe('L2')
    expect(record!.impactBonus).toBe(true)
    expect(record!.bountyApplied).toBe(true)
    expect(scoresBody!.totalWicScore, 'totalWicScore must be >= 2.25').toBeGreaterThanOrEqual(2.25)
  })
})

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const integrationMeta = {
  description: 'WIC Import API — validation, dedup, archive, score computation (POST /api/partnerships/wic/import)',
  dependsOnModules: ['partnerships', 'entities', 'auth'],
}
