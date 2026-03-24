import { expect, test } from '@playwright/test'
import { getAuthToken, apiRequest } from '@open-mercato/core/helpers/integration/api'
import { readJsonSafe } from '@open-mercato/core/helpers/integration/generalFixtures'

/**
 * TC-PRM-006: Cross-org Agencies API (US-2.3 PM view)
 *
 * Tests GET /api/partnerships/agencies — the PM's cross-org view listing all
 * partner agencies with their KPI metrics (WIP, WIC, MIN).
 *
 * API: GET /api/partnerships/agencies?month=YYYY-MM
 *   - Requires: partnerships.manage feature (PM only)
 *   - Returns: { agencies: [{ organizationId, name, adminEmail, wipCount, wicScore, minCount, createdAt }], month, year }
 *
 * Demo users:
 *   - PM: partnership-manager@demo.local / Demo123!  (has partnerships.manage)
 *   - BD: acme-bd@demo.local / Demo123!              (does NOT have partnerships.manage)
 *
 * Source: apps/prm/src/modules/partnerships/api/get/agencies.ts
 * Phase: 2
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PM_EMAIL = 'partnership-manager@demo.local'
const BD_EMAIL = 'acme-bd@demo.local'
const DEMO_PASSWORD = 'Demo123!'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AgencyListItem = {
  organizationId: string
  name: string
  adminEmail: string | null
  wipCount: number
  wicScore: number
  minCount: number
  createdAt: string
}

type AgenciesResponse = {
  agencies: AgencyListItem[]
  month: string
  year: number
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('TC-PRM-006: Cross-org Agencies API (US-2.3 PM view)', () => {
  // -------------------------------------------------------------------------
  // T1: PM gets list of agencies with KPI metrics
  // -------------------------------------------------------------------------
  test('T1: PM gets list of agencies with WIP, WIC, MIN metrics', async ({ request }) => {
    const pmToken = await getAuthToken(request, PM_EMAIL, DEMO_PASSWORD)
    const res = await apiRequest(request, 'GET', '/api/partnerships/agencies', { token: pmToken })
    expect(res.ok(), `GET /api/partnerships/agencies (PM) failed: ${res.status()}`).toBeTruthy()

    const body = await readJsonSafe<AgenciesResponse>(res)
    expect(body, 'Response body must not be null').not.toBeNull()
    expect(Array.isArray(body!.agencies), 'agencies must be an array').toBe(true)
    expect(typeof body!.month, 'month must be a string').toBe('string')
    expect(body!.month).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/)
    expect(typeof body!.year, 'year must be a number').toBe('number')

    // Demo data seeds at least 1 agency
    expect(
      body!.agencies.length,
      `Expected at least 1 agency, got ${body!.agencies.length}`,
    ).toBeGreaterThanOrEqual(1)

    // Verify each agency has the required fields with correct types
    for (const agency of body!.agencies) {
      expect(typeof agency.organizationId, 'organizationId must be a string').toBe('string')
      expect(agency.organizationId.length, 'organizationId must not be empty').toBeGreaterThan(0)

      expect(typeof agency.name, 'name must be a string').toBe('string')
      expect(agency.name.length, 'name must not be empty').toBeGreaterThan(0)

      expect(
        agency.adminEmail === null || typeof agency.adminEmail === 'string',
        'adminEmail must be a string or null',
      ).toBe(true)

      expect(typeof agency.wipCount, 'wipCount must be a number').toBe('number')
      expect(agency.wipCount, 'wipCount must be non-negative').toBeGreaterThanOrEqual(0)

      expect(typeof agency.wicScore, 'wicScore must be a number').toBe('number')
      expect(agency.wicScore, 'wicScore must be non-negative').toBeGreaterThanOrEqual(0)

      expect(typeof agency.minCount, 'minCount must be a number').toBe('number')
      expect(agency.minCount, 'minCount must be non-negative').toBeGreaterThanOrEqual(0)

      expect(typeof agency.createdAt, 'createdAt must be a string').toBe('string')
      const parsed = new Date(agency.createdAt)
      expect(
        Number.isNaN(parsed.getTime()),
        `createdAt "${agency.createdAt}" must be a valid date`,
      ).toBe(false)
    }

    // No duplicate org IDs
    const orgIds = body!.agencies.map((a) => a.organizationId)
    const uniqueIds = new Set(orgIds)
    expect(orgIds.length, 'No duplicate organizationIds in agency list').toBe(uniqueIds.size)
  })

  // -------------------------------------------------------------------------
  // T2: Non-PM user gets 403
  // -------------------------------------------------------------------------
  test('T2: BD user without partnerships.manage gets 403', async ({ request }) => {
    const bdToken = await getAuthToken(request, BD_EMAIL, DEMO_PASSWORD)
    const res = await apiRequest(request, 'GET', '/api/partnerships/agencies', { token: bdToken })

    expect(
      res.status(),
      `Expected 403 for BD user, got ${res.status()}`,
    ).toBe(403)
  })

  // -------------------------------------------------------------------------
  // T3: Agency list excludes PM's home org
  // -------------------------------------------------------------------------
  test('T3: Agency list excludes PM home org', async ({ request }) => {
    const pmToken = await getAuthToken(request, PM_EMAIL, DEMO_PASSWORD)
    const res = await apiRequest(request, 'GET', '/api/partnerships/agencies', { token: pmToken })
    expect(res.ok(), `GET /api/partnerships/agencies (PM) failed: ${res.status()}`).toBeTruthy()

    const body = await readJsonSafe<AgenciesResponse>(res)
    expect(body, 'Response body must not be null').not.toBeNull()
    expect(body!.agencies.length, 'agencies must not be empty').toBeGreaterThanOrEqual(1)

    const agencyNames = body!.agencies.map((a) => a.name.toLowerCase())
    for (const name of agencyNames) {
      expect(
        name.includes('open mercato'),
        `PM home org should not appear in agencies list, but found "${name}"`,
      ).toBe(false)
    }

    const knownAgencyFragments = ['acme', 'nordic', 'cloudbridge']
    const hasKnownAgency = agencyNames.some((name) =>
      knownAgencyFragments.some((fragment) => name.includes(fragment))
    )
    expect(
      hasKnownAgency,
      `Expected at least one known demo agency in the list, got: ${agencyNames.join(', ')}`,
    ).toBe(true)
  })

  // -------------------------------------------------------------------------
  // T4: Month parameter filters data correctly
  // -------------------------------------------------------------------------
  test('T4: Month parameter is accepted and reflected in response', async ({ request }) => {
    const pmToken = await getAuthToken(request, PM_EMAIL, DEMO_PASSWORD)
    const res = await apiRequest(request, 'GET', '/api/partnerships/agencies?month=2026-01', { token: pmToken })
    expect(res.ok(), `GET /api/partnerships/agencies?month=2026-01 failed: ${res.status()}`).toBeTruthy()

    const body = await readJsonSafe<AgenciesResponse>(res)
    expect(body, 'Response body must not be null').not.toBeNull()
    expect(body!.month).toBe('2026-01')
    expect(body!.year).toBe(2026)
  })

  // -------------------------------------------------------------------------
  // T5: Invalid month parameter returns 400
  // -------------------------------------------------------------------------
  test('T5: Invalid month parameter returns 400', async ({ request }) => {
    const pmToken = await getAuthToken(request, PM_EMAIL, DEMO_PASSWORD)
    const res = await apiRequest(request, 'GET', '/api/partnerships/agencies?month=bad', { token: pmToken })
    expect(res.status(), `Expected 400 for invalid month, got ${res.status()}`).toBe(400)
  })
})
