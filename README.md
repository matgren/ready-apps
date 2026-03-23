<p align="center">
  <img src="https://raw.githubusercontent.com/open-mercato/open-mercato/main/apps/mercato/public/open-mercato.svg" alt="Open Mercato logo" width="120" />
</p>

# Open Mercato — Ready Apps

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-openmercato.com-1F7AE0.svg)](https://docs.openmercato.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg)](https://github.com/open-mercato/ready-apps/issues)

Complete, runnable vertical applications built on [Open Mercato](https://github.com/open-mercato/open-mercato). Each app is a production-ready starting point for a specific business domain — fork it, customize the spec, and let the AI-assisted workflow build the rest.

## What this is

Open Mercato is a modular commerce platform. **This repo shows what you can build on it.**

Every ready app here:

- **Runs in one command** — scaffold with `create-mercato-app --example`, or clone and `yarn dev`
- **Includes its business spec** — the `app-spec/` folder documents the domain model, workflows, and user stories that produced the app
- **Is AI-native** — built with an agentic workflow (Mat for product ownership, Piotr for platform gap analysis, Krug for UI review) that you can reuse to extend or fork
- **Is forkable** — modify the app spec, run the skills, and the agentic stack helps you code the changes

Whether you're exploring what Open Mercato can do or building your own vertical SaaS — start here.

## Quick Start

```bash
# Scaffold from an official ready app
npx create-mercato-app my-prm --example prm

# Or from a community app (any GitHub URL)
npx create-mercato-app my-app --example https://github.com/someone/their-mercato-app
```

Or clone directly:

```bash
git clone https://github.com/open-mercato/ready-apps
cd ready-apps/apps/prm
cp .env.example .env        # Edit with your database credentials
docker compose up -d         # Start PostgreSQL
yarn install
yarn generate
yarn db:migrate
yarn initialize
yarn dev                     # Open http://localhost:3000/backend
```

## Ready Apps

### Official

| App | Description | Domain |
|-----|-------------|--------|
| [prm](apps/prm) | Partner Relationship Management — agency onboarding, lead distribution, WIC scoring, cross-org dashboards | Channel partnerships |

### Community

| App | Author | Description |
|-----|--------|-------------|

> Built something on Open Mercato? See [Contributing](#contributing).

## Repo Structure

```
ready-apps/
├── apps/                    # Runnable apps (source for --example flag)
│   └── prm/                 # PRM ready app
│       ├── app-spec/        # Business spec (forkable, drives AI-assisted dev)
│       ├── src/modules/     # Application code
│       └── docs/specs/      # Implementation specs
├── skills/                  # Shared AI skills + templates
│   ├── mat/                 # Product owner — spec writing, user stories
│   ├── piotr/               # CTO review — platform gap analysis, atomic commits
│   └── krug/                # UI architecture review
└── docs/                    # Guides for agents and contributors
```

Each app is self-contained: code, business spec, and documentation live together. The `--example` flag copies everything — you get a working app and the spec that produced it.

## Building Your Own Ready App

The recommended workflow — for humans and AI agents alike:

### Step 1 — Start from a ready app

```bash
npx create-mercato-app my-vertical --example prm
```

You get the running app, its business spec, and the full agentic toolkit.

### Step 2 — Modify the app spec

Edit `app-spec/` to describe your domain: change the workflows, add entities, adjust user stories. The spec is the single source of truth — the AI skills read it to know what to build.

### Step 3 — Run the agentic workflow

The skills guide the entire process:

1. **Mat** — validates your spec: business context, workflows, user stories, phasing
2. **Piotr** — checks what the platform already provides, estimates gaps in atomic commits
3. **Krug** — reviews UI architecture: navigation, pages, widgets, user flows
4. **Superpowers** — generates implementation specs and code from the validated spec

### Step 4 — Ship it

Your app is a standard Open Mercato application. Deploy it anywhere the platform runs.

See [docs/agent-guides/](docs/agent-guides/) for detailed guides.

## Contributing

We welcome ready apps of all sizes — from simple CRMs to full vertical platforms.

1. Build your app on Open Mercato
2. Open a PR adding a row to the Community table above with your repo URL
3. Or contribute directly: fork this repo, add your app to `apps/`, include the `app-spec/` that produced it

Open Mercato is proudly supported by [Catch The Tornado](https://catchthetornado.com/).

<div align="center">
  <a href="https://catchthetornado.com/">
    <img src="https://raw.githubusercontent.com/open-mercato/open-mercato/main/apps/mercato/public/catch-the-tornado-logo.png" alt="Catch The Tornado logo" width="96" />
  </a>
</div>

## Resources

- [Open Mercato core repo](https://github.com/open-mercato/open-mercato)
- [Official Modules](https://github.com/open-mercato/official-modules)
- [Documentation](https://docs.openmercato.com/)
- [Discord community](https://discord.gg/f4qwPtJ3qA)

## License

MIT — see `LICENSE` for details.
