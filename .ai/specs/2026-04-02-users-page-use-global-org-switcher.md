# Users Page: Use Global Organization Switcher

## TLDR
**Key Points:**
- Remove the duplicate agency `<select>` from the Users page — use the global OrganizationSwitcher instead
- PM currently sees two independent agency selectors (page-local + header); this causes confusion

**Scope:**
- Remove local `selectedOrgId` / `organizations` state from Users page
- Read org from `getCurrentOrganizationScope()` + `subscribeOrganizationScopeChanged()`
- Show empty state when no org is selected, pointing user to the global switcher

## Problem Statement

The Users page (`src/modules/partnerships/backend/partnerships/users/page.tsx`) maintains its own agency dropdown for PMs (lines 300-302, 557-582, 594-613). The global `OrganizationSwitcher` in the header already provides the same functionality — it persists to cookie `om_selected_org` and emits `organizationScopeChanged` events.

Result: PM sees **two unsynced selectors** on the same screen. Changing one does not affect the other. This is a Krug "FRICTION" issue — the user has to figure out which selector is "real" for this page.

## Proposed Solution

Replace the local org state with the global org scope from `@open-mercato/shared/lib/frontend/organizationEvents`:

1. On mount, read `getCurrentOrganizationScope().organizationId`
2. Subscribe to `subscribeOrganizationScopeChanged()` to react to switcher changes
3. When `organizationId` is `null` (PM hasn't selected an org), render an empty state: _"Select an agency from the organization switcher to manage its users."_
4. When `organizationId` is set, load and display users for that org (existing logic)

### Design Decisions
| Decision | Rationale |
|----------|-----------|
| Use global scope event, not cookie parsing | `getCurrentOrganizationScope()` + `subscribeOrganizationScopeChanged()` is the official API; cookie is an implementation detail |
| Empty state instead of inline dropdown | One source of truth — don't duplicate the switcher |
| Keep PM detection (`actorIsPM`) | Agency admins still auto-select their own org; empty state only applies to PMs |

## User Stories

- **PM** wants to **manage agency users by selecting the agency once in the global switcher** so that **every page respects the same selection without duplicate controls**
- **Agency admin** wants to **see their own users immediately** so that **nothing changes for them** (auto-select behavior stays)

## UI/UX

### PM — no org selected
Empty state inside `<PageBody>`:
```
[icon or subtle illustration]
Select an agency
Use the organization switcher in the top-right corner to choose an agency, then manage its users here.
```

### PM — org selected
Identical to current view minus the local `<select>`. `DataTable` title still shows `"Users — {agencyName}"`.

### Agency admin
No change — their org is auto-selected from the single org they belong to.

## Implementation Plan

### Phase 1: Replace local org state with global scope (single commit)

**Step 1 — Hook up global org scope**
- Remove: `organizations` state, `selectedOrgId` state, org fetch in `bootstrap()`, `handleOrgChange`
- Add: `getCurrentOrganizationScope()` on mount + `subscribeOrganizationScopeChanged()` subscription
- Derive `selectedOrgId` from the scope's `organizationId`

**Step 2 — Replace "select agency" screen with empty state**
- Remove the two `<select>` blocks (initial view + main view for PM)
- Add empty state when `actorIsPM && !selectedOrgId`: message pointing to the global switcher

**Step 3 — Keep org name in DataTable title**
- When org is selected, fetch org name from the existing `/api/directory/organizations?id={id}` or keep a lightweight lookup from the bootstrap orgs call (can derive from the scope)

### File Manifest
| File | Action | Purpose |
|------|--------|---------|
| `src/modules/partnerships/backend/partnerships/users/page.tsx` | Modify | Remove local org dropdown, subscribe to global scope |

## i18n

Update keys in `src/i18n/{locale}.json`:
- `partnerships.users.noOrgSelected` — "Select an agency"
- `partnerships.users.noOrgSelectedHint` — "Use the organization switcher in the top-right corner to choose an agency, then manage its users here."

Existing keys `partnerships.users.selectAgency` and `partnerships.users.selectAgencyPlaceholder` become unused — remove.

## Risks & Impact Review

### Org name resolution
- **Scenario**: After removing the local orgs fetch, we lose the org name for the DataTable title
- **Severity**: Low
- **Mitigation**: Fetch org name on-demand when `selectedOrgId` changes, or use the organization-switcher API that's already cached by the global switcher

### Agency admin regression
- **Scenario**: Agency admins rely on auto-selection from the bootstrap orgs list (line 361-362)
- **Severity**: Medium
- **Mitigation**: Agency admins' org is set by the global switcher automatically (it defaults to their single org). Verify this in testing.

## Final Compliance Report — 2026-04-02

### AGENTS.md Files Reviewed
- `AGENTS.md` (root) — standalone app conventions
- `node_modules/@open-mercato/shared/AGENTS.md` — shared package rules

### Compliance Matrix

| Rule Source | Rule | Status | Notes |
|-------------|------|--------|-------|
| root AGENTS.md | Use `@open-mercato/shared` i18n | Compliant | All strings use `useT()` |
| root AGENTS.md | Path aliases `@/*` → `./src/*` | Compliant | No new imports needed |
| shared AGENTS.md | Use `useT()` for client-side i18n | Compliant | Empty state strings use `t()` |

### Internal Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| No new data models | N/A | UI-only change |
| No new API contracts | N/A | Uses existing APIs |
| Risks cover all changes | Pass | Org name resolution + agency admin regression covered |

### Verdict
**Fully compliant** — ready for implementation

## Implementation Status

| Phase | Status | Date | Notes |
|-------|--------|------|-------|
| Phase 1 — Replace local org state with global scope | Done | 2026-04-02 | All steps implemented, typecheck passing |

### Phase 1 — Detailed Progress
- [x] Step 1: Hook up global org scope (`getCurrentOrganizationScope` + `subscribeOrganizationScopeChanged`)
- [x] Step 2: Replace "select agency" screen with empty state
- [x] Step 3: Keep org name in DataTable title (via existing `organizations` list)

## Changelog
### 2026-04-02
- Initial specification
- Phase 1 implemented
