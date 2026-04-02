import type { Page } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5001'

/**
 * Set auth token + dismiss global notice bars (demo banner, cookie consent)
 * so that fixed-position overlays don't intercept button clicks during tests.
 */
export async function loginInBrowser(page: Page, token: string): Promise<void> {
  await page.context().addCookies([
    { name: 'auth_token', value: token, url: BASE },
    { name: 'om_demo_notice_ack', value: 'ack', url: BASE, sameSite: 'Lax' },
    { name: 'om_cookie_notice_ack', value: 'ack', url: BASE, sameSite: 'Lax' },
  ])
}
