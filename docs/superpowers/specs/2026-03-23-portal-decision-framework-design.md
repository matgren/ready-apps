# Portal Decision Framework — Design Spec

| Field   | Value |
|---------|-------|
| Date    | 2026-03-23 |
| Status  | Approved |
| Origin  | Analysis of HackOn hackathon spec (comerito/om-hackathon-starter SPEC-001) vs app-spec template |

## Problem

The app-spec template treats Portal as a binary checkbox ("USED / NOT USED") without a decision framework for WHEN Portal is the right choice. This led to:

1. **HackOn SPEC-001** chose Portal for all external personas, generating 15+ custom pages — without documenting why Portal was chosen or estimating the cost.
2. **PRM app spec** rejected Portal with good justification, but the reasoning lives in PRM's decision log, not in the template as reusable guidance.

The template needs to guide the Portal vs Backend decision so that:
- Portal is chosen when the identity model demands it (external personas, brand separation, different UX)
- Portal is NOT chosen when Backend + RBAC suffices (internal personas, CRM-grade UI acceptable)
- The cost of Portal (custom pages) is estimated early and feeds into gap analysis
- In agentic workflow, Portal custom pages are not a blocker — but the spec must be precise enough for agents to generate them

## Changes

### 1. Template §2 Identity Model

**Replace** the current one-liner Portal decision with:

- Decision tree: External? → Needs different UX than CRM? → Portal
- Two red flags (portal persona needing DataTable = reconsider; external User in backend = reconsider)
- Per-persona justification table (when Portal USED)
- Agentic cost note
- 3 new checklist items connecting to §3.5 and §4

**No criteria matrix** — decision tree is sufficient (Piotr feedback: matrix is redundant formalism).

### 2. Template §3.5 UI Architecture

**Add** "Portal Pages" subsection after Custom Pages:

- Per-page table: URL, role, purpose, actions, stage gate, OM pattern
- Minimal guidance: each page = atomic commits in §4, list SSE events, stage gates map to workflows
- No implementation detail (mobile-first, autosave = Krug review / implementation spec territory)
- 3 new checklist items

### 3. Mat Skill Phase 0

**Add** new point "4. Identity & Portal Decision" after Domain Model:

- 3 questions: who is external, backend CRM or dedicated UX, rough page count
- Red flags to challenge (both directions)
- Does NOT duplicate decision tree from template — instructs Mat to fill §2

### 4. Mat Skill Phase 2

**Expand** identity checkpoint with portal-aware validation:

- Portal story → portal page must exist in §3.5
- Missing page → add to §3.5 before writing story
- Multiple portal personas → shared pages or separate? (affects commit count)

### 5. Piotr Skill Phase 2

**Add** portal challenge block after "Challenge the premise":

- Does each portal persona earn its cost?
- Could any be User with RBAC?
- Shared pages vs separate per role?

### 6. Piotr Skill Phase 4

**Add** step 5b in minimal solution ladder:

- Portal page as solution type (between UMES extension and n8n workflow)
- Estimate per page in gap analysis — no hardcoded defaults

### 7. Piotr Skill Red Flags

**Add** 2 rows:

- "15 custom portal pages" → does portal earn its cost?
- "External user in backend" → external = Portal, agent generates pages

## Files Modified

| File | Section | Change type |
|------|---------|-------------|
| `skills/templates/app-spec-template.md` | §2 Identity Model | Replace Portal decision block |
| `skills/templates/app-spec-template.md` | §3.5 UI Architecture | Add Portal Pages subsection + checklist items |
| `skills/mat/SKILL.md` | Phase 0 | Add point 4 |
| `skills/mat/SKILL.md` | Phase 2 | Expand identity checkpoint |
| `skills/piotr/SKILL.md` | Phase 2 | Add portal challenge |
| `skills/piotr/SKILL.md` | Phase 4 | Add step 5b |
| `skills/piotr/SKILL.md` | Red Flags | Add 2 rows |

## Out of Scope

- §9 Example App Quality Gate portal copy test — follow-up task
- Krug skill updates — portal UX review concerns handled via existing Krug review process
- Portal building blocks gap analysis (DataTable for portal, etc.) — platform roadmap, not app-spec template
