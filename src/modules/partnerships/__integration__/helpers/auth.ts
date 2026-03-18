import { type Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

export type Role = 'superadmin' | 'admin' | 'employee'

export const DEFAULT_CREDENTIALS: Record<Role, { email: string; password: string }> = {
  superadmin: {
    email: process.env.OM_INIT_SUPERADMIN_EMAIL || 'superadmin@acme.com',
    password: process.env.OM_INIT_SUPERADMIN_PASSWORD || 'secret',
  },
  admin: { email: 'admin@acme.com', password: 'secret' },
  employee: { email: 'employee@acme.com', password: 'secret' },
}

function decodeJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

async function acknowledgeGlobalNotices(page: Page): Promise<void> {
  await page.context().addCookies([
    { name: 'om_demo_notice_ack', value: 'ack', url: BASE_URL, sameSite: 'Lax' },
    { name: 'om_cookie_notice_ack', value: 'ack', url: BASE_URL, sameSite: 'Lax' },
  ])
}

async function dismissGlobalNoticesIfPresent(page: Page): Promise<void> {
  const cookieBtn = page.getByRole('button', { name: /accept cookies/i }).first()
  if (await cookieBtn.isVisible().catch(() => false)) await cookieBtn.click()

  const demoNotice = page.getByText(/this instance is provided for demo purposes only/i).first()
  if (await demoNotice.isVisible().catch(() => false)) {
    const container = demoNotice
      .locator('xpath=ancestor::div[contains(@class,"pointer-events-auto")]')
      .first()
    const dismiss = container.locator('button').first()
    if (await dismiss.isVisible().catch(() => false)) await dismiss.click()
  }
}

async function recoverErrorPageIfPresent(page: Page): Promise<void> {
  // Client-side error
  const clientErr = page
    .getByRole('heading', { name: /Application error: a client-side exception has occurred/i })
    .first()
  if (await clientErr.isVisible().catch(() => false)) {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await dismissGlobalNoticesIfPresent(page)
    return
  }
  // Generic error
  const genericErr = page.getByRole('heading', { name: /^Something went wrong$/i }).first()
  if (await genericErr.isVisible().catch(() => false)) {
    const retry = page.getByRole('button', { name: /Try again/i }).first()
    if (await retry.isVisible().catch(() => false)) {
      await retry.click().catch(() => {})
      await page.waitForLoadState('domcontentloaded').catch(() => {})
    } else {
      await page.reload({ waitUntil: 'domcontentloaded' })
    }
    await dismissGlobalNoticesIfPresent(page)
  }
}

export async function login(page: Page, role: Role = 'admin'): Promise<void> {
  const creds = DEFAULT_CREDENTIALS[role]
  const waitForBackend = async (timeout: number): Promise<boolean> => {
    try {
      await page.waitForURL(/\/backend(?:\/.*)?$/, { timeout })
      return true
    } catch {
      return /\/backend(?:\/.*)?$/.test(page.url())
    }
  }

  await acknowledgeGlobalNotices(page)

  // --- Fast path: API login + cookie injection (bypasses UI 500) ---
  const form = new URLSearchParams()
  form.set('email', creds.email)
  form.set('password', creds.password)

  const apiRes = await page.request
    .post('/api/auth/login', {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      data: form.toString(),
    })
    .catch(() => null)

  if (apiRes?.ok()) {
    const body = await apiRes.json().catch(() => null)
    const claims = typeof body?.token === 'string' ? decodeJwtClaims(body.token) : null

    const cookies: Array<{ name: string; value: string; url: string; sameSite: 'Lax' }> = []
    if (claims?.tenantId) {
      cookies.push({ name: 'om_selected_tenant', value: claims.tenantId as string, url: BASE_URL, sameSite: 'Lax' })
    }
    if (claims?.orgId) {
      cookies.push({ name: 'om_selected_org', value: claims.orgId as string, url: BASE_URL, sameSite: 'Lax' })
    }
    if (cookies.length > 0) await page.context().addCookies(cookies)

    await page.goto('/backend', { waitUntil: 'domcontentloaded' })
    if (await waitForBackend(8_000)) return
  }

  // --- Fallback: UI form login with retry ---
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await dismissGlobalNoticesIfPresent(page)
    await recoverErrorPageIfPresent(page)

    await page
      .waitForSelector('form[data-auth-ready="1"]', { state: 'visible', timeout: 3_000 })
      .catch(() => null)

    if (await page.getByLabel('Email').isVisible().catch(() => false)) break
    if (attempt === 3) {
      throw new Error(`Login form unavailable for role: ${role}; URL: ${page.url()}`)
    }
  }

  await page.getByLabel('Email').fill(creds.email)
  const passwordInput = page.getByLabel('Password').first()

  if (await passwordInput.isVisible().catch(() => false)) {
    await passwordInput.fill(creds.password)
    await passwordInput.press('Enter')
  } else {
    await page.getByRole('button', { name: /login|sign in|continue with sso/i }).first().click()
  }

  if (await waitForBackend(7_000)) return

  // Last resort: force submit
  const formEl = page.locator('form').first()
  if (await formEl.isVisible().catch(() => false)) {
    await formEl.evaluate((el) => (el as HTMLFormElement).requestSubmit()).catch(() => {})
  }
  if (await waitForBackend(5_000)) return

  const loginBtn = page.getByRole('button', { name: /login|sign in|continue with sso/i }).first()
  if (await loginBtn.isVisible().catch(() => false)) await loginBtn.click({ force: true })
  if (await waitForBackend(8_000)) return

  throw new Error(`Login did not reach backend for role: ${role}; URL: ${page.url()}`)
}
