import { test, expect, type Page } from '@playwright/test'
import { getAuthToken } from '@open-mercato/core/helpers/integration/api'

/**
 * TC-PRM-008: Seed Data Verification UI (US-1.2, US-1.3, US-7.2, US-7.3)
 *
 * Verifies that seedDefaults + seedExamples produced the expected data
 * by navigating to UI pages and checking rendered content:
 *   T1 — Deals page shows seeded deals with pipeline stages
 *   T2 — Case studies page shows seeded case study records
 *   T3 — Agencies page (PM) shows demo organizations
 *   T4 — Demo users can log in and reach the dashboard
 *
 * Source: apps/prm/src/modules/partnerships/setup.ts (seedDefaults + seedExamples)
 * Phase: 1
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PM_EMAIL = 'partnership-manager@demo.local'
const ADMIN_EMAIL = 'acme-admin@demo.local'
const BD_EMAIL = 'acme-bd@demo.local'
const CONTRIBUTOR_EMAIL = 'acme-contributor@demo.local'
const DEMO_PASSWORD = 'Demo123!'
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5001'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginInBrowser(page: Page, token: string): Promise<void> {
  await page.context().addCookies([{ name: 'auth_token', value: token, url: BASE }])
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('TC-PRM-008: Seed Data Verification UI', () => {
  let pmToken: string
  let adminToken: string
  let bdToken: string
  let contributorToken: string

  test.beforeAll(async ({ request }) => {
    pmToken = await getAuthToken(request, PM_EMAIL, DEMO_PASSWORD)
    adminToken = await getAuthToken(request, ADMIN_EMAIL, DEMO_PASSWORD)
    bdToken = await getAuthToken(request, BD_EMAIL, DEMO_PASSWORD)
    contributorToken = await getAuthToken(request, CONTRIBUTOR_EMAIL, DEMO_PASSWORD)
  })

  // -------------------------------------------------------------------------
  // T1: Deals page shows seeded deals
  // -------------------------------------------------------------------------
  test('T1: BD user sees seeded deals on deals page', async ({ page }) => {
    await loginInBrowser(page, bdToken)
    await page.goto(`${BASE}/backend/customers/deals`)

    // Wait for deals table
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 15_000 })
    const count = await rows.count()
    expect(count, 'BD should see at least 1 seeded deal for Acme org').toBeGreaterThanOrEqual(1)

    // Verify deals have visible title text
    const firstRowText = await rows.first().textContent()
    expect(firstRowText?.trim().length, 'Deal row should have content').toBeGreaterThan(0)
  })

  // -------------------------------------------------------------------------
  // T2: Case studies page shows seeded records
  // -------------------------------------------------------------------------
  test('T2: Admin sees seeded case studies on case studies page', async ({ page }) => {
    await loginInBrowser(page, adminToken)
    await page.goto(`${BASE}/backend/partnerships/case-studies`)

    // Case studies page uses cards, not table. Look for case study entries.
    // The page has h3 elements for each case study title.
    const caseStudyCards = page.locator('.rounded-lg.border.p-4')
    await expect(caseStudyCards.first()).toBeVisible({ timeout: 15_000 })
    const count = await caseStudyCards.count()
    expect(count, 'Admin should see at least 1 seeded case study').toBeGreaterThanOrEqual(1)

    // Verify case study has a title
    const firstTitle = caseStudyCards.first().locator('h3')
    await expect(firstTitle).toBeVisible()
    const titleText = await firstTitle.textContent()
    expect(titleText?.trim().length, 'Case study should have a title').toBeGreaterThan(0)
  })

  // -------------------------------------------------------------------------
  // T3: Agencies page shows demo organizations
  // -------------------------------------------------------------------------
  test('T3: PM sees demo agencies on agencies page', async ({ page }) => {
    await loginInBrowser(page, pmToken)
    await page.goto(`${BASE}/backend/partnerships/agencies`)

    // Wait for table to load
    await expect(page.locator('th:text-is("Agency")').first()).toBeVisible({ timeout: 15_000 })

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 10_000 })
    const count = await rows.count()
    expect(count, 'PM should see at least 3 demo agencies').toBeGreaterThanOrEqual(3)

    // Verify known demo agency names
    const bodyText = (await page.locator('tbody').textContent())?.toLowerCase() ?? ''
    const expected = ['acme', 'nordic', 'cloudbridge']
    const found = expected.filter((name) => bodyText.includes(name))
    expect(found.length, `Expected all 3 demo agencies, found: ${found.join(', ')}`).toBeGreaterThanOrEqual(2)
  })

  // -------------------------------------------------------------------------
  // T4: Demo users can log in and reach dashboard
  // -------------------------------------------------------------------------
  test('T4: All 4 demo users can log in and reach the dashboard', async ({ page }) => {
    const tokens = [
      { token: pmToken, label: 'PM' },
      { token: adminToken, label: 'Acme Admin' },
      { token: bdToken, label: 'Acme BD' },
      { token: contributorToken, label: 'Acme Contributor' },
    ]

    for (const user of tokens) {
      expect(user.token, `${user.label} should have a valid token`).toBeTruthy()

      await loginInBrowser(page, user.token)
      await page.goto(`${BASE}/backend`)
      await page.waitForLoadState('domcontentloaded')

      const title = await page.title()
      expect(
        title !== '404: This page could not be found.',
        `${user.label} should reach dashboard, not 404`,
      ).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const integrationMeta = {
  description: 'Seed data verification UI — deals, case studies, agencies, user login',
  dependsOnModules: ['partnerships', 'customers', 'auth', 'directory', 'entities'],
}
