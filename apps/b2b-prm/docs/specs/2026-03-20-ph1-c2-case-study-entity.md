# Phase 1, Commit 2: Case Study Custom Entity (21 Fields, Minimum Required Validation)

## Source
- App Spec sections: §1.4.2 (Case Study field definitions), §1.4.3 (minimum required fields)
- User stories: US-1.3
- Commit plan: commits-WF1.md, Commit 2

## What This Delivers
After this commit, Agency Admins can create case studies documenting past projects. Each case study captures technology stack, industry, budget, and duration — data used later for RFP matching (Phase 3). The entity enforces minimum required fields (title, industry, technologies, budget_bucket, duration_bucket) at creation time. Case studies are scoped to the agency's organization.

## Acceptance Criteria
From App Spec §7 Phase 1 (Vernon domain criteria):
- [ ] Case study requires minimum fields: `title`, at least one `industry`, at least one `technologies`, `budget_bucket`, `duration_bucket` — partial saves rejected at entity level

From App Spec §7 Phase 1 (Mat business criteria):
- [ ] PM can onboard an agency (share link → Admin creates account → fills profile → adds case study) — case study creation available after this commit

## Files
| File | Action | Purpose |
|------|--------|---------|
| `src/modules/prm/setup.ts` | Modify | Extend `seedDefaults` to seed case study custom entity definition with 19 fields |
| `src/modules/prm/data/custom-fields.ts` | Modify | Add `CASE_STUDY_FIELDSETS` and `CASE_STUDY_FIELDS` constants (19 cf.* definitions with required validation) |
| `src/modules/prm/ce.ts` | Create | Custom entity declaration: `prm:case_study` with labelField `title` |
| `src/i18n/en.json` | Modify | Add i18n keys for case study field labels and fieldset names |

## OM Patterns Used
- **Custom entity declaration (ce.ts)** — `CustomEntitySpec[]` with entity ID, label, labelField
  - Reference: `packages/core/src/modules/customers/ce.ts`
- **Custom fields DSL** — `defineFields()` with `cf.text()`, `cf.multiline()`, `cf.select()`, `cf.integer()`, `cf.float()`, `cf.boolean()`, `cf.url()`, `defineLink()`
  - Reference: `packages/core/src/modules/catalog/seed/examples.ts`
- **Entities module CRUD** — case study records created/read/updated via standard `POST /api/entities/records` — zero custom CRUD code needed

## Implementation Notes

### Case Study Fields (21 total)
> App Spec §1.4.2 header says "19 fields" but the actual field list contains 21 entries (includes `is_public_reference` and `completed_year`). We seed all 21.
From App Spec §1.4.2:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | text | Yes | labelField |
| `summary` | multiline | No | |
| `provider_company` | link to company | No | |
| `provider_company_name` | text | No | |
| `technologies` | dictionary, multi | Yes | Uses `tech_capabilities` dictionary |
| `industry` | dictionary, multi | Yes | Uses `industries` dictionary |
| `project_type` | select | No | |
| `duration_bucket` | select | Yes | Options: <3mo, 3-6mo, 6-12mo, 12mo+ |
| `duration_weeks` | integer | No | |
| `budget_known` | boolean | No | |
| `budget_bucket` | select | Yes | Options: <50k, 50-150k, 150-500k, 500k+ |
| `budget_min_usd` | float | No | |
| `budget_max_usd` | float | No | |
| `delivery_models` | select, multi | No | |
| `compliance_tags` | dictionary, multi | No | Uses `compliance_tags` dictionary |
| `outcome_kpis` | multiline | No | |
| `source_url` | url | No | |
| `related_deals` | link to deals | No | |
| `confidence_score` | integer | No | hidden |
| `is_public_reference` | boolean | No | |
| `completed_year` | integer | No | |

### Required Field Validation
The entities module handles required field validation when `required: true` is set on the field definition. No custom validation code needed — the platform rejects records missing required fields with a 422 response.

### Org Scoping
Case studies are org-scoped via the entities module's built-in `organization_id` on records. Agency users see only their org's case studies. PM sees all via Program Scope.

## Verification
```bash
yarn generate          # Regenerate module files (ce.ts added)
yarn typecheck         # Must pass
yarn build             # Must pass
# Manual: POST /api/entities/records with entity type prm:case_study
#   - Without required fields → 422
#   - With all required fields → 201, record scoped to org
```
