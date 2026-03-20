# Phase 1, Commit 5: seedExamples — Phase 1 Demo Data

## Source
- App Spec sections: §7 Phase 1 (seedExamples block)
- User stories: US-7.2 (partial — Phase 1 data only)
- Commit plan: commits-WF1.md, Commit 5

## What This Delivers
After this commit, running `yarn initialize` populates the app with realistic demo data exercising all Phase 1 features: 3 demo agencies with company profiles and case studies, a PM user, BD/Admin/Contributor users per agency, and deals at various pipeline stages — some with `wip_registered_at` stamps, some not yet at SQL. A developer can immediately see working dashboards, CRM with deals, and WIP counts without manual setup.

## Acceptance Criteria
From App Spec §7 Phase 1 (Mat business criteria):
- [ ] PM can onboard an agency — demo agencies already onboarded with full profiles
- [ ] BD can log a deal and move it to SQL → demo deals demonstrate this pattern
- [ ] PM can switch between agencies and see each agency's CRM data (read-only) and WIP count

From App Spec US-7.2:
- [ ] `seedExamples` populates: 3 demo agencies with company profiles + case studies, demo BD users with deals, all data clearly labeled as demo

## Files
| File | Action | Purpose |
|------|--------|---------|
| `src/modules/prm/setup.ts` | Modify | Add `seedExamples` function with Phase 1 demo data |
| `src/modules/prm/data/examples.ts` | Create | Demo data constants: agencies, users, company profiles, case studies, deals |

## OM Patterns Used
- **seedExamples hook** — `ModuleSetupConfig.seedExamples` with idempotency guard
  - Reference: `packages/core/src/modules/customers/setup.ts` → seedExamples
  - Reference: `packages/core/src/modules/customers/cli.ts` → seedExamples implementation
- **Idempotency** — check if demo data already exists before seeding (return `false` if already seeded)

## Implementation Notes

### Demo Data Shape
From App Spec §7 Phase 1 seedExamples block:

**3 Demo Agencies (Organizations):**
| Agency | Vertical | Profile Focus |
|--------|----------|--------------|
| Acme Digital (Demo) | E-commerce, SaaS | Full-stack web development |
| GreenTech Solutions (Demo) | Renewable Energy, IoT | IoT platforms, energy management |
| HealthBridge AI (Demo) | Healthcare, AI | AI/ML healthcare solutions |

**Users per Agency:**
| Role | Count | Naming |
|------|-------|--------|
| partner_admin | 1 | admin@acme-demo.com, etc. |
| partner_member (BD) | 1 | bd@acme-demo.com, etc. |
| partner_contributor | 1 | dev@acme-demo.com, etc. |

**PM User:**
- 1 `partnership_manager` user: pm@open-mercato-demo.com
- Program Scope (organizationsJson: null) — sees all agencies

**Company Profiles (per agency):**
- All 13 custom fields populated with realistic data matching the agency's vertical
- Dictionaries used: services, industries, tech_capabilities, compliance_tags

**Case Studies (2-3 per agency):**
- All 5 required fields filled (title, industry, technologies, budget_bucket, duration_bucket)
- Varying project types, budgets, durations across agencies
- Clearly labeled: "E-commerce Platform Migration (Demo)", etc.

**Deals (3-5 per agency):**
| Deal Pattern | Stage | wip_registered_at |
|-------------|-------|-------------------|
| 2 deals at New/Contacted | Pre-SQL | null |
| 2 deals at SQL/Proposal | Post-SQL | Stamped (within current month) |
| 1 deal at Won | Graduated | Stamped (previous month) |

This ensures the WIP dashboard shows non-zero counts for the current month.

### Idempotency Guard
```typescript
// Check if demo data already exists
const existingDeal = await em.findOne(CustomerDeal, { title: 'Acme Corp Enterprise CRM (Demo)' })
if (existingDeal) return false  // already seeded
```

### Data Creation Order
1. Create organizations (3 agencies)
2. Create users with role assignments (PM + 3x Admin/BD/Contributor)
3. Create company entities with profiles (custom field values)
4. Create case study entity records (via entities module)
5. Create deals at various stages
6. Stamp `wip_registered_at` on qualifying deals (direct em write — mimicking interceptor behavior for demo data)

### Labeling Convention
All demo entity names include "(Demo)" suffix for clear identification:
- Company: "Acme Digital (Demo)"
- Deal: "Enterprise CRM Implementation (Demo)"
- Case Study: "E-commerce Platform Migration (Demo)"
- User emails: *@*-demo.com

## Verification
```bash
yarn typecheck         # Must pass
yarn build             # Must pass
yarn initialize        # Full bootstrap — seedDefaults + seedExamples
# Verify:
#   1. 3 agencies visible in PM org switcher
#   2. Each agency has company profile with filled custom fields
#   3. Each agency has 2-3 case studies
#   4. Each agency has deals at various stages
#   5. WIP dashboard shows non-zero count for current month
#   6. Running yarn initialize again → no duplicate data (idempotent)
```
