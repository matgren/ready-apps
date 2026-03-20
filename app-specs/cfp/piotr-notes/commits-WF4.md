# Commit Plan: WF4 — Emission Factor Management

Total: 5 commits | Max gap: 2 | No upstream dependencies

## Commit 1: Emission Factor entity declaration + ACL
- Scope: app
- Pattern: ce.ts + acl.ts
- Files: src/modules/cfp/ce.ts (modify), acl.ts (modify), setup.ts (modify)
- Delivers: Emission Factor CE registered, permissions declared
- Depends on: Module scaffold (WF1 Commit 1)
- Note: Overlaps with WF1 Commit 1 — reconcile into single scaffold commit

## Commit 2: Seed default emission factors
- Scope: app
- Pattern: setup.ts seedDefaults
- Files: src/modules/cfp/setup.ts (modify), data/seed-factors.ts
- Delivers: ~50-80 emission factors from ADEME Base Empreinte out of the box
- Depends on: Commit 1
- Note: Overlaps with WF1 Commit 2 — reconcile

## Commit 3: Emission Factor CRUD backend pages
- Scope: app
- Pattern: backend pages + makeCrudRoute (copy customers)
- Files: src/modules/cfp/backend/cfp/factors/ (page.tsx, create/page.tsx, [id]/page.tsx + metas)
- Delivers: Admin and Consultant browse, create, edit emission factors in backend
- Depends on: Commit 1

## Commit 4: Factor versioning (supersede + soft-deprecate)
- Scope: app
- Pattern: API interceptor (after hook on update)
- Files: src/modules/cfp/api/interceptors.ts (modify), events.ts (modify)
- Delivers: Non-destructive factor updates — old factor preserved, new factor created
- Depends on: Commit 1

## Commit 5: Factor Import API route
- Scope: app
- Pattern: custom POST route
- Files: src/modules/cfp/api/post/factors/import.ts, data/validators.ts (modify), lib/factor-normalizer.ts
- Delivers: Admin bulk-imports factors from ADEME/Agribalyse JSON export
- Depends on: Commit 1

## Piotr Notes
- WF4 Commits 1-2 overlap with WF1 Commits 1-2 — must reconcile
- Factor Import is simpler than spec suggested (gap 2, not "Medium")
- ~280 LOC total, ~30% custom
