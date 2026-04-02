# Phase 1, Commit 4: Onboarding Checklist Widget — Role-Conditional, Manual Checkoff, Auto-Dismiss

## Source
- App Spec sections: §3 (WF1 journey), §7 (Phase 1)
- User stories: US-1.7, US-1.8
- Commit plan: commits-WF1.md (Commit 5)

## What This Delivers
After this commit, when an Agency Admin logs in for the first time, they see a dashboard checklist showing 4 onboarding steps: fill company profile, add case study, invite BD, invite Contributor. When a BD logs in, they see 2 steps: add prospect company, create first deal. Each item links to the relevant page and has a clickable checkbox. Users manually mark items as completed. The widget disappears when all items are checked. Checked state is persisted via the dashboard widget `settings` mechanism (zero new tables, zero new endpoints).

## Design Decisions

### Manual Checkoff (not live queries)

**Previous approach:** Completion derived from live data queries (profile fields non-empty, case study exists, users with BD/Contributor role exist, deal exists). This created cross-module coupling — the checklist needed to query customers, entities, and auth modules, and the completion logic leaked into unrelated pages (e.g., the users page called onboarding-status for role detection).

**Current approach:** Users manually check items off. The checklist is self-contained — no cross-module queries, no coupling. Items link to the relevant pages as guidance, but completion is tracked by explicit user action.

**Why:** Simpler, decoupled, no fragile heuristics ("what counts as profile filled?"). The checklist is a UX guide, not a data validator. If the user says they did it, they did it.

### Widget Settings for State (not custom storage)

**Previous approach (spec v2):** Custom API endpoints (`POST /api/partnerships/onboarding-check`) and custom storage (new table or CustomFieldValue).

**Current approach:** Use the OM dashboard widget `settings` persistence that every widget already receives. `DashboardWidgetComponentProps` provides `settings` (read) and `onSettingsChange` (write). The dashboard framework persists settings to `dashboard_layouts.layout_json[].settings` via `PATCH /api/dashboards/layout/:itemId`.

**Why:** Zero new endpoints, zero new tables, zero migrations. The platform already solves this — reference: `packages/core/src/modules/dashboards/widgets/dashboard/orders-kpi/widget.client.tsx` uses `onSettingsChange` for per-widget state.

## Acceptance Criteria
**Domain (Vernon):**
- [ ] Onboarding checklist widget visible only to agency roles (`agency_admin`, `agency_business_developer`, `agency_developer`) — not shown to PM
- [ ] Checklist items are role-conditional: Admin sees 4 items, BD sees 2 items, Contributor sees 1 item
- [ ] Users can manually check/uncheck items by clicking the checkbox
- [ ] Checked state is persisted per-user via widget `settings` and survives page reload
- [ ] Widget disappears when all items are checked

**Business (Mat):**
- [ ] Admin logs in for the first time and sees a checklist: fill profile, add case study, invite BD, invite Contributor
- [ ] BD logs in for the first time and sees a checklist: add prospect company, create first deal
- [ ] Contributor sees a checklist: set GitHub username
- [ ] Checklist items link to the right page
- [ ] Checked items show checkmark and strikethrough
- [ ] Widget disappears when all items checked

## Files
| File | Action | Purpose |
|------|--------|---------|
| `src/modules/partnerships/api/get/onboarding-status.ts` | Simplify | Returns static checklist items per role only. No completion queries, no checked state (state lives in widget settings). Kept for role detection by the widget. |
| `src/modules/partnerships/widgets/dashboard/onboarding-checklist/widget.ts` | Keep | Dashboard widget server definition (unchanged) |
| `src/modules/partnerships/widgets/dashboard/onboarding-checklist/widget.client.tsx` | Rewrite | Client component: reads items from API, reads/writes checked state via `settings`/`onSettingsChange`, renders clickable checkboxes, auto-dismiss |
| `src/modules/partnerships/widgets/injection-table.ts` | Keep | Widget registration (unchanged) |
| `src/modules/partnerships/i18n/en.json` | Keep | i18n keys (unchanged) |

**Deleted files:**
| File | Reason |
|------|--------|
| `src/modules/partnerships/api/post/onboarding-check.ts` | Not needed — state persists via widget settings, not a custom endpoint |

## OM Patterns Used
- **Dashboard widget with settings** — Reference: `$OM_REPO/packages/core/src/modules/dashboards/widgets/dashboard/orders-kpi/widget.client.tsx` (uses `onSettingsChange` for per-widget persistent state)
- **Widget settings persistence** — `PATCH /api/dashboards/layout/:itemId` saves `settings` to `dashboard_layouts.layout_json[].settings` per-user
- **Widget types** — `DashboardWidgetComponentProps<TSettings>` from `@open-mercato/shared/modules/dashboard/widgets`

## Implementation Notes

### State Storage: Widget Settings

The widget uses `settings` and `onSettingsChange` from `DashboardWidgetComponentProps`:

```typescript
type ChecklistSettings = {
  checkedItems: string[]  // e.g. ['fill_profile', 'add_case_study']
}
```

- **Read:** `settings.checkedItems ?? []` on mount
- **Write:** `onSettingsChange({ checkedItems: [...updated] })` on checkbox toggle
- **Persistence:** Handled by dashboard framework — saves to `dashboard_layouts.layout_json[].settings` via `PATCH /api/dashboards/layout/:itemId`

No custom API for persistence. No new tables. No migrations.

### API Route: `GET /api/partnerships/onboarding-status` (simplified)

Returns static items per role. No checked state (that lives in widget settings):

```typescript
type OnboardingStatusResponse = {
  role: 'agency_admin' | 'agency_business_developer' | 'agency_developer'
  items: Array<{
    id: string
    label: string   // i18n key
    link: string    // relative URL to relevant page
  }>
}
```

### Checklist Items (Static, Per-Role)

**Admin items (4):**

| Item ID | Label (i18n key) | Link |
|---------|-------------------|------|
| `fill_profile` | `partnerships.widgets.onboardingChecklist.fillProfile` | `/backend/partnerships/agency-profile` |
| `add_case_study` | `partnerships.widgets.onboardingChecklist.addCaseStudy` | `/backend/partnerships/case-studies` |
| `invite_bd` | `partnerships.widgets.onboardingChecklist.inviteBd` | `/backend/partnerships/users` |
| `invite_contributor` | `partnerships.widgets.onboardingChecklist.inviteContributor` | `/backend/partnerships/users` |

**BD items (2):**

| Item ID | Label (i18n key) | Link |
|---------|-------------------|------|
| `add_prospect` | `partnerships.widgets.onboardingChecklist.addProspect` | `/backend/customers/companies` |
| `create_deal` | `partnerships.widgets.onboardingChecklist.createDeal` | `/backend/customers/deals` |

**Contributor items (1):**

| Item ID | Label (i18n key) | Link |
|---------|-------------------|------|
| `set_gh_username` | `partnerships.widgets.onboardingChecklist.setGhUsername` | `/backend/auth/profile` |

### Role Detection

Role detection uses `detectRoleByAssignment` (DB lookup of user's role assignments) — no dependency on feature checks or cross-module queries.

### Role Filtering
- `agency_admin`: show Admin items
- `agency_business_developer` (BD): show BD items
- `agency_developer`: show Contributor items
- `partnership_manager` (PM): no checklist (PM is not onboarding into an agency)

### Auto-Dismiss Logic
The widget client reads `settings.checkedItems` and compares against the items list from the API. If all items are checked, the widget returns `null` (not rendered).

### Widget Client Behavior
- Fetches static items from `GET /api/partnerships/onboarding-status` on mount
- Reads `settings.checkedItems` for persisted checked state
- Each item renders as a clickable row with a checkbox and a link
- Clicking the checkbox calls `onSettingsChange({ checkedItems: [...toggled] })` — persisted by dashboard framework
- Clicking the label/link navigates to the target page
- When all items become checked, the widget fades out

## Testing

### Unit Tests
- `api/get/onboarding-status.test.ts` — colocated

| Function | Test |
|----------|------|
| `handler` | Returns 4 items for agency_admin role |
| `handler` | Returns 2 items for agency_business_developer role |
| `handler` | Returns 1 item for agency_developer role |
| `handler` | Returns 403 for partnership_manager (no checklist for PM) |

### Integration Test Scenarios

| ID | Type | Scenario | Expected Result |
|----|------|----------|-----------------|
| T1 | UI | Admin logs in, sees onboarding checklist with 4 unchecked items | All items visible, none checked |
| T2 | UI | Admin clicks checkbox on "fill profile" item | Item shows checkmark, persists after page reload |
| T3 | UI | Admin checks all 4 items | Widget disappears |
| T4 | UI | BD logs in, sees 2-item checklist | Both items visible, none checked |
| T5 | UI | Admin unchecks a previously checked item | Item reverts to unchecked, widget reappears |

## Verification
```bash
yarn generate                    # After modifying widget files
yarn typecheck                   # Must pass
yarn build                       # Must pass
yarn test                        # Unit tests pass
yarn test:integration:ephemeral  # Integration tests pass (T1-T5)
```

## Migration Notes

### Users Page Fix
The users page (`/backend/partnerships/users`) previously called `GET /api/partnerships/onboarding-status` to detect PM vs agency role. This was a design smell — using a widget API for role detection. The users page now uses `POST /api/auth/feature-check` with `['partnerships.agencies.manage']` to detect PM (platform-native RBAC check). This fix is already applied.

### Cleanup (Done)
The following code from the old live-query approach has been removed:
- All completion-check functions (`checkProfileFilled`, `checkCaseStudyExists`, `checkBdInvited`, `checkContributorInvited`, `checkProspectAdded`, `checkDealCreated`, `checkGhUsernameFilled`, `buildAdminItems`, `buildBdItems`, `buildContributorItems`)
- Cross-module entity imports (`CustomerEntity`, `CustomerDeal`, `CustomFieldValue`, `CustomEntityStorage`, `User`)
- Unit tests for completion-check functions replaced with tests for static `getItemsForRole`

## Implementation Status

| Phase | Status | Date | Notes |
|-------|--------|------|-------|
| API simplification | Done | 2026-04-01 | Removed all completion queries, static items per role |
| Widget rewrite | Done | 2026-04-01 | Uses `settings`/`onSettingsChange` for checked state |
| Unit tests | Done | 2026-04-01 | 7 tests: detectRole (3) + getItemsForRole (4) |
| Users page fix | Done | 2026-04-01 | Uses `POST /api/auth/feature-check` for PM detection |
| Integration tests | Not started | — | T1-T5 scenarios defined in spec |
