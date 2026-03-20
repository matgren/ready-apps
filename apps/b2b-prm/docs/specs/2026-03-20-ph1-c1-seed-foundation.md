# Phase 1, Commit 1: Seed Foundation — Roles, ACL, Dictionaries, Pipeline Stages, Company Profile Fields, WIP Custom Field

## Source
- App Spec sections: §1.3, §1.4, §2, §7 Phase 1
- User stories: US-1.2 (partial — company profile fields), US-2.2 (partial — pipeline stages + wip_registered_at)
- Commit plans: commits-WF1.md Commit 1 + commits-WF2.md Commits 1–3 (merged — overlapping setup.ts scope)

> **Commit count note:** App Spec §7 states "3 atomic commits" for Phase 1. We split into 5 for cleaner implementation boundaries: C1 (all seedDefaults), C2 (case study entity), C3 (interceptor), C4 (widget + API), C5 (seedExamples). The 3 logical deliverables (setup, WIP stamp, KPI widget) map to these 5 atomic commits.

## What This Delivers
After this commit, the PRM module exists with all 4 roles (partnership_manager, partner_admin, partner_member, partner_contributor) properly gated by ACL features, 6 dictionaries seeded for company profile taxonomy, a PRM-specific 7-stage pipeline (New → Contacted → Qualified → SQL → Proposal → Won → Lost), 13 company profile custom fields on the company entity, and the `wip_registered_at` datetime custom field on deals. No interceptor logic yet — just the data model foundation.

## Acceptance Criteria
From App Spec §7 Phase 1 (Vernon domain criteria):
- [ ] Every Deal has non-null `organization_id` matching BD's org at creation time
- [ ] Company records scoped to BD's org — no cross-org CRM data leaks
- [ ] BD cannot create or modify `wip_registered_at` directly — only the API interceptor writes it (field seeded here; interceptor in Commit 3)

From App Spec §7 Phase 1 (Mat business criteria):
- [ ] PM can onboard an agency (share link → Admin creates account → fills profile) — profile fields available after this commit

## Files
| File | Action | Purpose |
|------|--------|---------|
| `src/modules/prm/index.ts` | Create | Module metadata (name, title, version, description) |
| `src/modules/prm/acl.ts` | Create | Feature declarations: `prm.manage`, `prm.widgets.wip-count`, plus re-export of customers features for role mapping |
| `src/modules/prm/setup.ts` | Create | `defaultRoleFeatures` for 4 roles + `seedDefaults` calling dictionary seeder, pipeline seeder, and custom field seeder |
| `src/modules/prm/data/custom-fields.ts` | Create | Constants: `COMPANY_PROFILE_FIELDSETS`, `COMPANY_PROFILE_FIELDS` (13 cf.* definitions), `DEAL_CUSTOM_FIELDS` (wip_registered_at cf.dateTime) |
| `src/modules/prm/data/dictionaries.ts` | Create | Constants: 6 dictionary definitions (services, industries, tech_capabilities, compliance_tags, regions, languages) with initial values |
| `src/modules/prm/data/pipeline.ts` | Create | Constants: `PRM_PIPELINE_STAGES` array (7 stages with order + key), `SQL_STAGE_KEY = 'sql'` threshold constant |
| `src/i18n/en.json` | Create/Modify | i18n keys for `prm.*` labels (module title, feature names, field labels, dictionary labels) |

## OM Patterns Used
- **Module setup.ts** — `ModuleSetupConfig` with `defaultRoleFeatures` + `seedDefaults`
  - Reference: `packages/core/src/modules/customers/setup.ts`
- **ACL features** — declarative feature array with `{ id, title, module }`
  - Reference: `packages/core/src/modules/customers/acl.ts`
- **Custom fields DSL** — `defineFields()`, `cf.text()`, `cf.select()`, `cf.multiline()`, `cf.dateTime()`, `cf.integer()`, `cf.boolean()`, `cf.url()`
  - Reference: `packages/core/src/modules/catalog/seed/examples.ts` (defineFields pattern)
  - Reference: `packages/core/src/modules/resources/lib/resourceCustomFields.ts` (cf.* helpers)
- **Dictionary seeding** — `em.upsert()` on dictionary entities (idempotent)
  - Reference: `packages/core/src/modules/customers/cli.ts` → `seedCustomerDictionaries()`
- **Pipeline seeding** — create `CustomerPipeline` + `CustomerPipelineStage` entries via em
  - Reference: `packages/core/src/modules/customers/cli.ts` → `seedDefaultPipeline()`

## Implementation Notes

### Roles and Feature Mapping
From App Spec §2 Identity Model:

```
partnership_manager:  prm.manage, prm.widgets.wip-count,
                      customers.people.view, customers.companies.view,
                      customers.deals.view, customers.pipelines.view
                      (read-only CRM — NO manage features)

partner_admin:        prm.widgets.wip-count,
                      customers.people.view, customers.people.manage,
                      customers.companies.view, customers.companies.manage,
                      customers.deals.view, customers.deals.manage,
                      customers.pipelines.view
                      (full CRM write within own org)

partner_member (BD):  prm.widgets.wip-count,
                      customers.people.view, customers.people.manage,
                      customers.companies.view, customers.companies.manage,
                      customers.deals.view, customers.deals.manage,
                      customers.pipelines.view
                      (same CRM access as admin — org scoping limits to own records via platform)

partner_contributor:  (no CRM features — WIC only, added in Phase 2)
```

### Pipeline Stages
The PRM pipeline replaces the default customers pipeline. Seed with guard: skip if pipeline named "PRM Pipeline" already exists (idempotent).

| Order | Stage | Key |
|-------|-------|-----|
| 0 | New | `new` |
| 1 | Contacted | `contacted` |
| 2 | Qualified | `qualified` |
| 3 | SQL | `sql` |
| 4 | Proposal | `proposal` |
| 5 | Won | `won` |
| 6 | Lost | `lost` |

Export `SQL_STAGE_KEY = 'sql'` as module constant — used by interceptor (Commit 3) to identify SQL stage by its key value, not order index or label string. Key-based lookup is more robust than order index if stages are ever reordered or inserted.

### Company Profile Custom Fields (13 fields)
Seeded on entity `customers:customer` (company kind) via `ensureCustomFieldDefinitions`:
- `positioning_summary` (multiline), `services` (dictionary, multi), `industries` (dictionary, multi), `tech_capabilities` (dictionary, multi)
- `delivery_models` (select, multi), `compliance_tags` (dictionary, multi)
- `team_size_bucket` (select), `min_project_size_bucket` (select), `hourly_rate_bucket` (select, hidden)
- `regions` (dictionary, multi, hidden), `languages` (dictionary, multi, hidden)
- `clutch_url` (text, hidden), `profile_confidence` (integer, hidden)

### wip_registered_at Custom Field
Seeded on entity `customers:deal` via `ensureCustomFieldDefinitions`:
- `wip_registered_at` (dateTime, nullable, `formEditable: false`, `listVisible: true`, `filterable: true`)
- Hidden from CRM forms (BD cannot write directly). Visible in deal list for PM.

## Verification
```bash
yarn generate          # Regenerate module files after adding prm module
yarn typecheck         # Must pass — no type errors
yarn build             # Must pass
yarn initialize        # seedDefaults runs — verify:
                       #   1. Roles exist with correct feature grants
                       #   2. 6 dictionaries seeded with values
                       #   3. PRM Pipeline with 7 stages exists
                       #   4. 13 company profile custom fields exist
                       #   5. wip_registered_at custom field on deals exists
```
