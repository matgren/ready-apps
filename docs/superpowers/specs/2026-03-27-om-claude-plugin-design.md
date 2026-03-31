# Design: om-claude-plugin

## Summary

Claude Code plugin distributing Open Mercato skills to community developers. Standalone plugin, installable directly or via obra/superpowers-marketplace. 10 skills covering the full OM developer lifecycle: spec writing, platform challenge, UI review, implementation, and code review.

## Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Name | `om-claude-plugin` | Our plugin, our brand. Not part of superpowers ecosystem (obra rejected domain-specific skills in issue #248). |
| Repo | `SHGrowth/om-claude-plugin` | SHGrowth org on GitHub. |
| Superpowers dependency | None (standalone) | Skills reference superpowers skills by name where useful, but plugin works without superpowers installed. |
| Distribution | Direct install + optional PR to `obra/superpowers-marketplace` | `/plugin install https://github.com/SHGrowth/om-claude-plugin.git` for users. Marketplace PR for discoverability. |
| OM skill sync | Vendor + sync script | 7 OM skills vendored in repo. `scripts/sync-om-skills.sh` fetches from GitHub raw URL before each release. Drift check in CI (warn, not block). |
| Mat/Piotr/Krug | Moved to plugin repo | Source of truth moves from `matgren/ready-apps/skills/` to plugin repo. |
| Own marketplace | No | User base doesn't justify overhead. Direct install is sufficient. |
| SessionStart hook | Yes | Injects OM context: available skills, conventions, link to AGENTS.md. |
| Piotr remote mode | Yes | Piotr skill adapted to work without local OM clone: cached AGENTS.md + `gh search code` for code search. |

## Skills (10)

### Spec & Design (from ready-apps, moved to plugin)

| Skill | Description trigger | Role |
|-------|-------------------|------|
| `om-mat` | Use when starting any new feature, module, or spec on Open Mercato | Product owner: business context, workflows, user stories, platform mapping. Dispatches Vernon (DDD challenger) as subagent. |
| `om-piotr` | Use when asked to build a feature or implement something new — before any code. Also: gap analysis, "does OM already do X" | CTO challenge: verifies OM platform capabilities, maps existing solutions, estimates gaps in atomic commits. |
| `om-krug` | Use when UI architecture is defined (section 3.5 of app-spec) and needs review | UI/UX review: navigation clarity, task completion, cognitive load within OM's UI framework. |

### Implementation & Quality (vendored from open-mercato/open-mercato)

| Skill | Source path in OM repo | Description trigger |
|-------|----------------------|-------------------|
| `om-code-review` | `.ai/skills/code-review/` | Use when reviewing code in Open Mercato applications — after completing a feature, before merging |
| `om-implement-spec` | `.ai/skills/implement-spec/` | Use when implementing a specification end-to-end with coordinated subagents |
| `om-spec-writing` | `.ai/skills/spec-writing/` | Use when creating high-quality, architecturally compliant specifications |
| `om-pre-implement-spec` | `.ai/skills/pre-implement-spec/` | Use when analyzing a spec before implementation — BC impact, risk assessment, gap analysis |
| `om-integration-tests` | `.ai/skills/integration-tests/` | Use when creating or running Playwright integration tests for OM modules |
| `om-integration-builder` | `.ai/skills/integration-builder/` | Use when building integration provider packages (payment, shipping, data sync) |
| `om-backend-ui-design` | `.ai/skills/backend-ui-design/` | Use when designing backend page UI within OM's framework |

### Developer flow

```
om-mat → om-piotr → om-krug → om-spec-writing → om-pre-implement-spec → om-implement-spec → om-code-review
                                                                              |
                                                                    om-integration-tests
                                                                    om-integration-builder
                                                                    om-backend-ui-design
```

## Repo structure

```
SHGrowth/om-claude-plugin/
├── .claude-plugin/
│   ├── plugin.json                     # Plugin metadata
│   └── marketplace.json                # Self-hosting marketplace entry
├── .cursor-plugin/
│   └── plugin.json                     # Cursor support
├── hooks/
│   ├── hooks.json                      # Claude Code hooks
│   ├── hooks-cursor.json               # Cursor hooks
│   ├── run-hook.cmd                    # Cross-platform hook wrapper
│   └── session-start                   # OM context injection
├── skills/
│   ├── om-mat/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── platform-capabilities.md
│   ├── om-piotr/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── context-loading.md
│   │       └── atomic-commits.md
│   ├── om-krug/
│   │   └── SKILL.md
│   ├── om-code-review/                 # vendored from OM
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── review-checklist.md
│   ├── om-implement-spec/              # vendored from OM
│   │   └── SKILL.md
│   ├── om-spec-writing/                # vendored from OM
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── spec-checklist.md
│   │       ├── compliance-review.md
│   │       └── spec-template.md
│   ├── om-pre-implement-spec/          # vendored from OM
│   │   └── SKILL.md
│   ├── om-integration-tests/           # vendored from OM
│   │   └── SKILL.md
│   ├── om-integration-builder/         # vendored from OM
│   │   └── SKILL.md
│   └── om-backend-ui-design/           # vendored from OM
│       ├── SKILL.md
│       └── references/
│           └── ui-components.md
├── templates/
│   └── app-spec-template.md            # App Spec template (used by om-mat)
├── scripts/
│   └── sync-om-skills.sh               # Fetch OM skills from GitHub
├── package.json
├── README.md
└── LICENSE (MIT)
```

## Sync mechanism

### scripts/sync-om-skills.sh

Fetches 7 OM skills from `open-mercato/open-mercato` develop branch via `raw.githubusercontent.com`.

Source mapping:

```
code-review        → .ai/skills/code-review/
implement-spec     → .ai/skills/implement-spec/
spec-writing       → .ai/skills/spec-writing/
pre-implement-spec → .ai/skills/pre-implement-spec/
integration-tests  → .ai/skills/integration-tests/
integration-builder → .ai/skills/integration-builder/
backend-ui-design  → .ai/skills/backend-ui-design/
```

For each skill:
1. Fetch `SKILL.md` from raw.githubusercontent.com
2. Fetch `references/` directory listing via `gh api repos/open-mercato/open-mercato/contents/.ai/skills/<name>/references`
3. Fetch each reference file
4. Write to `skills/om-<name>/`
5. Prefix skill `name:` field with `om-` in SKILL.md frontmatter

### Process

```
# Before release:
bash scripts/sync-om-skills.sh

# Review changes:
git diff skills/

# Commit and release:
git add skills/
git commit -m "chore: sync OM skills from open-mercato/open-mercato@<sha>"
git tag v1.x.x
git push --tags
```

### Drift check (optional CI)

GitHub Action on weekly cron or PR:
- For each vendored skill, compare SHA of local file vs GitHub raw URL
- If drift detected: log warning in CI output, do NOT block

## SessionStart hook

### What it injects

```
You are working in an Open Mercato project. The following OM-specific skills are available:

**Spec & Design:**
- om-mat: Product owner workflow (spec writing)
- om-piotr: CTO challenge (gap analysis, "does OM already do X?")
- om-krug: UI architecture review

**Implementation:**
- om-implement-spec: Multi-phase spec implementation
- om-spec-writing: Specification creation
- om-pre-implement-spec: Pre-implementation analysis
- om-integration-tests: Playwright test creation
- om-integration-builder: Provider package development
- om-backend-ui-design: Backend UI patterns

**Quality:**
- om-code-review: CI/CD gate + full OM checklist

When working on OM code, prefer om-* skills over generic equivalents.
OM conventions: see https://github.com/open-mercato/open-mercato/blob/develop/AGENTS.md
```

### Detection

Hook checks for OM project indicators:
- `package.json` contains `@open-mercato/` dependency
- `AGENTS.md` references Open Mercato
- `.ai/` directory exists

If no OM indicators found: hook injects nothing (silent).

## Piotr remote mode

The `om-piotr` skill is adapted to work without a local OM clone:

### AGENTS.md files (cached in plugin)

The plugin vendors key AGENTS.md files in `skills/om-piotr/references/`:
- `context-loading.md` — module lookup table (already exists)
- `atomic-commits.md` — gap scoring methodology (already exists)

These tell Piotr WHERE to look. The actual content is fetched on-demand.

### Code search (live via gh CLI)

When Piotr needs to search OM code ("does module X exist?", "does makeCrudRoute handle Y?"):

```bash
gh search code "makeCrudRoute" --repo open-mercato/open-mercato
gh api repos/open-mercato/open-mercato/contents/packages/core/src/modules
```

### Read specific files (live via gh API)

When Piotr needs to read a specific AGENTS.md or source file:

```bash
gh api repos/open-mercato/open-mercato/contents/packages/core/AGENTS.md \
  --jq '.content' | base64 -d
```

### Resolution chain

1. Local `$OM_REPO` (if exists) — fastest, full grep/glob
2. `gh` CLI (fallback) — works without clone, requires internet + GitHub auth
3. Plugin cached references (last resort) — stale but offline-capable

## Installation

### For users

```bash
# Direct install:
/plugin install https://github.com/SHGrowth/om-claude-plugin.git

# Or via superpowers marketplace (after PR merged):
/plugin marketplace add obra/superpowers-marketplace
/plugin install om-claude-plugin@superpowers-marketplace
```

### Prerequisites

- Claude Code (or Cursor with plugin support)
- `gh` CLI authenticated (for om-piotr remote code search)
- Optional: superpowers plugin (skills reference superpowers skills but don't require them)

## Naming conventions

All skills prefixed `om-` to avoid collision with superpowers or other plugins.

| OM skill | Superpowers equivalent (if any) |
|----------|-------------------------------|
| `om-code-review` | `superpowers:requesting-code-review` |
| `om-implement-spec` | `superpowers:executing-plans` |
| `om-spec-writing` | `superpowers:brainstorming` → `superpowers:writing-plans` |
| `om-mat` | `superpowers:brainstorming` (spec-specific) |
| `om-pre-implement-spec` | (no equivalent) |
| `om-integration-tests` | `superpowers:test-driven-development` |
| `om-piotr` | (no equivalent) |
| `om-krug` | (no equivalent) |

## Roadmap

1. **v1.0 — MVP plugin** — Repo setup, 10 skills, sync script, SessionStart hook, README with install + sync docs. Direct install via GitHub URL.
2. **v1.1 — Cursor support** — Add `.cursor-plugin/` config, test on Cursor.
3. **Submit to obra/superpowers-marketplace** — PR adding `om-claude-plugin` entry to `marketplace.json` in `obra/superpowers-marketplace`. Gives discoverability to superpowers community. Requires: stable v1.x, README with clear install instructions, plugin working end-to-end.

## Out of scope

- Custom marketplace (not needed for our community size)
- Runtime skill fetching/caching (overengineering for markdown that changes twice/month)
- Forking superpowers (our skills are domain-specific, rejected from core per issue #248)
- Git submodules (painful UX for plugin users)
- Skills not relevant to community: dev-container-maintenance, fix-specs, skill-creator, create-agents-md
