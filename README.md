# Open Mercato — Ready Apps

Vertical applications built on [Open Mercato](https://github.com/open-mercato/open-mercato). Each app is a complete, runnable starting point for a specific business domain.

## Quick Start

```bash
# Official ready app
npx create-mercato-app my-prm --example prm

# Community ready app (GitHub URL)
npx create-mercato-app my-app --example https://github.com/someone/their-mercato-app
```

Or clone directly:

```bash
git clone https://github.com/open-mercato/ready-apps
cd ready-apps/apps/prm
cp .env.example .env
# Edit .env with your database credentials
yarn install
yarn generate
yarn db:migrate
yarn initialize
yarn dev
```

## Ready Apps

### Official

| App | Description | Domain |
|-----|-------------|--------|
| [prm](apps/prm) | Partner Relationship Management — agency onboarding, lead distribution, cross-org dashboards | Channel partnerships |

### Community

| App | Author | Description |
|-----|--------|-------------|

> Built something on Open Mercato? See [Contributing](#contributing).

## Repo Structure

```
ready-apps/
├── apps/                    # Runnable apps (source for --example flag)
│   └── prm/                 # PRM ready app
├── app-specs/               # Business specs (domain model, workflows, user stories)
│   ├── skills/              # AI-assisted spec process (Mat, Piotr, Krug)
│   └── prm/                 # PRM business spec
└── docs/                    # Guides for agents and contributors
```

- `apps/<name>/` — complete OM application, installable from npm
- `app-specs/<name>/` — business analysis that produced the app (App Spec, challenger reviews, commit plans)

## Building Your Own Ready App

1. Start with the App Spec process in `app-specs/` — define your domain, workflows, and user stories
2. Use the AI skills (Mat for product ownership, Piotr for platform gap analysis, Krug for UI review) to validate your spec
3. Generate implementation specs and build your app in `apps/`

See [docs/agent-guides/](docs/agent-guides/) for detailed guides.

## Contributing

To add a community ready app:

1. Build your app on Open Mercato
2. Open a PR adding a row to the Community table above with your repo URL

## TODO

- [ ] `$OM_REPO` env var + auto-clone for AI-assisted spec/build workflow (replaces gitignored `open-mercato/` folder)
- [ ] `registry.json` — machine-readable app registry for CLI `--list` support
- [ ] `docs/getting-started.md` — human-friendly guide (run mode)
- [ ] `docs/building-an-app.md` — guide for building a new ready app (build mode)
- [ ] `docs/verdaccio-dev-flow.md` — OM team local development with Verdaccio
- [ ] Move `open-mercato/` from repo to external reference
- [ ] Skills: `ensure-om-repo.sh` shared resolution script
