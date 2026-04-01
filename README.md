# PRM — Open Source Partner Relationship Management

An open-source [Open Mercato](https://github.com/open-mercato/open-mercato) application for running a B2B partner agency program. Built for software vendors who grow through implementation partners rather than direct sales.

## The Problem

When your product is sold and implemented by partner agencies, you need to answer three questions every month:

1. **Who is contributing?** — Which agencies are investing engineering time into your product?
2. **Who is selling?** — Which agencies are actively prospecting and closing deals?
3. **Who deserves more leads?** — How do you fairly distribute inbound opportunities?

Without a system, this becomes spreadsheets, gut feelings, and politics. PRM replaces that with measurable KPIs, transparent tiers, and structured lead distribution.

## How It Works

### The Partnership Flywheel

```
Agency joins program
  → contributes code (WIC)    → product improves
  → prospects clients (WIP)   → pipeline grows
  → closes deals (MIN)        → revenue grows
  → earns higher tier         → gets more visibility & leads
  → more leads → more sales   → agency invests more → flywheel accelerates
```

The system tracks three KPIs that make this flywheel measurable:

### KPIs — What Gets Measured

| KPI | What it measures | Why it matters |
|-----|-----------------|----------------|
| **WIC** (Wildly Important Contribution) | Code contributions scored by complexity (L1–L4), with impact bonuses and bounty multipliers | Agencies that improve the product deserve recognition. Without WIC tracking, code contributions go unnoticed and unrewarded. |
| **WIP** (Work In Progress) | Deals that reached Sales Qualified Lead stage in a given month | Shows which agencies are actively building pipeline. An agency with high WIP is investing sales effort — even before deals close. |
| **MIN** (Minimum Implementations Needed) | Enterprise license deals won and attributed to an agency per year | The bottom line. Which agencies are actually closing business? MIN separates agencies that talk from agencies that deliver. |

### Tiers — What Gets Rewarded

KPIs feed into a 4-tier system. Higher tiers get more visibility on the vendor's website and priority access to inbound leads:

| Tier | WIC/month | WIP/month | MIN/year | What it means |
|------|-----------|-----------|----------|---------------|
| **OM Agency** | 1 | 1 | 1 | Foundational partner — committed but early stage |
| **OM AI-native Agency** | 2 | 5 | 2 | Proven partner — consistent contribution and sales |
| **OM AI-native Expert** | 3 | 15 | 5 | Vertical leader — dominant in a specific industry niche |
| **OM AI-native Core** | 4 | 15 | 5 | Strategic partner — core product expertise, top-tier access |

Tiers are evaluated monthly with a 1-month grace period. All changes require PM approval — no surprise downgrades.

### Workflows

| # | Workflow | What the PM does |
|---|---------|-----------------|
| WF1 | **Agency Onboarding** | Creates agency org, invites admin + BD + contributors, seeds CRM pipeline |
| WF2 | **WIP Tracking** | Reviews pipeline activity across all agencies (auto-stamped at SQL qualification) |
| WF3 | **WIC Scoring** | Imports/reviews code contribution scores per contributor per month |
| WF4 | **RFP Distribution** | Publishes lead campaigns to tier-qualified agencies, reviews responses, awards winner |
| WF5 | **Tier Governance** | Reviews monthly KPI evaluations, approves/rejects tier changes |

## Getting Started

### Prerequisites

- Node.js >= 24
- Yarn (via corepack)
- Docker & Docker Compose

### Setup

```bash
# Clone the repo
git clone <repo-url> && cd <repo-dir>

# Start infrastructure (PostgreSQL, Redis, Meilisearch)
docker compose up -d

# Install dependencies
yarn install

# Generate framework files
yarn generate

# Create .env from template
cp .env.example .env

# Initialize database (migrations + seed data)
yarn reinstall
```

### Run

```bash
yarn dev
# Open http://localhost:3000
```

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Partnership Manager | `partnership-manager@demo.local` | `Demo123!` |
| Agency Admin (Acme) | `acme-admin@demo.local` | `Demo123!` |
| Agency BD (Acme) | `acme-bd@demo.local` | `Demo123!` |
| Agency Contributor (Acme) | `acme-contributor@demo.local` | `Demo123!` |
| Agency Admin (Nordic) | `nordic-admin@demo.local` | `Demo123!` |
| Agency BD (Nordic) | `nordic-bd@demo.local` | `Demo123!` |

### Development Commands

```bash
yarn dev               # Start dev server
yarn build             # Production build
yarn typecheck         # Type check
yarn test              # Unit tests
yarn generate          # Regenerate framework files
yarn db:generate       # Create migration after entity changes
yarn db:migrate        # Apply pending migrations
yarn reinstall         # Reset DB + fresh seed
```

## Project Structure

```
app-spec/              # Business specification (domain model, workflows, phasing)
src/modules/
  partnerships/        # PRM module — all custom business logic
    api/               # REST endpoints
    backend/           # Admin UI pages
    data/              # Entities, validators, custom fields
    subscribers/       # Domain event handlers
    widgets/           # Dashboard widgets (WIC, WIP, tier status)
    workers/           # Background jobs (tier evaluation)
    setup.ts           # Roles, permissions, seed data
docs/specs/            # Implementation specifications
.ai/                   # OM platform skills & guides
```

## Built With

[Open Mercato](https://github.com/open-mercato/open-mercato) — Next.js, TypeScript, MikroORM, Awilix DI, Zod
