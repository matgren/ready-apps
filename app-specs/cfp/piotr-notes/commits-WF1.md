# Commit Plan: WF1 — CFP Event Planning & Scenario Simulation

Total: 9 commits | Max gap: 3 | No upstream dependencies

## Commit 1: Scaffold CFP module — metadata, ACL, events, CE declarations
- Scope: app
- Pattern: setup.ts + ce.ts + acl.ts + events.ts + index.ts
- Files: src/modules/cfp/index.ts, acl.ts, events.ts, ce.ts
- Delivers: Module auto-discovered, features declarable, events typed, all CEs declared
- Depends on: none

## Commit 2: Seed roles, pipeline stages, dictionaries, and initial emission factors
- Scope: app
- Pattern: setup.ts seed
- Files: src/modules/cfp/setup.ts, data/constants.ts
- Delivers: Fresh tenant has pipeline (planning->data_collection->review->audit_ready), dictionaries, emission factors, role permissions
- Depends on: Commit 1

## Commit 3: Custom field definitions for all CFP entities
- Scope: app
- Pattern: setup.ts seed (ensureCustomFieldDefinitions)
- Files: src/modules/cfp/data/custom-fields.ts, setup.ts (modify)
- Delivers: All entity fields defined, CRUD forms auto-render
- Depends on: Commit 2

## Commit 4: Data Point calculation interceptor — snapshot factor, compute result_co2e_kg
- Scope: app
- Pattern: interceptor
- Files: src/modules/cfp/api/interceptors.ts, interceptors.test.ts
- Delivers: Data point value/factor change auto-calculates result, snapshots factor value
- Depends on: Commit 3

## Commit 5: Cascading recalculation subscribers — source subtotal, event total, confidence
- Scope: app
- Pattern: subscriber (event-driven)
- Files: src/modules/cfp/subscribers/recalc-source-subtotal.ts, recalc-event-total.ts, recalc-scenarios.ts, lib/calculations.ts, lib/calculations.test.ts
- Delivers: Full cascade: data point -> emission source -> CFP Event total + confidence -> scenarios
- Depends on: Commit 4

## Commit 6: Scenario comparison API route + break-even calculation
- Scope: app
- Pattern: custom API route
- Files: src/modules/cfp/api/get/scenario-comparison.ts, api/post/mark-preferred.ts, lib/break-even.ts, lib/break-even.test.ts
- Delivers: Side-by-side comparison with deltas, break-even analysis, mark preferred action
- Depends on: Commit 5

## Commit 7: Pipeline transition gate interceptor
- Scope: app
- Pattern: interceptor
- Files: src/modules/cfp/api/interceptors.ts (modify), interceptors.test.ts (modify)
- Delivers: Validated stage transitions with gate checks (sources exist, required data filled, evidence attached)
- Depends on: Commit 4

## Commit 8: Portal pages — scenario review and mark-preferred action
- Scope: app
- Pattern: portal frontend pages
- Files: src/modules/cfp/frontend/cfp-events/page.tsx, [id]/page.tsx, [id]/scenarios/page.tsx + meta files, src/i18n/en.json
- Delivers: Event Manager sees CFP Events, reviews scenarios with break-even, marks preferred
- Depends on: Commit 6

## Commit 9: Seed example data — demo CFP Event with scenarios
- Scope: app
- Pattern: setup.ts seed (seedExamples)
- Files: src/modules/cfp/setup.ts (modify)
- Delivers: Demo CFP Event with emission sources, data points, and scenarios for testing
- Depends on: Commit 3

## Piotr Notes
- Spec said "widget injection" for scenario comparison on portal — should be "portal page" (simpler, more appropriate)
- Break-even gap is Small (2), not Medium as spec stated — it's a pure function with 3 inputs
- Portal auth and customer_accounts are OM core — no CFP-specific work needed for login
