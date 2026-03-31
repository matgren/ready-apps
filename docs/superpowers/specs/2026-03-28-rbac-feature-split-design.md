# RBAC Feature Split — partnerships.manage Too Broad

**Issue:** #15
**Date:** 2026-03-28
**Status:** Approved

## Problem

`partnerships.manage` is used as a catch-all feature for PM management pages AND general partnership access. `partner_admin` has this feature, giving agency admins access to PM-only pages: WIC Import, Agencies listing, and Add Agency.

## Solution

Split `partnerships.manage` into granular, PM-only features. Remove the broad feature entirely.

### New Features

| Feature ID | Purpose | Assigned to |
|------------|---------|-------------|
| `partnerships.wic.manage` | WIC Import page + API | `partnership_manager` only |
| `partnerships.agencies.manage` | Agencies listing + Add Agency | `partnership_manager` only |

### Removed Feature

| Feature ID | Reason |
|------------|--------|
| `partnerships.manage` | No pages require it after split — dead feature |

### Already Correct (no changes needed)

| Page | Feature | Status |
|------|---------|--------|
| License Deals | `partnerships.license-deals.manage` | PM-only ✅ |
| Tier Review | `partnerships.tier.approve` | PM-only ✅ |
| RFP Create/Settings | `partnerships.rfp.manage` | PM-only ✅ |

## Files to Change

### 1. `acl.ts` — Feature definitions
- Remove `partnerships.manage`
- Add `partnerships.wic.manage` ("Manage WIC imports (PM only)")
- Add `partnerships.agencies.manage` ("Manage agencies (PM only)")

### 2. `setup.ts` — Role-feature mappings
- `partnership_manager`: replace `partnerships.manage` → add `partnerships.wic.manage` + `partnerships.agencies.manage`
- `partner_admin`: remove `partnerships.manage`

### 3. `wic-import/page.meta.ts`
- `requireFeatures`: `partnerships.manage` → `partnerships.wic.manage`

### 4. `agencies/page.meta.ts`
- `requireFeatures`: `partnerships.manage` → `partnerships.agencies.manage`

### 5. `add-agency/page.meta.ts`
- `requireFeatures`: `partnerships.manage` → `partnerships.agencies.manage`

### 6. `api/post/wic-import.ts`
- `requireFeatures`: `partnerships.manage` → `partnerships.wic.manage`

## Impact on Roles

| Role | Before | After |
|------|--------|-------|
| `partnership_manager` | `partnerships.manage` | `partnerships.wic.manage` + `partnerships.agencies.manage` |
| `partner_admin` | `partnerships.manage` | *(removed — no access to these pages)* |
| `partner_member` | *(no change)* | *(no change)* |
| `partner_contributor` | *(no change)* | *(no change)* |

## UX Rationale (Krug)

Partner admin seeing Agencies listing = cognitive noise + potential data leak (other agency names visible). Partner admin gets their own agency data through dashboard widgets (WIC summary, tier status, onboarding checklist) and My WIC page. No need for the management views.
