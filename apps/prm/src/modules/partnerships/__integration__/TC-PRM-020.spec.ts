import { test, expect, type Page } from '@playwright/test'
import { getAuthToken, apiRequest } from '@open-mercato/core/helpers/integration/api'
import { readJsonSafe, getTokenContext } from '@open-mercato/core/helpers/integration/generalFixtures'

/**
 * TC-PRM-020: License Deals UI
 *
 * Pages:
 *   /backend/partnerships/license-deals          (list)
 *   /backend/partnerships/license-deals/create    (create form)
 *
 * Auth: GET requireFeatures: ['partnerships.license-deals.view'], writes requireFeatures: ['partnerships.license-deals.manage'] (PM only)
 *
 * Tests:
 * T1 — PM sees license deals list with demo data
 * T2 — PM can create a license deal via form
 * T3 — Contributor cannot access license deals page
 *
 * Phase: 2
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PM_EMAIL = 'partnership-manager@demo.local'
const PM_PASSWORD = 'Demo123!'
const CONTRIBUTOR_EMAIL = 'acme-contributor@demo.local'
const CONTRIBUTOR_PASSWORD = 'Demo123!'
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5001'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginInBrowser(page: Page, token: string): Promise<void> {
  await page.context().addCookies([
    { name: 'auth_token', value: token, url: BASE },
  ])
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('TC-PRM-020: License Deals UI', () => {
  let pmToken: string
  let contributorToken: string
  let acmeOrgId: string

  test.beforeAll(async ({ request }) => {
    pmToken = await getAuthToken(request, PM_EMAIL, PM_PASSWORD)
    contributorToken = await getAuthToken(request, CONTRIBUTOR_EMAIL, CONTRIBUTOR_PASSWORD)
    acmeOrgId = getTokenContext(
      await getAuthToken(request, 'acme-admin@demo.local', 'Demo123!'),
    ).organizationId
  })

  // -------------------------------------------------------------------------
  // T1: PM sees license deals list with demo data
  // -------------------------------------------------------------------------

  test('T1: PM sees license deals list with demo data', async ({ page }) => {
    await loginInBrowser(page, pmToken)
    await page.goto(`${BASE}/backend/partnerships/license-deals`)

    // Page title
    await expect(page.locator('text="License Deals"').first()).toBeVisible({ timeout: 15_000 })

    // Table headers
    await expect(page.locator('th:text-is("License ID")')).toBeVisible()
    await expect(page.locator('th:text-is("Year")')).toBeVisible()
    await expect(page.locator('th:text-is("Status")')).toBeVisible()

    // Demo data should have seeded license deals — at least one row
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 10_000 })
    const count = await rows.count()
    expect(count, 'Demo data should contain at least 1 license deal').toBeGreaterThanOrEqual(1)

    // "Add License Deal" button visible (scoped to main to avoid sidebar duplicate)
    await expect(page.getByRole('main').getByRole('link', { name: 'Add License Deal' })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // T2: PM can create a license deal via form
  // -------------------------------------------------------------------------

  test('T2: PM can create a license deal via search → select → form', async ({ page, request }) => {
    await loginInBrowser(page, pmToken)
    await page.goto(`${BASE}/backend/partnerships/license-deals/create`)

    const ts = Date.now()
    const licenseId = `QA-UI-${ts}`

    // Step 1: Search for a company
    const searchInput = page.locator('input[type="text"]').first()
    await expect(searchInput).toBeVisible({ timeout: 15_000 })
    await searchInput.fill('Demo')

    // Wait for search results to appear
    const resultButton = page.locator('button.w-full.text-left').first()
    await expect(resultButton).toBeVisible({ timeout: 10_000 })

    // Click first result to select company
    const companyName = await resultButton.locator('p.font-medium').textContent()
    expect(companyName?.trim().length, 'Company name should not be empty').toBeGreaterThan(0)
    await resultButton.click()

    // Step 2: Fill attribution form (should now be visible)
    await expect(page.locator('#licenseIdentifier')).toBeVisible({ timeout: 5_000 })

    // Verify selected company is shown
    await expect(page.locator(`text="${companyName!.trim()}"`)).toBeVisible()

    await page.locator('#licenseIdentifier').fill(licenseId)
    await page.locator('#industryTag').fill('fintech')
    await page.locator('#closedAt').fill('2098-06-15')
    // Type and Status have defaults (enterprise, won) — no action needed

    // Submit
    await page.locator('button[type="submit"]').click()

    // Should redirect to list page
    const errorEl = page.locator('[class*="destructive"]')
    await expect(async () => {
      const url = page.url()
      const leftCreate = url.includes('/license-deals') && !url.includes('/create')
      const hasError = await errorEl.isVisible().catch(() => false)
      if (hasError) {
        const msg = await errorEl.textContent()
        throw new Error(`Form error: ${msg}`)
      }
      expect(leftCreate, `Expected redirect, still at: ${url}`).toBe(true)
    }).toPass({ timeout: 15_000 })

    // Clean up via API
    const listRes = await apiRequest(request, 'GET', '/api/partnerships/partner-license-deals', { token: pmToken })
    const list = await readJsonSafe<{ items: Array<{ id: string; license_identifier?: string; licenseIdentifier?: string }> }>(listRes)
    const created = list?.items?.find((i) => (i.license_identifier ?? i.licenseIdentifier) === licenseId)
    if (created) {
      await apiRequest(request, 'DELETE', `/api/partnerships/partner-license-deals?id=${created.id}`, { token: pmToken })
    }
  })

  // -------------------------------------------------------------------------
  // T3: Contributor cannot access license deals page
  // -------------------------------------------------------------------------

  test('T3: Contributor cannot access license deals page', async ({ page }) => {
    await loginInBrowser(page, contributorToken)
    await page.goto(`${BASE}/backend/partnerships/license-deals`)

    // Contributor lacks partnerships.license-deals.manage — page should not render the table.
    // The platform either redirects to dashboard, shows forbidden, or shows empty.
    // We verify the table with license deal data is NOT visible.
    const tableHeaders = page.locator('th:text-is("License ID")')

    // Wait a moment for the page to settle
    await page.waitForTimeout(3_000)

    // Table should not be visible (403 handled by platform — redirect or blank)
    const visible = await tableHeaders.isVisible().catch(() => false)
    expect(visible, 'Contributor should not see license deals table').toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const integrationMeta = {
  description: 'License Deals UI — list rendering, create form, contributor RBAC block',
  dependsOnModules: ['partnerships', 'customers', 'auth'],
}
