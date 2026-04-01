# Pre-Implementation Analysis: Tier Validity Dates

## Executive Summary

The spec is **well-structured and implementation-ready** for Phase A (C1-C3, C7). The challenger review already resolved the major domain modeling concerns. Two issues need attention before coding: (1) the spec references `injection-table.ts` for the new banner widget but dashboard widgets are seeded via `setup.ts` — needs correction, and (2) the `validUntil` requirement on tier-assign API needs to also cover the `POST /partnerships/agencies` initial tier assignment path. No critical blockers — recommend proceeding with Phase A after addressing the gaps below.

---

## Backward Compatibility

### Violations Found

| # | Surface | Issue | Severity | Proposed Fix |
|---|---------|-------|----------|-------------|
| 1 | Database schema | Column rename `effective_date` → `valid_from` | Warning | New migration with `ALTER TABLE tier_assignments RENAME COLUMN effective_date TO valid_from`. Original migration untouched. All 9 codebase references audited (see list below). |
| 2 | Event IDs | Removing `partnerships.agency.tier_changed` from `events.ts` | Warning | Zero subscribers confirmed. Safe to remove. Remove: (a) event in `events.ts:5`, (b) emit block in `tier-proposals-action.ts:77-90`, (c) reference in `tier-evaluation-workflow.json:129`. |
| 3 | Type definitions | Entity property `effectiveDate` renamed to `validFrom` | Warning | Contained within `@app` module — no external consumers. All references in partnerships module only. |
| 4 | API route contracts | `POST /partnerships/tier-assign` adds required `validUntil` field | Warning | Standalone app, no external API consumers. Frontend form updated in same commit. |
| 5 | API route contracts | `POST /partnerships/tier-proposals/action` adds required `validUntil` on approve | Warning | Same — standalone app. Approval dialog updated in same commit. |

### All `effectiveDate` References (Audit)

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `data/entities.ts` | 110-111 | Entity property definition |
| 2 | `migrations/Migration20260323141336.ts` | 6 | Original migration SQL (DO NOT CHANGE) |
| 3 | `setup.ts` | ~1004-1007 | Demo seed data (4 TierAssignment fixtures) |
| 4 | `api/post/tier-assign.ts` | 52 | `effectiveDate: new Date()` |
| 5 | `api/post/tier-proposals-action.ts` | 68 | `effectiveDate: now` |
| 6 | `api/post/agencies.ts` | 144 | Initial tier on agency creation |
| 7 | `api/get/tier-status.ts` | 170-174 | `orderBy: { effectiveDate: 'DESC' }` |
| 8 | `api/get/agencies.ts` | 213 | `orderBy: { effectiveDate: 'DESC' }` |
| 9 | `workers/tier-evaluation.ts` | 203-208 | `orderBy: { effectiveDate: 'DESC' }` |

### BC Section in Spec

The spec includes migration strategy in section 3.1 — adequate for a standalone app. No re-export bridges needed since there are no external consumers of the entity type.

---

## Spec Completeness

### Present Sections

| Section | Status | Notes |
|---------|--------|-------|
| Business Context | Complete | Clear why/what-changes/what-doesn't table |
| Ubiquitous Language | Complete | Updated after challenger review |
| Domain Model Changes | Complete | Entity, invariants, migration, computed states |
| Workflow Changes | Complete | WF5 edge cases 6-9 added |
| User Stories | Complete | 6 stories with success criteria |
| Platform Mapping | Complete | Story-to-module mapping with gap flags |
| Gap Analysis / Atomic Commits | Complete | 7 commits scored and sequenced |
| Phasing | Complete | Phase A/B with acceptance criteria |
| Resolved Questions | Complete | 3 decisions documented |
| Cleanup | Complete | AgencyTierChanged removal scoped |
| Deferred | Complete | Suspension, events, per-tier config |

### Missing Sections

| Section | Impact | Recommendation |
|---------|--------|---------------|
| Integration test scenarios | Tests will be ad-hoc without defined scenarios | Add test scenarios per user story to C7 description. Suggest: (1) PM assigns tier with validUntil, verify persistence; (2) PM approves proposal with validUntil; (3) tier-status API returns validity fields; (4) legacy null validUntil shows "No review date" |
| Detailed implementation steps per commit | Implementor must infer file changes | Acceptable — platform mapping + atomic commits provide enough guidance. Existing specs in this repo follow same level of detail. |
| i18n key planning | Hardcoded strings risk | Add i18n keys list: `partnerships.tierStatus.reviewDate`, `partnerships.tierStatus.noReviewDate`, `partnerships.tierStatus.expiring`, `partnerships.tierStatus.overdue`, `partnerships.tierStatus.expiringBanner`, `partnerships.tierStatus.overdueBanner` |

---

## AGENTS.md Compliance

### Violations

| Rule | Location | Fix |
|------|----------|-----|
| Module structure: `@app` module in `src/modules/partnerships/` | Correct | No issue — all changes within existing module |
| Zod validation for new inputs | Spec section 3.3 says "required date picker" | Confirm: add `validUntil: z.string().datetime()` to `tierAssignSchema` in `tier-assign.ts` and to approval path in `tier-proposals-action.ts`. Add validation `validUntil > today`. |
| Auto-discovery conventions | No new files breaking conventions | No issue |
| Tenant scoping | TierAssignment already has `tenantId` | No issue |
| Dashboard widgets via setup.ts | **Spec C5 says "Widget injection in injection-table.ts"** | **FIX NEEDED:** Dashboard widgets in this app are NOT registered via `injection-table.ts` (it's intentionally empty). They are seeded via `seedDashboardDefaultsForTenant()` in `setup.ts`. The new expiry banner widget must follow the same pattern. |

---

## Risk Assessment

### High Risks

None.

### Medium Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Column rename migration on existing data | If migration runs incorrectly, queries break | Test migration on local DB first. Use `ALTER TABLE ... RENAME COLUMN` (not drop+add). Run `yarn db:migrate` and verify all queries still work. |
| `POST /partnerships/agencies` missing from spec | Agency creation also sets initial TierAssignment with `effectiveDate`. Spec doesn't mention this path. | Add to C2 scope: update `agencies.ts:144` to use `validFrom` instead of `effectiveDate`, and decide if initial tier needs `validUntil` (recommend: optional for initial assignment, PM can set it later via tier-assign). |
| 9 files reference `effectiveDate` | Missing one during rename = runtime error | Use find-and-replace across `src/modules/partnerships/` after entity rename. Run `yarn typecheck` to catch any missed references. |

### Low Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Existing integration tests (36 files) may reference effectiveDate indirectly | Test failures | Run full integration test suite after C1. effectiveDate is an internal entity property — tests interact via API, so impact is likely zero. |
| Demo seed data needs validUntil values | Seed would create assignments without review dates | C7 handles this — update seed fixtures with realistic validUntil dates. |
| Widget type definition change | TypeScript error in widget.client.tsx | `TierStatusResponse` type needs `validFrom`, `validUntil`, `isExpiring`, `isExpired` added. Additive — no breaks. |

---

## Gap Analysis

### Critical Gaps (Block Implementation)

None.

### Important Gaps (Should Address Before Phase A)

1. **`POST /partnerships/agencies` path not in spec**: Agency creation at `api/post/agencies.ts:141-150` creates a TierAssignment with `effectiveDate`. This must be updated to `validFrom` in C1, and a decision is needed: should initial tier assignment require `validUntil`?
   - **Recommendation:** Make `validUntil` optional for initial assignment (onboarding). PM can set review date later via tier-assign. This avoids blocking the "Add Agency" flow.

2. **Widget registration mechanism wrong in spec**: C5 says "Widget injection in injection-table.ts" but `injection-table.ts` is intentionally empty. Dashboard widgets are seeded via `setup.ts` → `seedDashboardDefaultsForTenant()`.
   - **Recommendation:** Update C5 description to use setup.ts seeding pattern. New widget needs: (a) `widget.ts` + `widget.client.tsx` in `widgets/dashboard/tier-expiry-banner/`, (b) ACL feature `partnerships.widgets.tier-expiry-banner` in `acl.ts`, (c) seed entry in `seedDashboardDefaultsForTenant()` for partner_admin and partner_member roles.

3. **Missing ACL feature for new banner widget**: The spec defines a new dashboard widget (C5) but doesn't specify the ACL feature ID. Existing widgets each have their own feature (e.g., `partnerships.widgets.tier-status`).
   - **Recommendation:** Add `partnerships.widgets.tier-expiry-banner` to `acl.ts`. Map to partner_admin and partner_member in `PRM_ROLE_FEATURES`. Exclude partner_contributor (per US-TV-3).

4. **i18n keys not planned**: 6+ new UI strings needed (review date labels, banner messages). No i18n key list in spec.
   - **Recommendation:** Add to spec or handle during implementation. Keys needed in `src/i18n/{en,pl,es,de}.json`.

### Nice-to-Have Gaps

1. **Date picker default value**: Spec section 9 says "today + 12 months, rounded to end of month" but this isn't repeated in the implementation sections (C2, C3). Implementor might miss it.
   - **Recommendation:** Add note to C2/C3 descriptions.

2. **OpenAPI doc updates**: `tier-assign.ts` and `tier-proposals-action.ts` both have `openApi` exports. Schema needs updating to reflect new `validUntil` field.

3. **`EXPIRY_NOTICE_DAYS` location**: Spec says "Added to tier-thresholds config" but `tier-thresholds.ts` currently only exports `TIER_THRESHOLDS` array and helper functions. Confirm this is the right file (it is — just add `export const EXPIRY_NOTICE_DAYS = 30`).

---

## Remediation Plan

### Before Implementation (Must Do)

1. **Update spec C5**: Change "Widget injection in injection-table.ts" → "Widget seeded via `seedDashboardDefaultsForTenant()` in setup.ts". Add ACL feature `partnerships.widgets.tier-expiry-banner`.
2. **Add `POST /partnerships/agencies` to C1 scope**: Include `api/post/agencies.ts:144` in the effectiveDate→validFrom rename. Make `validUntil` optional for initial onboarding assignment.
3. **Add i18n key list**: At minimum list the keys needed so translators can work in parallel.

### During Implementation (Add to Each Commit)

1. **C1**: After entity rename, run `yarn typecheck` to catch all missed references. Run `yarn test` for unit tests. Include the `EXPIRY_NOTICE_DAYS` constant.
2. **C2**: Add `validUntil` to zod schema with `z.coerce.date()` or `z.string().datetime()`. Set date picker default to today + 12 months (end of month). Update OpenAPI export.
3. **C3**: Same zod + OpenAPI updates for tier-proposals-action. Only require `validUntil` when `action === 'approve'`.
4. **C7**: Update all 4 seed TierAssignment fixtures with realistic `validUntil` values. Add at least one with `validUntil` in the past (to test overdue state) and one within 30 days (to test expiring state).

### Post-Implementation (Follow Up)

1. **Integration tests**: After Phase A, run `mercato test integration` to verify no regressions from the rename.
2. **Phase B planning**: Before starting C4-C6, update spec with correct widget registration pattern and ACL feature.

---

## Recommendation

**Ready to implement Phase A (C1, C2, C3, C7)** after applying the 3 "Before Implementation" fixes above. These are spec text corrections, not architectural changes — can be done in 5 minutes.

Phase B (C4, C5, C6) needs the widget registration mechanism corrected in the spec before implementation.
