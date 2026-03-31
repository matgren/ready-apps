# Phase 2 Gap Closure — Design

**Date:** 2026-03-28
**Scope:** 7 gaps across WF3 (WIC) and WF5 (Tier Governance), 7 atomic commits
**Approach:** E2E-driven dev (commits 1-4), refactor under existing tests (5-7)

---

## Commit Plan

### Commit 1: WIC import — accept `wic_score` from payload

**Problem:** `wic-import.ts` computes score via `computeWicScore()` instead of accepting it from the external assessment tool. Can never produce 0.25 (L1 smaller fix).

**Fix:** Remove `computeWicScore()`. Add `wic_score` as required field in Zod schema. Store value from payload directly.

**Files:** `api/post/wic-import.ts`, `data/validators.ts`

### Commit 2: Cross-org company_id uniqueness guard

**Problem:** Same company can be attributed to two different agencies via PartnerLicenseDeal, inflating MIN KPI.

**Fix:** One query in POST handler: if `company_id` exists in PartnerLicenseDeal for a different `organization_id`, return 422.

**Files:** `api/partner-license-deals/route.ts`

### Commit 3: Role-scoped tier widget

**Problem:** `tier-status` widget shows full KPI bars to all roles. Spec requires: contributor = badge only, PM = agency list view.

**Fix:** Conditional rendering in `widget.client.tsx` based on user role/features.

**Files:** `widgets/dashboard/tier-status/widget.client.tsx`

### Commit 4: Pagination on my-wic

**Problem:** `wic-scores` API returns all records, no page/limit. my-wic page has no pagination.

**Fix:** Add `page`/`limit` query params to `wic-scores.ts`. Add pagination controls to `my-wic/page.tsx`.

**Files:** `api/get/wic-scores.ts`, `backend/partnerships/my-wic/page.tsx`

### Commit 5: WIC import — mutation guards + feature flag

**Problem:** Missing `validateCrudMutationGuard`/`runCrudMutationGuardAfterSuccess`. Feature uses `partnerships.wic.import` but spec says `partnerships.manage`.

**Fix:** Add mutation guard calls. Change feature flag to `partnerships.manage` in route metadata, `acl.ts`, page meta.

**Files:** `api/post/wic-import.ts`, `acl.ts`, `backend/partnerships/wic-import/page.meta.ts`

### Commit 6: Workflow migration part 1 — command + definition + seed

**Problem:** Tier approval is custom code (`tier-proposals-action.ts`). No workflow definition, no audit trail, no SLA tracking.

**Fix:**
- Register `partnerships.tier-assignment.create` command in CommandBus
- Create workflow definition JSON (START → USER_TASK → approve/reject → END)
- Seed workflow in `setup.ts`

**Files:** `commands/`, workflow JSON, `setup.ts`

### Commit 7: Workflow migration part 2 — page + trigger + cleanup

**Problem:** Backend page still calls custom route. Worker doesn't start workflow instance.

**Fix:**
- `tier-review/page.tsx`: complete USER_TASK via `POST /api/workflows/tasks/{id}/complete`
- `workers/tier-evaluation.ts`: start workflow instance after creating TierChangeProposal
- Remove `tier-proposals-action.ts`

**Files:** `backend/partnerships/tier-review/page.tsx`, `workers/tier-evaluation.ts`, remove `api/post/tier-proposals-action.ts`

---

## Approach

- Commits 1-4: write failing UI E2E test, then implement to pass
- Commits 5-7: implement under existing test coverage
- After all commits: run `om-code-reviewer`
