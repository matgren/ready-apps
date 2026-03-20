# Challenger Review: Business Context + Domain Model (Section 1)

**Reviewer:** Vaughn Vernon (DDD)
**Date:** 2026-03-20
**Status:** All findings addressed

## CRITICAL

### C1. "Event" is an overloaded term
"Event" means both the domain entity and DDD domain events. Ambiguous in logs, code, conversation.
**Resolution:** Renamed to "CFP Event" (`cfp_event`). All references updated.

### C2. Scenario has no child data -- hollow shell
Scenario had totals but no mechanism to store what changed. No ScenarioDataPoint or override entity.
**Resolution:** Added `ScenarioOverride` entity with `override_value`, `override_emission_factor_id`, and `override_result_co2e_kg`.

### C3. Break-even formula is circular
Formula had N on both sides. Correct formula: `N = procurement / (disposable_per_use - wash_per_use)`. Unhandled edge case when denominator <= 0.
**Resolution:** Fixed formula. Added edge case: "reusable never breaks even" when wash cost >= disposable cost.

## WARNING

### W1. Cross-aggregate invariant spans 4 levels
Audit-ready invariant (Event -> Source -> DataPoint -> Evidence) is too deep for transactional enforcement.
**Resolution:** Reclassified as transition gate check, not hard invariant. Documented in pipeline transition gates section.

### W2. Calculation cascade has no explicit domain events
Recalculation chain (DataPoint -> Source -> Event -> Scenarios) was described as math but not as events.
**Resolution:** Added explicit domain events: `data_point.value_updated`, `data_point.result_recalculated`, `emission_source.subtotal_changed`, `cfp_event.total_changed`.

### W3. Confidence score divides by zero
When total_co2e_kg = 0, confidence formula has no defined behavior.
**Resolution:** Added rule: zero-total CFP Events default to "low" confidence.

### W4. Emission Factor lacks versioning
In-place updates to factor values would silently change historical calculations.
**Resolution:** Added `factor_value_snapshot` on Data Point (copies factor at calculation time). Added `version` and `supersedes_id` on Emission Factor for version chain. Old records soft-deprecated, new records created.

### W5. "Calculation" pipeline stage is vestigial
Calculations are live (on every data point change), making a dedicated stage meaningless.
**Resolution:** Dropped `calculation` stage. Pipeline: planning -> data_collection -> review -> audit_ready.

### W6. ADEME/EPD import process unnamed
No glossary entry or entity for the Factor Import boundary.
**Resolution:** Added "Factor Import" to glossary with validation/translation rules at boundary.

## OK

- OK1: Aggregate boundaries (Event -> Source -> DataPoint -> Evidence) are a clean composition hierarchy
- OK2: Three-tier data model (estimate/calculated/actual) maps well to consulting practice
- OK3: GHG Scope tagging on Emission Source (not Data Point) is correct
- OK4: Data ownership separation (Operator/Client/System) is well-defined
