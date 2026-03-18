# B2B PRM Starter

A complete Partner Relationship Management starter for Open Mercato, built on SPEC-053 (B2B PRM family).

## Quick Start

```bash
# Create a new app from this starter
npx create-mercato-app --example b2b-prm my-prm-app
cd my-prm-app

# Start infrastructure
docker compose up -d

# Initialize and run
yarn initialize
yarn dev
```

## What's Included

### 13 Core Modules

| Category | Modules |
|----------|---------|
| **Infrastructure** | `directory`, `auth`, `entities`, `query_index` |
| **Customer Identity & Portal** | `customer_accounts`, `portal`, `customers`, `notifications` |
| **Operations** | `dashboards`, `workflows`, `attachments`, `audit_logs`, `dictionaries` |

### Partnerships Module (`@app`)

The PRM domain module providing:

**Staff Backend** (`/backend/partnerships`):
- Agency management — onboard, list, and manage partner agencies
- Tier definitions — define Bronze/Silver/Gold tiers with KPI thresholds
- Tier assignments — assign and downgrade partner tiers with history
- KPI dashboard — WIC/WIP/MIN metrics, snapshot import, WIC run management
- RFP campaigns — create, publish, close campaigns; view responses
- MIN attribution — attribute license deals to partner agencies

**Partner Portal** (`/portal/partnerships`):
- Dashboard — tier status, KPI summary, active RFP count
- KPI details — WIC contributions, MIN license deals, metric history
- RFP inbox — view campaigns, submit responses
- Case studies — placeholder (pending SPEC-053a data foundation)
- Team management — placeholder (pending customer_accounts integration)

**Partner RBAC** (3 roles seeded automatically):
- **Partner Admin** — full portal access + team management
- **Partner Member** — KPIs, RFPs, profile (default, auto-assigned on CRM linking)
- **Partner Viewer** — read-only KPIs and profile

**Event Subscribers**:
- Auto-assign Partner Member role when a customer user links to a partner agency's CRM company
- Notify all agency users when an RFP campaign is issued

## Module Architecture

```
src/modules/partnerships/
├── api/                    # Staff + portal API routes
│   ├── agencies/           # Agency CRUD
│   ├── tiers/              # Tier definitions CRUD
│   ├── kpi/                # KPI dashboard, snapshots, WIC runs
│   ├── min/                # MIN license deal attribution
│   └── portal/             # Partner-facing API routes
│       ├── dashboard/      # GET — tier + KPI summary
│       ├── kpi/            # GET — detailed KPI breakdown
│       ├── rfp/            # GET list, GET [id], POST [id]/respond
│       └── case-studies/   # GET/POST, PUT/DELETE [id] (skeleton)
├── backend/                # Staff backend pages
├── frontend/               # Portal frontend pages
│   └── [orgSlug]/portal/partnerships/
│       ├── page.tsx        # Dashboard
│       ├── kpi/            # KPI detail
│       ├── rfp/            # RFP inbox + [id] response
│       ├── case-studies/   # Placeholder
│       └── team/           # Placeholder
├── subscribers/            # Event subscribers
├── widgets/                # Portal nav injection
├── data/entities.ts        # MikroORM entities
├── setup.ts                # Tier + role seeding
└── events.ts               # Event declarations
```

## Known Limitations

- **Case studies**: Route skeletons return 501 — pending SPEC-053a custom entities implementation
- **Team management**: Placeholder page — will integrate with `customer_accounts` portal user management
- **Agency-to-user linking**: Depends on CRM company match; agencies without existing CRM records need manual linking
- **RFP `all` distribution**: Resolves all active agencies + their users; may be slow with large agency pools

## Related Specs

- [SPEC-053](/.ai/specs/SPEC-053-2026-03-02-b2b-prm-starter.md) — B2B PRM main spec
- [SPEC-053a](/.ai/specs/SPEC-053a-2026-03-02-b2b-prm-matching-data-phase0-api-only.md) — Data foundation
- [SPEC-053b](/.ai/specs/SPEC-053b-2026-03-02-b2b-prm-operations-kpi-rfp.md) — Operations, KPI, RFP
- SPEC-053c — Partner portal & module slimming (this implementation)
- [SPEC-060](/.ai/specs/) — Customer Identity & Portal Auth
- [SPEC-062](/.ai/specs/) — Use-Case Starters Framework
