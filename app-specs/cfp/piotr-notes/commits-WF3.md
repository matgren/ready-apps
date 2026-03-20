# Commit Plan: WF3 — Report Generation & Export

Total: 5 commits | Max gap: 3 | No upstream dependencies

## Commit 1: Report entity declaration + events
- Scope: app
- Pattern: ce.ts + events.ts
- Files: src/modules/cfp/ce.ts (modify), events.ts (modify)
- Delivers: Report CE declared, report events (generated, outdated) wired
- Depends on: WF1 Commit 1

## Commit 2: Report staleness subscriber
- Scope: app
- Pattern: persistent subscriber
- Files: src/modules/cfp/subscribers/mark-reports-outdated.ts
- Delivers: Reports auto-marked outdated when underlying data changes
- Depends on: Commit 1

## Commit 3: Report generation API route + worker
- Scope: app
- Pattern: custom POST route + queue worker
- Files: src/modules/cfp/api/post/reports/generate.ts, workers/generate-report-pdf.ts, lib/report-compiler.ts, lib/report-pdf-template.ts, data/validators.ts (modify)
- Delivers: Consultant triggers report, PDF generated async via worker, stored on Report entity
- Depends on: Commit 1, WF2 (data points must exist)
- Note: Requires npm dependency: @react-pdf/renderer. ESRS export NOT implemented (deferred).

## Commit 4: Report download on portal
- Scope: app
- Pattern: portal page + attachments file route
- Files: src/modules/cfp/frontend/portal/events/[eventId]/reports/page.tsx + meta
- Delivers: Event Manager/Viewer download PDF reports from portal
- Depends on: Commit 3, WF5 (portal auth)

## Commit 5: Report completeness dashboard widget
- Scope: app
- Pattern: dashboard widget
- Files: src/modules/cfp/widgets/dashboard/report-readiness/widget.ts, config.ts, api/get/report-readiness.ts
- Delivers: Consultant sees which CFP Events are ready for report generation
- Depends on: Commit 1, WF2 (confidence scoring)

## Piotr Notes
- PDF generation is NOT built into OM — biggest gap in the entire app
- Worker pattern is correct: enqueue job, generate async, store via attachments
- Report ~350 LOC total, ~60% custom (PDF template + report compiler)
- ESRS export deferred to Phase 2+ per Open Question #3
