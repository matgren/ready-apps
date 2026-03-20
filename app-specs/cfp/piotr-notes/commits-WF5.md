# Commit Plan: WF5 — Client Onboarding

Total: 5 commits | Max gap: 1 | No upstream dependencies

## Commit 1: Seed customer roles for portal access
- Scope: app
- Pattern: setup.ts defaultCustomerRoleFeatures
- Files: src/modules/cfp/setup.ts (modify)
- Delivers: event_manager and event_viewer CustomerRoles with portal.cfp.* features
- Depends on: Module scaffold
- Note: Uses OM cross-module feature merging — customer_accounts picks up automatically

## Commit 2: Consultant auto-assignment on org creation
- Scope: app
- Pattern: API interceptor (after hook)
- Files: src/modules/cfp/api/interceptors.ts (modify), data/entities.ts, data/validators.ts (modify)
- Delivers: Creating consultant auto-assigned to org
- Depends on: Commit 1

## Commit 3: Portal dashboard — CFP Event list widget
- Scope: app
- Pattern: portal page + dashboard widget
- Files: src/modules/cfp/frontend/portal/page.tsx + meta, api/get/portal/events.ts
- Delivers: Event Manager sees their org's CFP Events with status overview
- Depends on: Commit 1, WF1 (CFP Event entity)

## Commit 4: Consultant-to-org management backend page
- Scope: app
- Pattern: backend page + CRUD
- Files: src/modules/cfp/backend/cfp/assignments/ (page.tsx + meta), api/post/assignments.ts, api/delete/assignments/[id].ts
- Delivers: Admin manages consultant-to-org assignments
- Depends on: Commit 2

## Commit 5: Organization-scoped data filtering interceptor
- Scope: app
- Pattern: API interceptor (before hook on list)
- Files: src/modules/cfp/api/interceptors.ts (modify)
- Delivers: Consultants only see CFP Events for assigned orgs — data isolation at API level
- Depends on: Commit 2

## Piotr Notes
- Almost entirely out-of-box OM patterns
- ~200 LOC total, ~25% custom
- PRM app has exact same pattern for partner auto-assignment — copy it
