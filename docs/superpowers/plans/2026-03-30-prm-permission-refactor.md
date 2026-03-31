# PRM Permission Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor PRM permissions to add missing `view` features, rename `tier.approve` → `tier.manage`, and fix unguarded RFP/WIC routes — aligning with OM RBAC `view`/`manage` conventions.

**Architecture:** Pure permission wiring — no new UI, no new business logic. Each commit changes `acl.ts` (feature declarations), `setup.ts` (role assignments), `page.meta.ts` (page guards), API route metadata (route guards), and integration test comments. All changes are find-replace-level mechanical edits.

**Tech Stack:** TypeScript, OM RBAC (`requireFeatures`), Playwright integration tests.

---

## File Map

All paths relative to `apps/prm/src/modules/partnerships/`.

| File | Commit | Change |
|------|--------|--------|
| `acl.ts` | 1,2,3,4 | Feature declarations |
| `setup.ts` | 1,2,3,4 | Role → feature assignments |
| `backend/partnerships/tier-review/page.meta.ts` | 1 | `tier.approve` → `tier.manage` |
| `api/post/tier-assign.ts` | 1 | `tier.approve` → `tier.manage` |
| `api/post/tier-proposals-action.ts` | 1 | `tier.approve` → `tier.manage` |
| `api/post/enqueue-tier-evaluation.ts` | 1 | `tier.approve` → `tier.manage` |
| `api/get/tier-proposals.ts` | 1 | `tier.approve` → `tier.manage` |
| `__integration__/TC-PRM-018.spec.ts` | 1 | Update comments |
| `__integration__/TC-PRM-023.spec.ts` | 1 | Update comments |
| `backend/partnerships/rfp-campaigns/page.meta.ts` | 2 | Add `requireFeatures: ['partnerships.rfp.view']` |
| `backend/partnerships/rfp-campaigns/[id]/page.meta.ts` | 2 | Add `requireFeatures: ['partnerships.rfp.view']` |
| `api/rfp-campaigns/route.ts` | 2 | GET: add `requireFeatures: ['partnerships.rfp.view']` |
| `api/rfp-campaigns-detail/route.ts` | 2 | GET: add `requireFeatures: ['partnerships.rfp.view']` |
| `backend/partnerships/license-deals/page.meta.ts` | 3 | `license-deals.manage` → `license-deals.view` |
| `api/partner-license-deals/route.ts` | 3 | GET: `license-deals.manage` → `license-deals.view` |
| `__integration__/TC-PRM-013.spec.ts` | 3 | Update comments |
| `__integration__/TC-PRM-012.spec.ts` | 3 | Update comments |
| `__integration__/TC-PRM-020.spec.ts` | 3 | Update comments |
| `backend/partnerships/my-wic/page.meta.ts` | 4 | `widgets.wic-summary` → `wic.view` |
| `api/get/wic-scores.ts` | 4 | Add `requireFeatures: ['partnerships.wic.view']` |
| `__integration__/TC-PRM-024.spec.ts` | 4 | Update comments |
| `README.md` | 4 | Update feature list in docs |

---

## Final Permission Model (reference)

### Features (acl.ts)

```typescript
const features = [
  { id: 'partnerships.agencies.manage', title: 'Manage agencies', module: 'partnerships' },
  { id: 'partnerships.license-deals.manage', title: 'Manage license deals', module: 'partnerships' },
  { id: 'partnerships.license-deals.view', title: 'View license deals', module: 'partnerships' },
  { id: 'partnerships.rfp.manage', title: 'Manage RFP campaigns', module: 'partnerships' },
  { id: 'partnerships.rfp.view', title: 'View RFP campaigns', module: 'partnerships' },
  { id: 'partnerships.rfp.respond', title: 'Respond to RFP campaigns', module: 'partnerships' },
  { id: 'partnerships.wic.manage', title: 'Manage WIC imports', module: 'partnerships' },
  { id: 'partnerships.wic.view', title: 'View WIC scores', module: 'partnerships' },
  { id: 'partnerships.tier.manage', title: 'Manage tiers', module: 'partnerships' },
  { id: 'partnerships.widgets.cross-org-wip', title: 'View cross-org WIP table', module: 'partnerships' },
  { id: 'partnerships.widgets.wip-count', title: 'View WIP count widget', module: 'partnerships' },
  { id: 'partnerships.widgets.wic-summary', title: 'View WIC summary widget', module: 'partnerships' },
  { id: 'partnerships.widgets.onboarding-checklist', title: 'View onboarding checklist widget', module: 'partnerships' },
  { id: 'partnerships.widgets.tier-status', title: 'View tier status widget', module: 'partnerships' },
]
```

### Role Assignments (setup.ts)

| Feature | PM | Admin | BDM | Contributor |
|---|:---:|:---:|:---:|:---:|
| `partnerships.agencies.manage` | x | | | |
| `partnerships.license-deals.manage` | x | | | |
| `partnerships.license-deals.view` | x | x | x | |
| `partnerships.rfp.manage` | x | | | |
| `partnerships.rfp.view` | x | x | x | |
| `partnerships.rfp.respond` | | x | x | |
| `partnerships.wic.manage` | x | | | |
| `partnerships.wic.view` | | x | x | x |
| `partnerships.tier.manage` | x | | | |
| `partnerships.widgets.cross-org-wip` | x | | | |
| `partnerships.widgets.wip-count` | | x | x | |
| `partnerships.widgets.wic-summary` | | x | x | x |
| `partnerships.widgets.onboarding-checklist` | | x | x | |
| `partnerships.widgets.tier-status` | | x | x | x |

---

## Task 1: Rename `tier.approve` → `tier.manage`

**Files:**
- Modify: `acl.ts:9`
- Modify: `setup.ts:498`
- Modify: `backend/partnerships/tier-review/page.meta.ts:3`
- Modify: `api/post/tier-assign.ts:12`
- Modify: `api/post/tier-proposals-action.ts:12`
- Modify: `api/post/enqueue-tier-evaluation.ts:13`
- Modify: `api/get/tier-proposals.ts:12`
- Modify: `__integration__/TC-PRM-018.spec.ts:8,153`
- Modify: `__integration__/TC-PRM-023.spec.ts:8`

- [ ] **Step 1: Update `acl.ts` — rename feature declaration**

Replace line 9:
```typescript
  { id: 'partnerships.tier.approve', title: 'Approve tier change proposals', module: 'partnerships' },
```
With:
```typescript
  { id: 'partnerships.tier.manage', title: 'Manage tiers', module: 'partnerships' },
```

- [ ] **Step 2: Update `setup.ts` — rename in PM role**

Replace in `PRM_ROLE_FEATURES.partnership_manager` (line 498):
```typescript
    'partnerships.tier.approve',
```
With:
```typescript
    'partnerships.tier.manage',
```

- [ ] **Step 3: Update tier-review page guard**

In `backend/partnerships/tier-review/page.meta.ts` line 3, replace:
```typescript
  requireFeatures: ['partnerships.tier.approve'],
```
With:
```typescript
  requireFeatures: ['partnerships.tier.manage'],
```

- [ ] **Step 4: Update 4 API route guards**

In each of these files, replace `'partnerships.tier.approve'` with `'partnerships.tier.manage'`:

`api/post/tier-assign.ts` line 12:
```typescript
  POST: { requireAuth: true, requireFeatures: ['partnerships.tier.manage'] },
```

`api/post/tier-proposals-action.ts` line 12:
```typescript
  POST: { requireAuth: true, requireFeatures: ['partnerships.tier.manage'] },
```

`api/post/enqueue-tier-evaluation.ts` line 13:
```typescript
  POST: { requireAuth: true, requireFeatures: ['partnerships.tier.manage'] },
```

`api/get/tier-proposals.ts` line 12:
```typescript
  GET: { requireAuth: true, requireFeatures: ['partnerships.tier.manage'] },
```

- [ ] **Step 5: Update integration test comments**

In `__integration__/TC-PRM-018.spec.ts`, replace both occurrences of `partnerships.tier.approve` with `partnerships.tier.manage`:
- Line 8: `Auth: requireFeatures: ['partnerships.tier.manage'] (PM only)`
- Line 153: `// Admin lacks partnerships.tier.manage — page should not render`

In `__integration__/TC-PRM-023.spec.ts`, line 8:
- `Auth: requireFeatures: ['partnerships.tier.manage'] (PM only)`

- [ ] **Step 6: Verify**

Run: `yarn typecheck`
Expected: no errors (this is a string literal rename, no type impact)

Run: `yarn test -- --testPathPattern onboarding-status`
Expected: PASS (this test doesn't reference tier.approve)

- [ ] **Step 7: Commit**

```bash
git add apps/prm/src/modules/partnerships/acl.ts \
  apps/prm/src/modules/partnerships/setup.ts \
  apps/prm/src/modules/partnerships/backend/partnerships/tier-review/page.meta.ts \
  apps/prm/src/modules/partnerships/api/post/tier-assign.ts \
  apps/prm/src/modules/partnerships/api/post/tier-proposals-action.ts \
  apps/prm/src/modules/partnerships/api/post/enqueue-tier-evaluation.ts \
  apps/prm/src/modules/partnerships/api/get/tier-proposals.ts \
  apps/prm/src/modules/partnerships/__integration__/TC-PRM-018.spec.ts \
  apps/prm/src/modules/partnerships/__integration__/TC-PRM-023.spec.ts
git commit -m "refactor(prm): rename tier.approve → tier.manage permission"
```

---

## Task 2: Add `partnerships.rfp.view` + wire it

**Files:**
- Modify: `acl.ts`
- Modify: `setup.ts`
- Modify: `backend/partnerships/rfp-campaigns/page.meta.ts`
- Modify: `backend/partnerships/rfp-campaigns/[id]/page.meta.ts`
- Modify: `api/rfp-campaigns/route.ts:33`
- Modify: `api/rfp-campaigns-detail/route.ts:10`

- [ ] **Step 1: Add feature to `acl.ts`**

Replace the full `features` array with the updated version. Add after the `partnerships.rfp.manage` line:
```typescript
  { id: 'partnerships.rfp.view', title: 'View RFP campaigns', module: 'partnerships' },
```

The features array should now contain (in order):
```typescript
const features = [
  { id: 'partnerships.agencies.manage', title: 'Manage agencies', module: 'partnerships' },
  { id: 'partnerships.wic.manage', title: 'Manage WIC imports', module: 'partnerships' },
  { id: 'partnerships.widgets.wip-count', title: 'View WIP count widget', module: 'partnerships' },
  { id: 'partnerships.widgets.onboarding-checklist', title: 'View onboarding checklist widget', module: 'partnerships' },
  { id: 'partnerships.widgets.cross-org-wip', title: 'View cross-org WIP table', module: 'partnerships' },
  { id: 'partnerships.widgets.wic-summary', title: 'View WIC summary widget', module: 'partnerships' },
  { id: 'partnerships.license-deals.manage', title: 'Manage license deals', module: 'partnerships' },
  { id: 'partnerships.tier.manage', title: 'Manage tiers', module: 'partnerships' },
  { id: 'partnerships.widgets.tier-status', title: 'View tier status widget', module: 'partnerships' },
  { id: 'partnerships.rfp.manage', title: 'Manage RFP campaigns', module: 'partnerships' },
  { id: 'partnerships.rfp.view', title: 'View RFP campaigns', module: 'partnerships' },
  { id: 'partnerships.rfp.respond', title: 'Respond to RFP campaigns', module: 'partnerships' },
]
```

- [ ] **Step 2: Add to role assignments in `setup.ts`**

Add `'partnerships.rfp.view'` to three roles:

In `partner_admin` (after `'partnerships.rfp.respond'`, ~line 463):
```typescript
    'partnerships.rfp.respond',
    'partnerships.rfp.view',
```

In `partner_member` (after `'partnerships.rfp.respond'`, ~line 476):
```typescript
    'partnerships.rfp.respond',
    'partnerships.rfp.view',
```

In `partnership_manager` (after `'partnerships.rfp.manage'`, ~line 493):
```typescript
    'partnerships.rfp.manage',
    'partnerships.rfp.view',
```

- [ ] **Step 3: Add page guard to RFP campaigns list page**

In `backend/partnerships/rfp-campaigns/page.meta.ts`, add `requireFeatures` to the metadata:

```typescript
export const metadata = {
  requireAuth: true,
  requireFeatures: ['partnerships.rfp.view'],
  pageTitle: 'RFP Campaigns',
  pageTitleKey: 'partnerships.rfpCampaigns.title',
  pageGroup: 'Partnerships',
  pageGroupKey: 'partnerships.nav.group',
  pagePriority: 10,
  pageOrder: 150,
  breadcrumb: [
    { label: 'Partnerships', labelKey: 'partnerships.nav.group' },
    { label: 'RFP Campaigns', labelKey: 'partnerships.rfpCampaigns.title' },
  ],
}
```

- [ ] **Step 4: Add page guard to RFP campaign detail page**

In `backend/partnerships/rfp-campaigns/[id]/page.meta.ts`, add `requireFeatures`:

```typescript
export const metadata = {
  requireAuth: true,
  requireFeatures: ['partnerships.rfp.view'],
  pageTitle: 'RFP Campaign',
  pageTitleKey: 'partnerships.rfpCampaigns.detailTitle',
  pageGroup: 'Partnerships',
  pageGroupKey: 'partnerships.nav.group',
  pagePriority: 10,
  pageOrder: 152,
  showInSidebar: false,
  breadcrumb: [
    { label: 'Partnerships', labelKey: 'partnerships.nav.group' },
    { label: 'RFP Campaigns', labelKey: 'partnerships.rfpCampaigns.title' },
    { label: 'Campaign Detail', labelKey: 'partnerships.rfpCampaigns.detailTitle' },
  ],
}
```

- [ ] **Step 5: Add feature guard to RFP campaigns GET API**

In `api/rfp-campaigns/route.ts` line 33, change:
```typescript
  GET: { requireAuth: true },
```
To:
```typescript
  GET: { requireAuth: true, requireFeatures: ['partnerships.rfp.view'] },
```

- [ ] **Step 6: Add feature guard to RFP campaign detail GET API**

In `api/rfp-campaigns-detail/route.ts` line 10, change:
```typescript
  GET: { requireAuth: true },
```
To:
```typescript
  GET: { requireAuth: true, requireFeatures: ['partnerships.rfp.view'] },
```

- [ ] **Step 7: Verify**

Run: `yarn typecheck`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add apps/prm/src/modules/partnerships/acl.ts \
  apps/prm/src/modules/partnerships/setup.ts \
  apps/prm/src/modules/partnerships/backend/partnerships/rfp-campaigns/page.meta.ts \
  "apps/prm/src/modules/partnerships/backend/partnerships/rfp-campaigns/[id]/page.meta.ts" \
  apps/prm/src/modules/partnerships/api/rfp-campaigns/route.ts \
  apps/prm/src/modules/partnerships/api/rfp-campaigns-detail/route.ts
git commit -m "feat(prm): add partnerships.rfp.view permission and guard RFP pages/routes"
```

---

## Task 3: Add `partnerships.license-deals.view` + wire it

**Files:**
- Modify: `acl.ts`
- Modify: `setup.ts`
- Modify: `backend/partnerships/license-deals/page.meta.ts`
- Modify: `api/partner-license-deals/route.ts:32`
- Modify: `__integration__/TC-PRM-013.spec.ts:9`
- Modify: `__integration__/TC-PRM-012.spec.ts:9`
- Modify: `__integration__/TC-PRM-020.spec.ts:12`

Note: `license-deals/create/page.meta.ts` keeps `partnerships.license-deals.manage` — only PM creates deals.

- [ ] **Step 1: Add feature to `acl.ts`**

Add after the `partnerships.license-deals.manage` line:
```typescript
  { id: 'partnerships.license-deals.view', title: 'View license deals', module: 'partnerships' },
```

- [ ] **Step 2: Add to role assignments in `setup.ts`**

Add `'partnerships.license-deals.view'` to three roles:

In `partner_admin` (after `'partnerships.rfp.view'`):
```typescript
    'partnerships.license-deals.view',
```

In `partner_member` (after `'partnerships.rfp.view'`):
```typescript
    'partnerships.license-deals.view',
```

In `partnership_manager` (after `'partnerships.license-deals.manage'`):
```typescript
    'partnerships.license-deals.manage',
    'partnerships.license-deals.view',
```

- [ ] **Step 3: Change license deals list page guard to `.view`**

In `backend/partnerships/license-deals/page.meta.ts` line 3, replace:
```typescript
  requireFeatures: ['partnerships.license-deals.manage'],
```
With:
```typescript
  requireFeatures: ['partnerships.license-deals.view'],
```

Also remove the `visible` function (lines 4-5) — agency users should see this page too, not just PM in home org:
```typescript
export const metadata = {
  requireAuth: true,
  requireFeatures: ['partnerships.license-deals.view'],
  pageTitle: 'License Deals',
  pageTitleKey: 'partnerships.licenseDeals.title',
  pageGroup: 'Partnerships',
  pageGroupKey: 'partnerships.nav.group',
  pagePriority: 10,
  pageOrder: 140,
  breadcrumb: [
    { label: 'Partnerships', labelKey: 'partnerships.nav.group' },
    { label: 'License Deals', labelKey: 'partnerships.licenseDeals.title' },
  ],
}
```

- [ ] **Step 4: Change license deals GET route to `.view`**

In `api/partner-license-deals/route.ts` line 32, change:
```typescript
  GET: { requireAuth: true, requireFeatures: ['partnerships.license-deals.manage'] },
```
To:
```typescript
  GET: { requireAuth: true, requireFeatures: ['partnerships.license-deals.view'] },
```

POST, PUT, DELETE remain `partnerships.license-deals.manage`.

- [ ] **Step 5: Update integration test comments**

In `__integration__/TC-PRM-013.spec.ts` line 9, update comment:
```
 * Auth: requireFeatures: ['partnerships.license-deals.manage'] (PM only)
```
→
```
 * Auth: GET requireFeatures: ['partnerships.license-deals.view'], writes requireFeatures: ['partnerships.license-deals.manage'] (PM only)
```

In `__integration__/TC-PRM-012.spec.ts` line 9, same update:
```
 * Auth:  requireAuth + requireFeatures: ['partnerships.license-deals.manage'] (PM only)
```
→
```
 * Auth: GET requireFeatures: ['partnerships.license-deals.view'], writes requireFeatures: ['partnerships.license-deals.manage'] (PM only)
```

In `__integration__/TC-PRM-020.spec.ts` line 12, same update:
```
 * Auth: requireFeatures: ['partnerships.license-deals.manage'] (PM only)
```
→
```
 * Auth: GET requireFeatures: ['partnerships.license-deals.view'], writes requireFeatures: ['partnerships.license-deals.manage'] (PM only)
```

- [ ] **Step 6: Verify**

Run: `yarn typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add apps/prm/src/modules/partnerships/acl.ts \
  apps/prm/src/modules/partnerships/setup.ts \
  apps/prm/src/modules/partnerships/backend/partnerships/license-deals/page.meta.ts \
  apps/prm/src/modules/partnerships/api/partner-license-deals/route.ts \
  apps/prm/src/modules/partnerships/__integration__/TC-PRM-013.spec.ts \
  apps/prm/src/modules/partnerships/__integration__/TC-PRM-012.spec.ts \
  apps/prm/src/modules/partnerships/__integration__/TC-PRM-020.spec.ts
git commit -m "feat(prm): add partnerships.license-deals.view permission, split read from write"
```

---

## Task 4: Add `partnerships.wic.view` + wire it + update README

**Files:**
- Modify: `acl.ts`
- Modify: `setup.ts`
- Modify: `backend/partnerships/my-wic/page.meta.ts`
- Modify: `api/get/wic-scores.ts:13`
- Modify: `__integration__/TC-PRM-024.spec.ts:13`
- Modify: `README.md:22`

- [ ] **Step 1: Add feature to `acl.ts`**

Add after the `partnerships.wic.manage` line:
```typescript
  { id: 'partnerships.wic.view', title: 'View WIC scores', module: 'partnerships' },
```

- [ ] **Step 2: Add to role assignments in `setup.ts`**

Add `'partnerships.wic.view'` to three agency roles (NOT PM — PM has `.wic.manage` for imports, and doesn't use the My WIC page):

In `partner_admin` (alongside other partnership features):
```typescript
    'partnerships.wic.view',
```

In `partner_member`:
```typescript
    'partnerships.wic.view',
```

In `partner_contributor`:
```typescript
    'partnerships.wic.view',
```

- [ ] **Step 3: Change My WIC page guard**

In `backend/partnerships/my-wic/page.meta.ts` line 3, replace:
```typescript
  requireFeatures: ['partnerships.widgets.wic-summary'],
```
With:
```typescript
  requireFeatures: ['partnerships.wic.view'],
```

- [ ] **Step 4: Add feature guard to wic-scores GET API**

In `api/get/wic-scores.ts` line 13, change:
```typescript
  GET: { requireAuth: true },
```
To:
```typescript
  GET: { requireAuth: true, requireFeatures: ['partnerships.wic.view'] },
```

- [ ] **Step 5: Update integration test comment**

In `__integration__/TC-PRM-024.spec.ts` line 13, replace:
```
 *   my-wic: requireFeatures: ['partnerships.widgets.wic-summary'] (agency roles)
```
With:
```
 *   my-wic: requireFeatures: ['partnerships.wic.view'] (agency roles)
```

- [ ] **Step 6: Update README.md**

In `README.md` line 22, replace:
```
| `acl.ts` | Feature-based permissions | Declares `partnerships.agencies.manage`, `partnerships.wic.manage`, `partnerships.license-deals.manage`, etc. |
```
With:
```
| `acl.ts` | Feature-based permissions | Declares 14 features: `*.manage` (PM write), `*.view` (read access), `*.respond` (RFP action), `*.widgets.*` (dashboard cards). |
```

- [ ] **Step 7: Final `acl.ts` verification**

After all 4 tasks, the final `acl.ts` should contain exactly these 14 features (verify the file matches):

```typescript
const features = [
  { id: 'partnerships.agencies.manage', title: 'Manage agencies', module: 'partnerships' },
  { id: 'partnerships.wic.manage', title: 'Manage WIC imports', module: 'partnerships' },
  { id: 'partnerships.wic.view', title: 'View WIC scores', module: 'partnerships' },
  { id: 'partnerships.widgets.wip-count', title: 'View WIP count widget', module: 'partnerships' },
  { id: 'partnerships.widgets.onboarding-checklist', title: 'View onboarding checklist widget', module: 'partnerships' },
  { id: 'partnerships.widgets.cross-org-wip', title: 'View cross-org WIP table', module: 'partnerships' },
  { id: 'partnerships.widgets.wic-summary', title: 'View WIC summary widget', module: 'partnerships' },
  { id: 'partnerships.license-deals.manage', title: 'Manage license deals', module: 'partnerships' },
  { id: 'partnerships.license-deals.view', title: 'View license deals', module: 'partnerships' },
  { id: 'partnerships.tier.manage', title: 'Manage tiers', module: 'partnerships' },
  { id: 'partnerships.widgets.tier-status', title: 'View tier status widget', module: 'partnerships' },
  { id: 'partnerships.rfp.manage', title: 'Manage RFP campaigns', module: 'partnerships' },
  { id: 'partnerships.rfp.view', title: 'View RFP campaigns', module: 'partnerships' },
  { id: 'partnerships.rfp.respond', title: 'Respond to RFP campaigns', module: 'partnerships' },
]

export { features }
export default features
```

- [ ] **Step 8: Verify all**

Run: `yarn typecheck`
Expected: no errors

Run: `yarn test -- --testPathPattern onboarding-status`
Expected: PASS (this test uses `partnerships.widgets.wip-count` and `directory.organizations.manage` — neither changed)

- [ ] **Step 9: Commit**

```bash
git add apps/prm/src/modules/partnerships/acl.ts \
  apps/prm/src/modules/partnerships/setup.ts \
  apps/prm/src/modules/partnerships/backend/partnerships/my-wic/page.meta.ts \
  apps/prm/src/modules/partnerships/api/get/wic-scores.ts \
  apps/prm/src/modules/partnerships/__integration__/TC-PRM-024.spec.ts \
  apps/prm/src/modules/partnerships/README.md
git commit -m "feat(prm): add partnerships.wic.view permission, guard My WIC page and API"
```

---

## Post-Implementation Notes

**What changed:**
- 14 features total (was 11): +3 new (`rfp.view`, `license-deals.view`, `wic.view`), 1 rename (`tier.approve` → `tier.manage`)
- 2 security fixes: RFP campaigns pages/GET and wic-scores GET were unguarded (`requireAuth` only) — now properly gated
- License deals list page visible to agency users (was PM-only via `visible` function + `.manage` guard)

**What did NOT change:**
- No new UI pages or components
- No database changes
- No new business logic
- Widget permissions unchanged — widgets still use their own `partnerships.widgets.*` features
- `onboarding-status.ts` role detection logic unchanged (uses `directory.organizations.manage` and `partnerships.widgets.wip-count`)

**Integration tests:** Comments updated to reflect new permission names. Test logic unchanged — the actual RBAC enforcement is tested via page access, which still works the same way (PM has the features, agency roles have theirs).

**To run after all commits:**
```bash
yarn db:migrate          # No migrations needed but safe to verify
yarn initialize          # Re-seeds roles with updated features
yarn test:integration    # Full Playwright suite to verify nothing broke
```
