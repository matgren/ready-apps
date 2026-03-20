# Commit Plan: WF2 — Data Collection & Evidence Upload

Total: 9 commits | Max gap: 2 | No upstream dependencies

## Commit 1: Domain events for CFP module
- Scope: app
- Pattern: events.ts declaration
- Files: src/modules/cfp/events.ts
- Delivers: Typed domain events for calculation cascade and stage changes
- Depends on: WF1 commits (CEs must exist)
- Note: Overlaps with WF1 Commit 1 — reconcile into single module scaffold commit

## Commit 2: Pipeline stage change interceptor — emit stage_changed event
- Scope: app
- Pattern: API interceptor (after hook)
- Files: src/modules/cfp/api/interceptors.ts
- Delivers: Domain event on stage transition, foundation for SEND_EMAIL
- Depends on: Commit 1

## Commit 3: Transition gate — data_collection to review validation
- Scope: app
- Pattern: API interceptor (before hook)
- Files: src/modules/cfp/api/interceptors.ts (extend)
- Delivers: Prevents premature transition, checks all required data points have values
- Depends on: Commit 2
- Note: Overlaps with WF1 Commit 7 — reconcile into single gate interceptor commit

## Commit 4: Data Point value change interceptor — trigger recalculation
- Scope: app
- Pattern: API interceptor (after hook)
- Files: src/modules/cfp/api/interceptors.ts (extend)
- Delivers: Auto-calculate result_co2e_kg on value change, emit domain event
- Depends on: Commit 1
- Note: Overlaps with WF1 Commit 4 — same interceptor

## Commit 5: Recalculation subscriber chain (3 levels)
- Scope: app
- Pattern: persistent event subscribers
- Files: src/modules/cfp/subscribers/recalc-emission-source.ts, recalc-cfp-event.ts, recalc-scenarios.ts
- Delivers: Full cascade: data point -> emission source -> CFP Event -> scenarios/reports
- Depends on: Commit 4
- Note: Overlaps with WF1 Commit 5 — same subscribers

## Commit 6: Evidence entity with attachment field
- Scope: app
- Pattern: ce.ts with attachment field
- Files: src/modules/cfp/ce.ts (extend)
- Delivers: Evidence CE with file attachment support
- Depends on: WF1 commits (Data Point CE must exist)

## Commit 7: Portal page — data point entry and evidence upload
- Scope: app
- Pattern: portal frontend page + custom API route
- Files: src/modules/cfp/frontend/events/page.tsx, [id]/data/page.tsx, api/post/portal/evidence.ts, api/get/portal/evidence.ts
- Delivers: Event managers enter data point values and upload evidence on portal
- Depends on: Commit 6, WF5 (portal auth)
- Note: Custom portal evidence upload route needed — built-in attachments API is staff-gated

## Commit 8: SEND_EMAIL workflow — notify client on data_collection stage
- Scope: app
- Pattern: workflow definition JSON + setup.ts seed
- Files: src/modules/cfp/workflows/data-collection-notification.json, setup.ts (extend)
- Delivers: Auto-email to client when CFP Event enters data_collection
- Depends on: Commit 2

## Commit 9: Completeness dashboard widget for consultant
- Scope: app
- Pattern: widget injection
- Files: src/modules/cfp/widgets/injection/completeness/widget.ts, widget.client.tsx, injection-table.ts, api/get/completeness.ts
- Delivers: At-a-glance data completeness and confidence per CFP Event
- Depends on: Commit 5, Commit 6

## Piotr Notes
- Portal evidence upload needs custom route (attachments API is staff-gated) — small gap, not a blocker
- WF2 commits 1-5 heavily overlap with WF1 commits 1,4,5,7 — must reconcile when building phase plan
- Recalculation subscribers must be idempotent (events may replay)
