# App Spec: CFP (Carbon Footprint Platform)

> App Spec is a business architecture document that sits above technical specs.
> It captures domain knowledge, validates cross-spec consistency, and ensures
> the app solves a real business problem using the platform correctly.
>
> This document is the SINGLE SOURCE OF TRUTH for what this app is, who it serves,
> and how it maps to Open Mercato. Technical specs are generated from this document.
> If a spec contradicts this document, this document wins.
>
> Each section has a checklist with owner (Mat or Piotr). Section is done when all checks pass.

---

## 1. Business Context `Mat`

### 1.1 Business Model

An Event Sustainability Platform that helps event organizers plan, measure, and report the carbon footprint of their events. The platform operates as a managed B2B SaaS: one operator (the sustainability consultancy) runs the backend, event organizers access via portal as clients.

**Revenue model:** SaaS subscription per event organizer organization + premium tier for audit-ready compliance reports. The "Sandwich" model: pre-event planning tool (SaaS) locks in the client, post-event audit-ready report (expert service) generates premium revenue.

**Who pays:** Event organizers, sustainability officers, and corporate event departments who need CSRD-compliant carbon footprint reports and want to optimize event sustainability during planning.

**Flywheel:**
```
Pre-event planning (scenario simulation) gets client in
    -> Data collection during event deepens data quality
        -> Post-event audit-ready report creates compliance dependency
            -> Report benchmarks inform next event planning
                -> Client returns for next event with historical baseline
                    -> More events = better benchmarks = more accurate estimates for new clients
```

#### Checklist
- [x] Paying customer identified -- event organizers and corporate sustainability officers pay for planning + compliance reports
- [x] Flywheel articulated -- planning -> data collection -> reporting -> benchmarking -> retention loop

### 1.2 Business Goals

**Primary goal:** Enable event organizers across the EU to produce audit-ready carbon footprint reports that satisfy CSRD requirements, while reducing event emissions through data-driven pre-event planning. Target: reduce time-to-report from weeks (manual) to hours (platform-assisted).

**Secondary goal (example app):** Demonstrate OM platform patterns for scientific calculation engines, tiered data precision models, and evidence-based audit trails -- domains beyond traditional CRM.

**What is NOT important:**
- Full Life Cycle Assessment (LCA) beyond CO2 equivalent (water, biodiversity, social impact) -- deferred to future
- Mobile app for on-site data collection -- web-only for now
- Formal software certifications (ISAE 3000, TUV methodology audit) -- business decision, not app scope
- Supplier self-service portal -- operator collects supplier data on behalf of clients
- Carbon offsetting marketplace or "Carbon Neutral" labels
- Real-time IoT sensor integration (smart meters, CT clamps)
- Multi-language i18n beyond EN -- single language for MVP

#### Checklist
- [x] Primary goal stated with measurable outcome
- [x] Scope exclusions listed -- what's out and why

### 1.3 Ubiquitous Language

> DDD: one term = one meaning everywhere. This glossary IS the ubiquitous language.

| Term | Definition | Source of data | Period |
|------|-----------|----------------|--------|
| CFP Event | A planned gathering (conference, fair, festival) with defined dates, location, and attendee count. The central aggregate in CFP. Named `cfp_event` to avoid collision with the DDD concept of "domain event." | Operator creates from client briefing | Per event occurrence |
| Emission Source | A category of CO2e-generating activity within a CFP Event (e.g., catering, transport, energy, waste). Each source has one or more Data Points. | Platform defines source categories; operator selects applicable ones per CFP Event | Per CFP Event |
| Data Point | A single measurable input within an emission source (e.g., "electricity consumption: 4,500 kWh"). Has a value, unit, data tier, and optional evidence. | Client provides via portal or operator enters from client data | Per CFP Event |
| Data Tier | The precision level of a Data Point: Estimate (generic proxy), Calculated (material-specific factor), or Actual (measured/invoiced). Higher tier = higher confidence. | System determines from data source type | Per data point |
| Confidence Score | A per-data-point and per-CFP-Event quality rating (High/Medium/Low) derived from the Data Tier of its inputs. Audit-readiness depends on aggregate confidence. For CFP Events with zero total CO2e (no data yet), confidence defaults to Low. | System-calculated from data tier distribution | Per CFP Event |
| Emission Factor | A scientific coefficient (kg CO2e per unit) used to convert a Data Point value into emissions. Sourced from ADEME, EPDs, or primary measurements. Immutable once used in a calculation -- updates create new factor records. | Emission factor database (seeded + operator-managed) | Updated per database version |
| Factor Import | The process of ingesting emission factors from external databases (ADEME Base Empreinte, Agribalyse, public EPDs) into the platform's Emission Factor entity. External data is validated and translated at the boundary: units normalized to kg CO2e, source tagged, country applicability mapped. | Admin triggers import from external source | Per database release |
| Evidence | A file (invoice, meter reading photo, delivery slip, weight ticket) uploaded to substantiate a Data Point. The auditor's proof. | Client uploads or operator attaches | Per data point |
| Scenario | A what-if configuration for a CFP Event. Contains one or more Scenario Overrides that modify base Data Point values or emission factor selections. Used in pre-event planning for comparison. | Operator or client creates from base CFP Event | Per CFP Event, multiple allowed |
| Scenario Override | A single modification within a Scenario: overrides either the value or the emission factor (or both) of a specific Data Point from the base CFP Event. The Scenario's total is recalculated from the base data plus all overrides. | Operator or client creates within a Scenario | Per Scenario |
| Report | A versioned output document: structured carbon footprint summary with per-source breakdown, scope classification, confidence scores, and methodology notes. Each generation creates a new version. Becomes stale if underlying data changes after generation. | System-generated from CFP Event data | Per CFP Event, versioned |
| Break-Even Point | The number of reuse cycles at which a reusable item's cumulative footprint (procurement + washing) equals the cumulative footprint of single-use alternatives. Formula: `N = procurement_co2e / (disposable_per_use_co2e - wash_cycle_co2e)`. If wash cost >= disposable cost, reusable never breaks even. | System-calculated from emission factors | Per item comparison |
| Scope 1 | Direct emissions from owned/controlled sources (e.g., on-site gas cooking, company vehicles). GHG Protocol classification. | Data points tagged by scope | Per CFP Event |
| Scope 2 | Indirect emissions from purchased energy (electricity, heating). GHG Protocol classification. | Data points tagged by scope | Per CFP Event |
| Scope 3 | All other indirect emissions in the value chain (catering supply chain, attendee travel, waste disposal). GHG Protocol classification. | Data points tagged by scope | Per CFP Event |
| Grid Mix | The CO2 intensity of the electricity grid at the event location (kg CO2e per kWh). Varies significantly by country (France: 0.052, Germany: 0.380). | Emission factor database, per country | Updated annually |
| CSRD | EU Corporate Sustainability Reporting Directive. Requires large companies to report environmental impact, including events, with independent third-party audit. | EU regulation | Ongoing compliance |
| ESRS | European Sustainability Reporting Standards. The format required for CSRD-compliant reports. CFP exports in this format. | EU standard | Per reporting period |

#### Checklist
- [x] Every domain term defined once
- [x] Same word = same meaning across all specs and conversations
- [x] Source of data and period specified per term

### 1.4 Domain Model

#### 1.4.1 Entities

**CFP Event** (central aggregate)

| Field | Type | Multi | Required | Notes |
|-------|------|-------|----------|-------|
| `name` | text | no | yes | e.g., "Tech Innovation Summit 2026" |
| `location_city` | text | no | yes | |
| `location_country` | select | no | yes | EU countries. Determines default grid mix (auto-select with manual override). |
| `start_date` | date | no | yes | |
| `end_date` | date | no | yes | |
| `attendee_count` | integer | no | yes | Min: 10, Max: 50,000 |
| `meals_per_day` | integer | no | no | Default: 3. Min: 0, Max: 5. |
| `event_type` | select | no | yes | conference, festival, fair, corporate, sports, other |
| `status` | pipeline | no | yes | See pipeline stages below |
| `total_co2e_kg` | float | no | no | System-calculated. Sum of all emission source totals. |
| `confidence_score` | select | no | no | System-calculated: high, medium, low. Defaults to low when total is zero. |
| `organization_id` | relation | no | yes | Owning client organization |

**Emission Source**

| Field | Type | Multi | Required | Notes |
|-------|------|-------|----------|-------|
| `cfp_event_id` | relation | no | yes | Parent CFP Event |
| `category` | select | no | yes | catering, transport, energy, waste, accommodation, materials |
| `ghg_scope` | select | no | yes | scope_1, scope_2, scope_3 |
| `subtotal_co2e_kg` | float | no | no | System-calculated. Sum of child data point results. |
| `notes` | text | no | no | Operator notes |

**Data Point**

| Field | Type | Multi | Required | Notes |
|-------|------|-------|----------|-------|
| `emission_source_id` | relation | no | yes | Parent emission source |
| `label` | text | no | yes | e.g., "Electricity consumption", "Plastic cups dispatched" |
| `value` | float | no | no | The measured/estimated quantity. Null until client provides it. |
| `unit` | select | no | yes | kWh, kg, km, liters, units, m2 |
| `emission_factor_id` | relation | no | yes | Which factor to apply |
| `factor_value_snapshot` | float | no | no | System-set: copies emission_factor.value_co2e at calculation time. Preserves audit trail if factor is later updated. |
| `data_tier` | select | no | yes | estimate, calculated, actual |
| `is_required` | boolean | no | yes | Default: true. Consultant can mark optional. Transition gate: all required data points must have values before moving to review. |
| `result_co2e_kg` | float | no | no | System-calculated: value * factor_value_snapshot |
| `confidence` | select | no | no | System-derived from data_tier: estimate=low, calculated=medium, actual=high |

**Evidence**

| Field | Type | Multi | Required | Notes |
|-------|------|-------|----------|-------|
| `data_point_id` | relation | no | yes | Parent data point |
| `file` | file | no | yes | Uploaded document (PDF, JPG, PNG) |
| `source_type` | select | no | yes | invoice, meter_reading, weight_ticket, delivery_slip, photo, other |
| `description` | text | no | no | Brief description of what the evidence proves |
| `uploaded_by` | relation | no | no | System-set to current user |
| `uploaded_at` | datetime | no | no | System-set |

**Emission Factor**

| Field | Type | Multi | Required | Notes |
|-------|------|-------|----------|-------|
| `name` | text | no | yes | e.g., "Plastic cup (PP), disposable" |
| `category` | select | no | yes | catering_disposable, catering_reusable, catering_operations, transport, energy, waste |
| `value_co2e` | float | no | yes | kg CO2e per unit |
| `unit` | select | no | yes | per_piece, per_kWh, per_kg, per_km, per_liter, per_cycle |
| `data_source` | select | no | yes | ademe, agribalyse, epd, primary_measurement, other |
| `data_source_ref` | text | no | no | Citation or EPD number |
| `applicable_country` | select | no | no | If country-specific (e.g., grid mix). Null = universal. |
| `is_active` | boolean | no | yes | Default: true. Allows soft-deprecation when new version imported. |
| `version` | integer | no | yes | Default: 1. Incremented when factor is superseded. New version = new record; old record soft-deprecated. |
| `supersedes_id` | relation | no | no | Points to the previous version of this factor. Null for first version. |

**Scenario**

| Field | Type | Multi | Required | Notes |
|-------|------|-------|----------|-------|
| `cfp_event_id` | relation | no | yes | Base CFP Event this scenario modifies |
| `name` | text | no | yes | e.g., "All reusable tableware" |
| `description` | text | no | no | What changed vs base CFP Event |
| `total_co2e_kg` | float | no | no | System-calculated: base event total with overrides applied |
| `delta_co2e_kg` | float | no | no | System-calculated: scenario total - base event total |
| `is_preferred` | boolean | no | no | Operator or Event Manager marks which scenario to implement |

**Scenario Override**

| Field | Type | Multi | Required | Notes |
|-------|------|-------|----------|-------|
| `scenario_id` | relation | no | yes | Parent scenario |
| `data_point_id` | relation | no | yes | Which base data point this overrides |
| `override_value` | float | no | no | Alternative value. Null = use base value. |
| `override_emission_factor_id` | relation | no | no | Alternative factor. Null = use base factor. |
| `override_result_co2e_kg` | float | no | no | System-calculated from override value/factor |

**Report**

| Field | Type | Multi | Required | Notes |
|-------|------|-------|----------|-------|
| `cfp_event_id` | relation | no | yes | Parent CFP Event |
| `version` | integer | no | yes | Auto-incremented per CFP Event. Starts at 1. |
| `generated_at` | datetime | no | yes | System-set on generation |
| `generated_by` | relation | no | yes | Consultant who triggered generation |
| `confidence_score` | select | no | yes | Snapshot of CFP Event confidence at generation time |
| `total_co2e_kg` | float | no | yes | Snapshot of CFP Event total at generation time |
| `file_pdf` | file | no | no | Generated PDF report |
| `file_esrs` | file | no | no | Generated ESRS export (if applicable) |
| `status` | select | no | yes | current, outdated. System marks as outdated if underlying data changes after generation. |
| `methodology_notes` | text | no | no | Auto-generated: data sources used, factors applied, confidence breakdown |

#### 1.4.2 CFP Event Pipeline

| Stage | Meaning | Who acts | Transition trigger |
|-------|---------|----------|--------------------|
| `planning` | CFP Event created, scenarios being explored | Operator + Client | Operator marks plan complete |
| `data_collection` | Collecting actual data points and evidence | Client (uploads) + Operator (reviews) | Consultant manually transitions after reviewing completeness |
| `review` | Operator reviews results, checks confidence, requests missing evidence | Operator | Operator approves |
| `audit_ready` | Report finalized, exportable | Operator | Terminal stage |

**Transition gates (checked at transition, not enforced transactionally):**
- `planning` -> `data_collection`: CFP Event must have at least one Emission Source
- `data_collection` -> `review`: All Data Points where `is_required = true` must have a value
- `review` -> `audit_ready`: Every Data Point with `data_tier = actual` must have at least one Evidence attachment. At least one Report must exist with `status = current`.

#### 1.4.3 Domain Rules & Invariants

**Calculation rules:**
- `data_point.factor_value_snapshot = emission_factor.value_co2e` (copied at calculation time)
- `data_point.result_co2e_kg = data_point.value * data_point.factor_value_snapshot`
- `emission_source.subtotal_co2e_kg = SUM(child data_points.result_co2e_kg)`
- `cfp_event.total_co2e_kg = SUM(child emission_sources.subtotal_co2e_kg)`
- All calculations in kg CO2e, rounded to 3 decimal places
- Calculations are live: recalculated on every data point value or factor change via domain events

**Domain events (calculation cascade):**
- `cfp.data_point.value_updated` -> recalculate `result_co2e_kg`, emit `cfp.data_point.result_recalculated`
- `cfp.data_point.result_recalculated` -> recalculate parent `emission_source.subtotal_co2e_kg`, emit `cfp.emission_source.subtotal_changed`
- `cfp.emission_source.subtotal_changed` -> recalculate parent `cfp_event.total_co2e_kg` and `confidence_score`, emit `cfp.cfp_event.total_changed`
- `cfp.cfp_event.total_changed` -> recalculate all child Scenario totals and deltas; mark any Report with `status = current` as `outdated`
- `cfp.cfp_event.stage_changed` -> if entering `data_collection`, send notification to client (OM workflow SEND_EMAIL)

**Confidence scoring:**
- Data Point confidence: estimate = low, calculated = medium, actual = high
- CFP Event confidence score = weighted by emission magnitude:
  - If total_co2e_kg = 0 (no data yet) -> low
  - If >80% of total CO2e comes from "actual" tier data points -> high
  - If >80% comes from "actual" or "calculated" -> medium
  - Otherwise -> low

**Break-even calculation:**
- `N = reusable_procurement_co2e / (disposable_per_use_co2e - wash_cycle_co2e)`
- If `disposable_per_use_co2e <= wash_cycle_co2e` -> reusable never breaks even. System returns "No break-even: washing cost exceeds disposable cost."
- Displayed as part of WF1 scenario comparison output

**Invariants:**
- A Data Point must reference an active Emission Factor (`is_active = true`)
- Emission Factor `value_co2e` must be > 0
- CFP Event `attendee_count` must be >= 10
- Scenario always references a base CFP Event; deleting the CFP Event cascade-deletes its Scenarios
- Scenario Override must reference a Data Point that belongs to the Scenario's parent CFP Event
- `result_co2e_kg` and `factor_value_snapshot` are system-calculated -- never user-editable
- Report `version` is auto-incremented per CFP Event -- not user-editable
- Emission Factor updates do NOT retroactively recalculate existing Data Points. The `factor_value_snapshot` preserves the value used at calculation time. New Data Points use the latest active factor.

**Data ownership:**
- Operator (User) creates CFP Events, Emission Sources, Scenarios, manages Emission Factors, triggers Report generation, reviews and approves
- Client (CustomerUser) provides Data Point values, uploads Evidence, views Scenarios, marks preferred Scenario, downloads Reports
- System calculates all `*_co2e_kg` fields, `factor_value_snapshot`, confidence scores, and report versioning -- never user-editable

**Consultant-to-Organization assignment:**
- The Consultant who creates a client organization is automatically assigned to it
- Admin can reassign or add additional Consultants to an organization
- A Consultant can only see and manage CFP Events for their assigned organizations

#### Checklist
- [x] Domain entities identified with clear ownership
- [x] Domain rules documented -- invariants, constraints, calculations
- [x] Access control rules documented -- who sees/does what, cross-org visibility
- [x] Data ownership per entity -- who creates, who reads, who updates, system vs user
- [x] Entity fields defined precisely -- every field has key, type, multi, required

---

## 2. Identity Model `Mat`

| Persona | Role key | Identity | Org scope | Sees | Does |
|---------|----------|----------|-----------|------|------|
| Platform Admin | `admin` | User | All orgs | Everything | Manage emission factor database, manage organizations, assign consultants, system config |
| Sustainability Consultant | `consultant` | User | Assigned orgs | CFP Events, data, reports for assigned client orgs | Create CFP Events, define emission sources, review data, approve reports, run scenarios, manage EPD/primary factors |
| Event Manager | `event_manager` | CustomerUser | Own org | Own org's CFP Events, data points, scenarios, reports | Input data point values, upload evidence, view scenarios, mark preferred scenario, download reports |
| Event Viewer | `event_viewer` | CustomerUser | Own org | Own org's CFP Events and reports (read-only) | View CFP Events, view reports, download exports |

**Portal decision:** USED. Event managers and viewers access the portal to input data, upload evidence, and download reports. They do not need backend CRM access -- they need a focused, clean interface for data entry and report viewing.

**Decision log:**
- **Platform Admin** -> User: needs full backend access to manage emission factor database, org assignments, and system configuration. No org scoping restriction.
- **Sustainability Consultant** -> User: needs backend CRM-style access to manage multiple client orgs, create CFP Events, review data quality, approve reports. Scoped to assigned orgs. Assignment created automatically when consultant creates the org, reassignable by admin.
- **Event Manager** -> CustomerUser: needs portal access to enter data and upload evidence for their own organization's CFP Events. Does NOT need to see other clients or manage emission factors. Portal is the right fit. Has explicit `mark_preferred` permission on Scenario entity.
- **Event Viewer** -> CustomerUser: read-only portal access for sustainability officers or CFOs who consume reports but don't enter data. Same portal, restricted permissions.

#### Checklist
- [x] Every persona has ONE identity type -- User or CustomerUser, no "maybe both" `Mat`
- [x] Identity decision justified per persona -- what modules they need drives the choice `Mat`
- [x] No persona has two accounts `Piotr`
- [x] Org scoping defined per role -- who sees which orgs, read-only vs read-write `Piotr`
- [x] Portal usage justified `Mat`

---

## 3. Workflows `Mat`

### WF1: CFP Event Planning & Scenario Simulation

**Journey:** Consultant creates CFP Event -> defines emission sources -> enters estimate-tier data points -> runs scenarios (disposable vs reusable, transport options) -> system calculates break-even points for reusable vs disposable comparisons -> client reviews scenarios and break-even analysis on portal -> preferred scenario marked -> planning complete

**ROI:** Event organizers make data-driven procurement decisions before spending. Target: identify 15-30% CO2e reduction opportunities per event through scenario comparison. Break-even analysis prevents wrong reusable-vs-disposable decisions.

**Key personas:** Consultant (creates, configures), Event Manager (reviews scenarios, marks preference)

**Boundaries:**
- Starts when: Consultant creates a new CFP Event from client briefing
- Ends when: Preferred scenario is marked and CFP Event moves to `data_collection` stage
- NOT this workflow: actual data collection (WF2), report generation (WF3)

**Edge cases:**
1. Client changes event parameters after scenarios are built (attendee count changes) -> all scenarios recalculate automatically via domain events -> risk: stale scenario comparisons if recalc fails
2. No meaningful difference between scenarios (all within 5% margin) -> system flags "scenarios are equivalent" -> risk: client expects clear winner, gets ambiguity
3. Emission factor not available for a specific item -> consultant uses nearest proxy and marks data_tier as "estimate" -> risk: confidence score drops, audit readiness affected
4. Client never reviews scenarios -> CFP Event stays in `planning` -> risk: data collection deadline missed
5. Break-even calculation yields "reusable never breaks even" -> system displays clear warning explaining why (wash cost exceeds disposable cost for this grid mix) -> risk: client confused if warning not clear

**OM readiness (per step):**

| Step | OM Module | Gap? | Notes |
|------|-----------|------|-------|
| Create CFP Event | Custom entity + pipeline | No | Standard CE with pipeline stages |
| Define emission sources | Custom entity | No | Child CE linked to CFP Event |
| Enter data points | Custom entity + portal | Small | CE with portal form. Calculation trigger needs interceptor. |
| Run scenarios | Custom logic | Medium | Scenario + ScenarioOverride entities + delta calculation = custom API route |
| Calculate break-even | Custom logic | Small | Formula is simple; display as part of scenario comparison |
| Client reviews on portal | Portal page | Small | Dedicated portal page (not widget injection — simpler and more appropriate) |
| Mark preferred | Portal action | Small | Custom action on Scenario entity, explicit event_manager permission |

---

### WF2: Data Collection & Evidence Upload

**Journey:** CFP Event moves to data_collection -> system sends notification to client (domain event -> SEND_EMAIL) -> consultant marks which data points are required vs optional -> client enters actual values on portal -> client uploads evidence (invoices, meter readings) -> system recalculates with actual data (live via domain events) -> confidence score updates -> consultant reviews completeness

**ROI:** Shift from estimate-tier to actual-tier data. Each data point upgraded to "actual" with evidence increases audit-readiness. Target: 80%+ of CO2e covered by actual-tier data = "high confidence" CFP Event.

**Key personas:** Consultant (defines requirements, reviews completeness), Event Manager (enters data, uploads evidence)

**Boundaries:**
- Starts when: CFP Event transitions to `data_collection` stage
- Ends when: Consultant is satisfied with data completeness and manually transitions CFP Event to `review` stage
- NOT this workflow: planning/scenarios (WF1), report generation (WF3)

**Edge cases:**
1. Client cannot provide actual data for a source (lost invoice) -> data point stays at estimate/calculated tier -> risk: confidence score stays low, report flagged
2. Client uploads wrong evidence (invoice for different event) -> consultant rejects during review -> risk: audit trail contamination if not caught
3. Partial data collection -- some sources have actuals, others estimates -> system handles mixed tiers gracefully -> risk: misleading total if estimate portion is large
4. Client organization has multiple CFP Events in data_collection simultaneously -> portal must clearly separate events -> risk: data entered against wrong event

**OM readiness (per step):**

| Step | OM Module | Gap? | Notes |
|------|-----------|------|-------|
| Transition to data_collection | Pipeline transition | No | Standard pipeline |
| Notify client | Workflows / email | Small | Domain event `cfp.cfp_event.stage_changed` triggers OM workflow SEND_EMAIL |
| Mark required/optional | Custom field on Data Point | No | `is_required` boolean, consultant toggles |
| Client enters values | Portal + CE | No | CustomerUser edits data point values |
| Upload evidence | Portal + file upload | Small | Evidence entity with file attachment |
| System recalculates | API interceptor + events | Medium | Domain event cascade: data_point -> emission_source -> cfp_event |
| Consultant reviews | Backend + dashboard | Small | Dashboard widget showing completeness/confidence per CFP Event |

**Transition gate:** `data_collection` -> `review` requires all Data Points with `is_required = true` to have a value. Consultant triggers transition manually.

---

### WF3: Report Generation & Export

**Journey:** Consultant reviews CFP Event data -> confirms confidence score meets threshold -> triggers report generation -> system compiles per-source breakdown, scope classification, methodology notes -> Report entity created (versioned) -> report available on portal -> client downloads PDF -> CFP Event moves to audit_ready

**ROI:** Reduce time-to-report from weeks of manual spreadsheet work to hours. Audit-ready format means the external auditor can verify in 1 hour instead of 1 week. Target: 4x faster report delivery vs manual process.

**Key personas:** Consultant (triggers generation, reviews), Event Manager (downloads), Event Viewer (downloads)

**Boundaries:**
- Starts when: Consultant is satisfied with data completeness and triggers report
- Ends when: CFP Event reaches `audit_ready` stage and report is downloadable
- NOT this workflow: data entry (WF2), planning (WF1), the actual external audit (out of platform scope)

**Edge cases:**
1. Report generated with low confidence score -> consultant can still generate but report carries visible "Low Confidence" warning -> risk: client submits low-quality report to auditor
2. Data point values change after report is generated -> domain event marks Report as `status = outdated` -> risk: client uses outdated report if they don't notice
3. Multiple report versions for same event (data updated, re-generated) -> Report.version auto-increments, previous versions stay accessible but marked outdated -> risk: confusion about which version is current
4. Consultant re-generates report after fixing data -> new version created, old version archived -> previous version still downloadable for audit trail

**OM readiness (per step):**

| Step | OM Module | Gap? | Notes |
|------|-----------|------|-------|
| Review completeness | Dashboard widget | Small | Widget showing data tier distribution and confidence |
| Trigger report | Custom API route | Medium | Report compilation logic is custom |
| Compile breakdown | Custom logic | Medium | Aggregation by source, scope, methodology -- custom. Snapshots totals and confidence. |
| Create Report entity | Custom entity | No | Report CE with version, status, file fields |
| Portal download | Portal + file | Small | Generated PDF available as downloadable file on Report entity |
| ESRS export | Custom logic | Large | ESRS format mapping is domain-specific. Deferred -- see Open Question #3. |

---

### WF4: Emission Factor Management

**Journey:** Admin seeds initial emission factors from ADEME/Agribalyse via Factor Import -> consultant adds EPD-sourced factors for specific items -> consultant adds primary measurement factors -> factors are versioned (new version = new record, old record soft-deprecated) -> factors available for use in all CFP Events

**ROI:** The emission factor database IS the scientific foundation. Accuracy of every calculation depends on factor quality. Primary measurement factors are the competitive moat -- data no competitor has.

**Key personas:** Platform Admin (seeds database, manages lifecycle, runs Factor Imports), Consultant (adds EPD and primary factors)

**Boundaries:**
- Starts when: Platform is initialized (seed) or consultant encounters a missing factor
- Ends when: Factor is active and available for use
- NOT this workflow: using factors in calculations (WF1/WF2), factor methodology validation (out of scope)

**Edge cases:**
1. Factor value needs updating -> admin/consultant creates new Emission Factor record with `supersedes_id` pointing to old record, old record `is_active = false` -> existing Data Points retain their `factor_value_snapshot` (no retroactive recalculation) -> new Data Points use new factor -> risk: none, audit trail preserved
2. Duplicate factors created (same item, different sources) -> system allows it, consultant chooses appropriate one per data point -> risk: confusion, need clear naming convention
3. Country-specific factor vs universal factor -> system auto-selects country-specific when CFP Event country matches, with manual override -> risk: wrong factor applied if mapping incomplete
4. ADEME updates their database -> admin runs Factor Import, new factors created, old factors soft-deprecated via `supersedes_id` chain -> risk: in-progress CFP Events unaffected (snapshots preserved)

**OM readiness (per step):**

| Step | OM Module | Gap? | Notes |
|------|-----------|------|-------|
| Seed initial factors | setup.ts seedDefaults | No | Standard seed pattern |
| Factor Import from ADEME | Custom API route | Medium | Import logic: validate, normalize units, tag source, create records |
| CRUD factors | Custom entity + backend | No | Standard CE with backend CRUD |
| Version chain | Relation field | No | `supersedes_id` self-reference on Emission Factor |
| Soft-deprecate | Boolean field + filter | No | `is_active` flag |

---

### WF5: Client Onboarding

**Journey:** Consultant creates client organization -> consultant is auto-assigned to the org -> invites Event Manager by email -> Event Manager sets password -> Event Manager sees portal dashboard with their CFP Events -> first CFP Event created

**ROI:** Time from "new client signs contract" to "first CFP Event in planning" should be < 1 hour. Frictionless onboarding = faster time-to-value.

**Key personas:** Consultant (onboards), Event Manager (activates account), Admin (can reassign consultants)

**Boundaries:**
- Starts when: New client contract signed
- Ends when: Event Manager can log into portal and see their first CFP Event
- NOT this workflow: CFP Event planning (WF1), data collection (WF2)

**Edge cases:**
1. Event Manager doesn't activate account within 7 days -> reminder email -> risk: client churns before seeing value
2. Organization needs multiple Event Managers -> consultant invites additional users -> risk: permission confusion if roles not clear
3. Client organization already exists (returning client) -> consultant adds new CFP Event to existing org -> risk: duplicate org creation
4. Consultant leaves or is reassigned -> admin reassigns org to different consultant -> risk: data continuity if not documented

**OM readiness (per step):**

| Step | OM Module | Gap? | Notes |
|------|-----------|------|-------|
| Create organization | Customers module | No | Standard OM customer/org creation |
| Auto-assign consultant | API interceptor | Small | On org creation, assign creating consultant |
| Invite by email | CustomerUser + email | No | Standard OM portal invitation |
| Set password | Portal auth | No | Standard OM portal auth |
| Portal dashboard | Dashboard widgets | Small | Custom widgets for CFP Event list + status |
| Create first CFP Event | WF1 | No | Flows into WF1 |

#### Checklist (per workflow)
- [x] End-to-end journey -- first touchpoint to value delivery, no gaps `Mat`
- [x] Measurable ROI -- specific metric that moves `Mat`
- [x] Boundaries -- explicit start, end, and NOT-this-workflow `Mat`
- [x] 3-5 edge cases -- high probability production scenarios `Mat`
- [x] Every step mapped to OM module `Piotr` -- verified in Piotr Checkpoint #1

#### Checklist (overall)
- [x] 5 core workflows defined `Mat`
- [x] No workflow requires >200 lines of custom code `Piotr` -- WF3 is highest at ~350 LOC total (~210 custom), rest under 200

---

## 4. Workflow Gap Analysis `Piotr`

> Piotr Checkpoint #1 complete (2026-03-20). Commit plans saved to `app-specs/cfp/piotr-notes/commits-WF*.md`.

### Gap Scoring — Atomic Commits (Ralph Loop)

| Score | Meaning |
|-------|---------|
| 0 | Platform does it, zero commits |
| 1 | 1 commit: config/seed only |
| 2 | 1-2 commits: small gap |
| 3 | 2-3 commits: medium gap |
| 4 | 3-5 commits: large gap |
| 5 | 5+ commits or external dependency |

### Per-Workflow Gap Matrix

#### WF1: CFP Event Planning & Scenario Simulation — Total: 9 atomic commits

| Step | OM Module | Gap | Scope | Commits | Notes |
|------|-----------|-----|-------|---------|-------|
| Scaffold module | ce.ts + acl.ts + events.ts + index.ts | 1 | app | 1 | Standard module scaffold |
| Seed roles, pipeline, dictionaries, factors | setup.ts seedDefaults | 1 | app | 1 | Standard seed pattern |
| Custom field definitions | setup.ts ensureCustomFieldDefinitions | 1 | app | 1 | All entity fields |
| Data point calculation interceptor | API interceptor | 2 | app | 1 | Snapshot factor, compute result |
| Cascading recalculation subscribers | Persistent subscribers | 2 | app | 1 | 3-level cascade via domain events |
| Scenario comparison + break-even | Custom API route | 3 | app | 1 | Comparison logic + break-even formula |
| Pipeline transition gates | API interceptor | 2 | app | 1 | Gate checks per stage transition |
| Portal scenario review pages | Portal frontend | 2 | app | 1 | Portal pages (not widget injection) |
| Seed example data | setup.ts seedExamples | 1 | app | 1 | Demo CFP Event with scenarios |

#### WF2: Data Collection & Evidence Upload — Total: 9 atomic commits

| Step | OM Module | Gap | Scope | Commits | Notes |
|------|-----------|-----|-------|---------|-------|
| Domain events declaration | events.ts | 1 | app | 1 | Overlaps WF1 Commit 1 |
| Stage change interceptor | API interceptor | 1 | app | 1 | Emit stage_changed event |
| Transition gate (data_collection -> review) | API interceptor | 1 | app | 1 | Overlaps WF1 Commit 7 |
| Data point recalculation interceptor | API interceptor | 2 | app | 1 | Overlaps WF1 Commit 4 |
| Recalculation subscriber chain | Persistent subscribers | 2 | app | 1 | Overlaps WF1 Commit 5 |
| Evidence entity + attachment | ce.ts + attachment field | 1 | app | 1 | OM attachment pattern |
| Portal data entry + evidence upload | Portal page + custom API | 2 | app | 1 | Custom evidence upload route (attachments API is staff-gated) |
| SEND_EMAIL notification | Workflow JSON + setup.ts | 1 | app | 1 | OM workflow SEND_EMAIL pattern |
| Completeness dashboard widget | Widget injection | 1 | app | 1 | Standard widget pattern |

#### WF3: Report Generation & Export — Total: 5 atomic commits

| Step | OM Module | Gap | Scope | Commits | Notes |
|------|-----------|-----|-------|---------|-------|
| Report entity + events | ce.ts + events.ts | 1 | app | 1 | Standard CE |
| Report staleness subscriber | Persistent subscriber | 1 | app | 1 | Mark outdated on data change |
| Report generation + PDF worker | Custom API + queue worker | 3 | app | 1 | Requires @react-pdf/renderer npm dep. Biggest gap. |
| Portal report download | Portal page | 1 | app | 1 | Attachments file route |
| Report readiness dashboard widget | Dashboard widget | 1 | app | 1 | Standard widget |

#### WF4: Emission Factor Management — Total: 5 atomic commits

| Step | OM Module | Gap | Scope | Commits | Notes |
|------|-----------|-----|-------|---------|-------|
| Emission Factor entity + ACL | ce.ts + acl.ts | 1 | app | 1 | Overlaps WF1 Commit 1 |
| Seed default factors | setup.ts seedDefaults | 1 | app | 1 | ~50-80 ADEME factors. Overlaps WF1 Commit 2. |
| Factor CRUD backend pages | Backend pages | 1 | app | 1 | Copy customers pattern |
| Factor versioning interceptor | API interceptor | 2 | app | 1 | Supersede + soft-deprecate |
| Factor Import API route | Custom POST route | 2 | app | 1 | Bulk import with Zod validation |

#### WF5: Client Onboarding — Total: 5 atomic commits

| Step | OM Module | Gap | Scope | Commits | Notes |
|------|-----------|-----|-------|---------|-------|
| Seed customer roles | setup.ts defaultCustomerRoleFeatures | 0 | app | 1 | OM cross-module feature merging |
| Consultant auto-assignment | API interceptor | 1 | app | 1 | PRM has exact same pattern |
| Portal dashboard | Portal page | 1 | app | 1 | CFP Event list for client org |
| Consultant-org management page | Backend page + CRUD | 1 | app | 1 | Admin manages assignments |
| Org-scoped data filtering | API interceptor | 1 | app | 1 | query.ids rewrite pattern |

### Gap Summary

| Workflow | Business Priority | Raw Commits | Overlaps | Effective Commits | Max Gap | Blocks ROI? |
|----------|------------------|-------------|----------|-------------------|---------|-------------|
| WF1: Planning & Scenarios | HIGH | 9 | -- | 9 | 3 | No |
| WF2: Data Collection | HIGH | 9 | 5 (with WF1) | 4 unique | 2 | No |
| WF3: Report Generation | HIGH | 5 | -- | 5 | 3 | No (PDF dep) |
| WF4: Factor Management | MEDIUM | 5 | 2 (with WF1) | 3 unique | 2 | No |
| WF5: Client Onboarding | HIGH | 5 | -- | 5 | 1 | No |

**Total raw commits: 33. After reconciling overlaps: ~26 unique commits.**
**No upstream dependencies. All commits are `app` scope.**
**One external dependency: `@react-pdf/renderer` npm package for PDF generation.**

### Piotr Corrections to App Spec

1. WF1 "Client reviews on portal" should be "Portal page" not "Widget injection" -- portal page is simpler and more appropriate for standalone scenario comparison
2. Break-even gap is Small (2), not Medium -- it's a pure function with 3 inputs
3. WF4 Factor Import gap is Small (2), not Medium -- standard POST route with Zod validation
4. WF2 portal evidence upload requires custom API route because OM attachments API is staff-gated -- small gap, architecturally correct
5. WF2/WF4 commits heavily overlap with WF1 -- must reconcile when building phase plan (module scaffold, seeds, interceptors, subscribers are shared)

#### Checklist
- [x] Every workflow step scored in atomic commits `Mat`
- [x] Piotr checkpoint: workflow-to-OM mapping verified -- no module missed, no overengineering, commit plans saved `Piotr`

---

## 4.5 Module Architecture `Piotr`

> Consolidated view of which OM modules CFP uses, how it extends them, and what new modules it creates.

### OM Core modules used

| Module | Usage | Extension points used | Notes |
|--------|-------|----------------------|-------|
| `customers` | as-is | -- | Client organizations. No custom fields on company entity -- org data is standard. |
| `customer_accounts` | extend | `defaultCustomerRoleFeatures` in setup.ts | Portal auth for event_manager, event_viewer roles |
| `entities` | extend | Custom entities via `ce.ts`, custom fields via setup.ts | 8 CEs: cfp_event, emission_source, data_point, evidence, emission_factor, scenario, scenario_override, report |
| `workflows` | extend | Workflow JSON seed | SEND_EMAIL on data_collection stage transition |
| `attachments` | extend | Custom portal upload route (workaround: attachments API is staff-gated) | Evidence file storage. Portal users get scoped upload via custom route, not direct attachments API. |
| `auth` | as-is | -- | User management for admin, consultant roles. No customization. |

### Official modules (existing or proposed)

| Module | Status | Usage | Extension points | Rationale |
|--------|--------|-------|-----------------|-----------|
| `portal-attachments` | PROPOSED | create | Portal-facing upload/download routes scoped by CustomerUser org | Attachments API is staff-gated (`attachments.manage`). Every app that needs portal file uploads will hit this. Generic solution: portal-scoped attachment routes with entity-level ACL. CFP workaround: custom route in app module. |
| `report-generator` | PROPOSED (deferred) | create | Worker pattern: enqueue job, generate PDF, store via attachments | PDF generation from structured entity data is reusable (invoices, quotes, reports). Current CFP approach: app-level worker with @react-pdf/renderer. Evaluate after CFP ships -- if pattern proves stable, extract to official module. |

### App modules

| Module | Responsibility | Entities owned | Notes |
|--------|---------------|----------------|-------|
| `cfp` | All CFP domain logic: event planning, scenario simulation, data collection, evidence management, emission factor database, report generation, calculation cascade | cfp_event, emission_source, data_point, evidence, emission_factor, scenario, scenario_override, report | Single module -- all entities share invariants (org scoping, calculation cascade, confidence scoring, pipeline gates). Emission factors are reference data managed within the same module. |

#### Checklist
- [x] Every OM core module listed with explicit usage type and extension points `Piotr`
- [x] Every official module listed -- 2 proposed with rationale (portal-attachments, report-generator) `Piotr`
- [x] Every gap scored `official-module` or `core-module` in section 4 has upstream investigation -- portal-attachments is a known gap, report-generator deferred `Piotr`
- [x] Reusability check: portal file uploads and PDF generation identified as reusable patterns, proposed as official modules `Piotr`
- [x] Proposed official modules have clear boundary -- portal-attachments = org-scoped file access, report-generator = entity-to-PDF pipeline. No CFP domain logic leaked. `Piotr`
- [x] App module count justified -- 1 module (`cfp`). All entities share calculation cascade, confidence scoring, and pipeline gate invariants. Splitting would break transactional consistency. `Piotr`
- [x] Extension points to official modules documented -- same UMES patterns as core `Piotr`
- [x] No direct modification of core or official module code -- all extensions via UMES. portal-attachments workaround is app-level custom route until official module exists. `Mat + Piotr`
- [x] Module boundaries align with bounded context boundaries -- cfp is one bounded context: event carbon footprint lifecycle from planning through audit-ready reporting. Emission factors are reference data within the same context (they only exist to serve CFP calculations). `Vernon`

---

## 5. User Stories `Mat`

> Pending completion of Piotr checkpoint #1 and gap analysis.

#### Checklist
- [ ] Every story has: persona + action + measurable outcome + success criteria
- [ ] Every story traces to a workflow step
- [ ] Identity checkpoint per story
- [ ] No weak stories

---

## 6. User Story Gap Analysis `Piotr`

> Pending user stories (section 5).

#### Checklist
- [ ] Every story mapped to specific OM module/mechanism `Mat`
- [ ] Piotr checkpoint: story-to-OM mapping verified `Piotr`

---

## 7. Phasing & Rollout `Mat`

> Pending gap analysis (sections 4 and 6).

#### Checklist
- [ ] Phases ordered by: business priority x gap score x blocker status
- [ ] Each phase delivers complete, usable increment
- [ ] Acceptance criteria per phase: Vernon + Mat

---

## 8. Cross-Spec Conflicts `Mat`

> N/A -- first app spec, no cross-spec conflicts yet.

#### Checklist
- [ ] N/A for initial spec

---

## 9. Example App Quality Gate `Piotr`

**Platform patterns to demonstrate:**
- Custom entity with pipeline stages and transition gates
- Portal access for CustomerUsers with role-based data entry and explicit action permissions
- API interceptors for calculation triggers (data point change -> domain event cascade)
- Domain event chain: entity change -> recalculate -> propagate -> notify
- Dashboard widgets with domain-specific KPIs (confidence score, CO2e totals)
- File upload/evidence pattern on custom entities
- Emission factor database as managed, versioned reference data (seedDefaults + Factor Import + operator CRUD)
- Scenario comparison pattern (base + override delta model)
- Report generation with versioning and staleness detection
- Consultant-to-org auto-assignment pattern

**Anti-patterns to avoid:**
- Building a standalone calculator disconnected from OM entity model
- Custom state machine instead of OM pipeline
- Hardcoding emission factors in code instead of managed entity data
- Building a custom portal instead of using OM CustomerUser portal
- Custom notification system instead of OM workflows SEND_EMAIL
- Cross-module ORM relationships
- Retroactive recalculation of historical data (use factor_value_snapshot instead)
- Leaving scaffold boilerplate modules (`example/`, empty dirs) from `create-mercato-app` in the app
- Leaving unused modules from `create-mercato-app` template in `modules.ts` -- only register modules listed in §4.5 Module Architecture. Remove corresponding imports from `layout.tsx` (e.g., AiAssistant, third-party analytics scripts)

#### Checklist
- [ ] Every piece of new code passes the "copy test"
- [ ] Anti-patterns explicitly listed
- [ ] Platform features demonstrated

---

## 10. Open Questions `Mat`

| # | Question | Options | Impact | Owner | Status |
|---|----------|---------|--------|-------|--------|
| 1 | How should emission factors be updated when ADEME releases new version? | A) Manual re-import by admin via Factor Import. B) Automated sync API. | Option A is simpler for MVP. Factor Import process is defined in glossary. | Mat | DECIDED: A |
| 2 | Should scenarios support modifying emission sources (add/remove) or only data point values/factors? | A) Value/factor overrides only via ScenarioOverride (simpler). B) Full source add/remove (more powerful). | Value/factor override is sufficient for tableware comparison. Full source manipulation deferred. | Mat | DECIDED: A |
| 3 | ESRS export format -- is this a hard requirement for Phase 1 or can it be deferred? | A) Phase 1 (compliance-driven clients need it immediately). B) Phase 2+ (start with PDF-only). | ESRS mapping is the largest gap. Deferring significantly reduces Phase 1 scope. | Mat | DECIDED: B (PDF only for Phase 1) |
| 4 | Should retroactive recalculation be supported when emission factors are updated? | A) No -- factor_value_snapshot preserves audit trail. B) Yes -- with versioning. | Option A chosen. Snapshot model preserves integrity. New Data Points use latest factor. | Mat | DECIDED: A |
| 5 | Grid mix factor -- should it auto-select based on event country or always be manually chosen? | A) Auto-select with manual override. B) Manual only. | Auto-select is better UX. Needs maintained country-to-factor mapping in seed data. | Mat | DECIDED: A |

#### Checklist
- [x] Every question has: options, impact, owner, status
- [x] No BLOCKER question unresolved -- all 5 questions decided

---

## Production Readiness `Mat`

> Assessed after phasing is complete.

| Workflow | Deployable | Blocker | What client would say |
|----------|-----------|---------|----------------------|
| WF1: Planning & Scenarios | TBD | TBD | TBD |
| WF2: Data Collection | TBD | TBD | TBD |
| WF3: Report Generation | TBD | TBD | TBD |
| WF4: Factor Management | TBD | TBD | TBD |
| WF5: Client Onboarding | TBD | TBD | TBD |

#### Checklist
- [ ] Each workflow assessed: deployable or not
- [ ] "What would client say?" test
- [ ] No workflow stops midway

---

## Changelog

### 2026-03-20
- Initial App Spec created: Phase 0 (Business Context, Domain Model) and Phase 1 (Workflows) complete
- Identity model defined: 4 personas (admin, consultant, event_manager, event_viewer)
- 5 workflows defined: Planning, Data Collection, Reporting, Factor Management, Onboarding
- Vernon Challenger review (round 1): 6 critical + 12 warning findings across Sections 1-3
- All findings addressed:
  - RENAMED: "Event" -> "CFP Event" (`cfp_event`) to avoid domain event collision (C1)
  - ADDED: ScenarioOverride entity for scenario delta model (C2)
  - FIXED: Break-even formula + "never breaks even" edge case (C3)
  - DROPPED: `calculation` pipeline stage -- calculations are live via domain events (C4/W5)
  - FIXED: WF2 end condition -- consultant manually transitions, no auto-trigger (C5)
  - ADDED: `is_required` on Data Point for transition gate (C6)
  - ADDED: Report entity with version, status, file fields (W2)
  - ADDED: `factor_value_snapshot` on Data Point for audit trail integrity (W4)
  - ADDED: Emission Factor versioning via `version` + `supersedes_id` (W4)
  - ADDED: Domain events for calculation cascade (W2)
  - ADDED: Factor Import glossary entry (W6)
  - ADDED: Confidence score default for zero-total events (W3)
  - ADDED: Consultant-to-org auto-assignment mechanism (W5)
  - ADDED: Break-even in WF1 steps + edge case (W6)
  - ADDED: Event Manager `mark_preferred` explicit permission (W4)
  - DECIDED: Open Questions 1, 2, 4, 5 resolved
