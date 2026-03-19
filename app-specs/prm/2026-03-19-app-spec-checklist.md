# App Spec — Definition of Done

> Derived from PRM session 2026-03-19. Every item maps to a real failure we hit or a real save we made.

## How to use

Score each item: PASS / FAIL / N/A. An App Spec is ready for implementation when:
- Zero FAILs in "Foundation" (section 1-3)
- Zero FAILs in "Workflows" (section 4)
- Max 2 FAILs in "Quality Gates" (section 5-6), with justification

If Foundation has any FAIL — stop. Fix it before touching workflows or specs.

---

## 1. Business Context

> Failure mode: specs written without knowing who pays and why. Result: features nobody needs.

- [ ] **1.1 Paying customer identified.** Not "users benefit" — who writes the check? What do they get?
  - _PRM lesson: "OM sells through agencies" was never stated in any spec. We had to ask "kto jest klientem?"_

- [ ] **1.2 Flywheel articulated.** The reinforcing loop that makes the system more valuable over time.
  - _PRM lesson: agencies contribute (WIC) + sell (WIP/MIN) -> higher tier -> more leads -> more sales. This flywheel was implicit, never written down._

- [ ] **1.3 KPIs defined with formulas.** Each KPI has: source data, calculation rule, period, who owns the input.
  - _PRM lesson: "WIP" meant different things in different specs — "conversations logged" vs "deals in SQL stage". Formula wasn't pinned._

- [ ] **1.4 Tier/reward structure documented** (if applicable). What thresholds, what benefits per level.
  - _PRM lesson: 4 real tiers existed in business docs, but spec had 3 (bronze/silver/gold). Mismatch caught late._

## 2. Identity Model

> Failure mode: wrong identity type = entire codebase rebuilt. This is the single most expensive mistake.

- [ ] **2.1 Every persona has ONE identity type.** User (auth/backend) or CustomerUser (portal). No "maybe both".
  - _PRM lesson: spent 40 min debating User vs CustomerUser for agency BD. Answer was obvious once we asked "does BD need CRM?" — yes -> User. But SPEC-053c had already built 570 lines of portal code on the wrong answer._

- [ ] **2.2 Identity decision justified per persona.** For each persona: what modules do they need? Does that require backend or portal?
  - _PRM lesson: "CustomerUser enables self-registration" was tempting, but BD needs CRM = backend = User. Convenience of one feature doesn't justify wrong identity type._

- [ ] **2.3 No persona has two accounts.** If someone would need both User and CustomerUser, the model is wrong.
  - _PRM lesson: "BD registers via portal (CustomerUser) then gets promoted to User" = two accounts, two passwords. Mat called it: "to glupie"._

- [ ] **2.4 Org scoping defined per role.** Who sees which organizations? What's read-only vs read-write?
  - _PRM lesson: PM needs to see all agency CRM data read-only. Platform has `organizationsJson: null` for this. Discovered late — should be in identity model from day 1._

- [ ] **2.5 Portal usage justified or explicitly rejected.** If no persona needs portal, say so. Don't build it "just in case".
  - _PRM lesson: zero personas needed portal. But SPEC-053c built portal pages. Delete 570 lines._

## 3. Cross-Spec Consistency

> Failure mode: specs written in isolation contradict each other. Nobody checks the seams.

- [ ] **3.1 All related specs listed.** Every spec that touches this app, with what it contributes.
  - _PRM lesson: SPEC-053, 053a, 053b, 053c, 060, 068 — six specs, never cross-checked._

- [ ] **3.2 Identity model consistent across specs.** No spec says CustomerUser while another assumes User for the same persona.
  - _PRM lesson: SPEC-053c said CustomerUser. SPEC-053b said "BD creates deals in CRM" (requires User). Direct contradiction, never caught._

- [ ] **3.3 Terminology consistent.** Same word means same thing everywhere. If "WIP" means "deals in SQL stage", every spec uses that definition.
  - _PRM lesson: "staff user" appeared in Claude's responses — not an OM term. Mat caught it: "czemu uzywasz terminu staff user?"_

- [ ] **3.4 Shared entities owned by one spec.** If two specs reference PartnerAgency, one is the owner, the other references it.

## 4. Workflows

> Failure mode: user stories without business context are features without purpose.

- [ ] **4.1 3-7 core workflows defined.** Too few = missing something. Too many = decompose further.
  - _PRM lesson: 5 workflows (onboarding, WIP, WIC, RFP, tier governance). Each traces to ROI._

- [ ] **4.2 Each workflow has end-to-end journey.** First touchpoint to value delivery. No gaps where "someone does something".
  - _PRM lesson: "Agency onboards" originally skipped the sub-workflow of admin filling profile + case studies + inviting BD. Without that, onboarding "completes" but agency is non-functional._

- [ ] **4.3 Each workflow has measurable ROI.** Not "agencies benefit" — specific metric that moves.
  - _PRM lesson: "Each active agency generates avg 5 WIP/month = 5 new prospects" vs vague "OM benefits from pipeline"._

- [ ] **4.4 Each workflow has boundaries.** Explicit start trigger, end condition, and what's NOT this workflow.
  - _PRM lesson: "BD adding deals" — is that onboarding or pipeline building? Answer: first deal = onboarding WF1, subsequent deals = WF2. Without boundary, overlap causes confusion._

- [ ] **4.5 Each workflow has 3-5 edge cases.** High probability production scenarios. Not exotic "what if earthquake".
  - _PRM lesson: "BD creates 15 fake deals to inflate WIP" — real gaming scenario. "Admin leaves agency" — real org management gap._

- [ ] **4.6 Each workflow step mapped to OM module.** Step-by-step: does platform handle it? If not, it's a gap.
  - _PRM lesson: "BD creates deal in CRM" = customers module (done). "System counts WIP" = scheduled job (~30 lines, gap). Precision matters._

- [ ] **4.7 No workflow requires more than ~200 lines of new code.** If it does, you missed a platform capability or the workflow is too complex for one app.
  - _PRM lesson: SPEC-053c had ~570 lines of portal code. Red flag: platform already handles this with backend RBAC._

## 5. Production Readiness

> Failure mode: demo that looks good in presentation but client can't actually use it.

- [ ] **5.1 Each workflow assessed: deployable or not.** Binary answer with specific blocker.
  - _PRM lesson: "Agency Onboarding = No, blocker: no invitation flow". Honest assessment, not "partially ready"._

- [ ] **5.2 "What would client say?" test.** For each gap: what's the client's actual complaint?
  - _PRM lesson: "How do I invite an agency?" is more useful than "invitation flow missing" — it forces you to think from user's perspective._

- [ ] **5.3 No workflow stops midway.** If a workflow can start but can't complete end-to-end, it's worse than not existing — it creates frustration.

## 6. Example App Quality (if applicable)

> Failure mode: example app teaches bad patterns that get copied to dozens of projects.

- [ ] **6.1 Every piece of new code passes the "copy test".** "If someone copies this pattern, will they build ON the platform or AROUND it?"
  - _PRM lesson: portal pages for backend users = around. RBAC roles for access control = on. Custom RFP routes = around. Workflows module for RFP = on._

- [ ] **6.2 Anti-patterns explicitly listed.** What we're NOT doing and why.
  - _PRM lesson: "NOT building portal pages, NOT building custom notification subscribers, NOT building custom state machines"._

- [ ] **6.3 Platform features demonstrated.** The app showcases what the platform can do, not what custom code can do.
  - _PRM lesson: target list: RBAC, CRM, workflows, widget injection, org switcher, pipeline stages, custom entities. All platform features._

---

## Scoring Template

| # | Check | Status | Evidence/Notes |
|---|-------|--------|----------------|
| 1.1 | Paying customer identified | | |
| 1.2 | Flywheel articulated | | |
| 1.3 | KPIs with formulas | | |
| 1.4 | Tier/reward structure | | |
| 2.1 | One identity type per persona | | |
| 2.2 | Identity decisions justified | | |
| 2.3 | No dual accounts | | |
| 2.4 | Org scoping per role | | |
| 2.5 | Portal justified or rejected | | |
| 3.1 | All related specs listed | | |
| 3.2 | Identity model consistent | | |
| 3.3 | Terminology consistent | | |
| 3.4 | Shared entity ownership | | |
| 4.1 | 3-7 workflows | | |
| 4.2 | End-to-end journeys | | |
| 4.3 | Measurable ROI | | |
| 4.4 | Workflow boundaries | | |
| 4.5 | Edge cases | | |
| 4.6 | Steps mapped to OM | | |
| 4.7 | <200 lines per workflow | | |
| 5.1 | Deployable assessment | | |
| 5.2 | Client complaint test | | |
| 5.3 | No midway stops | | |
| 6.1 | Copy test | | |
| 6.2 | Anti-patterns listed | | |
| 6.3 | Platform features demonstrated | | |
