# Challenger Review: Identity Model + Workflows (Sections 2-3)

**Reviewer:** Vaughn Vernon (DDD)
**Date:** 2026-03-20
**Status:** All findings addressed

## CRITICAL

### C4. "Calculation" pipeline stage is orphaned
No workflow owns the `calculation` stage. No defined trigger out of it. Events would get stuck.
**Resolution:** Dropped `calculation` stage (merged with W5 from Section 1 review). Calculations are live.

### C5. WF2 end condition contradicts pipeline
WF2 said "consultant triggers recalculation" but pipeline said "auto after data collection complete." Two different triggers.
**Resolution:** Fixed: WF2 ends when consultant manually transitions to `review`. No auto-transition. Consultant is the quality gate.

### C6. "Required data points" is undefined
Transition depends on "all required data points have values" but no `is_required` field exists.
**Resolution:** Added `is_required` boolean to Data Point (default: true). Consultant can mark optional. Transition gate enforces.

## WARNING

### W1. Scenario internals undefined (duplicate of C2)
Scenario has no child entities to store modifications.
**Resolution:** Already addressed by ScenarioOverride entity from Section 1 review.

### W2. Report entity missing from domain model
Glossary mentioned Report as "versioned" but no entity definition existed.
**Resolution:** Added Report entity with `version`, `generated_at`, `generated_by`, `confidence_score` (snapshot), `total_co2e_kg` (snapshot), `file_pdf`, `file_esrs`, `status` (current/outdated), `methodology_notes`.

### W3. WF1/WF2 share recalculation logic
Both workflows trigger the same calculation cascade but treat it differently.
**Resolution:** Documented calculation as a shared domain event cascade, not per-workflow. Same events fire regardless of which workflow context.

### W4. Event Manager "mark preferred" permission ambiguous
Identity model said "view scenarios" but WF1 requires "mark preferred" (write action).
**Resolution:** Added explicit `mark_preferred` permission for `event_manager` role in identity model decision log.

### W5. Consultant-to-org assignment has no mechanism
"Assigned orgs" scope defined but no workflow covers how assignment happens.
**Resolution:** Creating consultant is auto-assigned. Admin can reassign. Documented in Domain Rules section and WF5.

### W6. Break-Even Point is in glossary but no workflow uses it
Orphaned glossary term with formula but no user-facing delivery path.
**Resolution:** Added to WF1 as scenario comparison output. Added edge case for "never breaks even."

## OK

- O1: Identity model persona-to-role mapping is sound
- O2: Workflow boundaries are explicit and non-overlapping
- O3: GHG Protocol terminology used correctly
- O4: Confidence scoring is well-defined and testable
- O5: WF4 (Factor Management) correctly separated from calculation workflows
