# om-claude-plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Claude Code plugin that distributes 10 Open Mercato skills to community developers.

**Architecture:** Standard Claude Code plugin (`.claude-plugin/plugin.json` + `skills/` + `hooks/`). 3 skills moved from ready-apps, 7 vendored from OM repo via sync script. SessionStart hook injects OM context when working in OM projects.

**Tech Stack:** Bash (sync script, hooks), JSON (plugin config), Markdown (skills)

**Spec:** `docs/superpowers/specs/2026-03-27-om-claude-plugin-design.md`

---

### Task 1: Create repo and plugin scaffold

**Files:**
- Create: `package.json`
- Create: `.claude-plugin/plugin.json`
- Create: `.claude-plugin/marketplace.json`
- Create: `LICENSE`

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create SHGrowth/om-claude-plugin --public --description "Claude Code plugin for Open Mercato developers — skills for spec writing, implementation, and code review" --license MIT
```

- [ ] **Step 2: Clone and enter repo**

```bash
cd /Users/maciejgren/Documents/OM-PRM
git clone git@github.com:SHGrowth/om-claude-plugin.git
cd om-claude-plugin
```

- [ ] **Step 3: Create package.json**

```json
{
  "name": "om-claude-plugin",
  "version": "1.0.0",
  "description": "Claude Code plugin for Open Mercato developers",
  "license": "MIT",
  "repository": "https://github.com/SHGrowth/om-claude-plugin"
}
```

- [ ] **Step 4: Create .claude-plugin/plugin.json**

```json
{
  "name": "om-claude-plugin",
  "description": "Skills for Open Mercato developers: spec writing, platform challenge, implementation, code review, and testing",
  "version": "1.0.0",
  "author": {
    "name": "Open Mercato",
    "email": "dev@open-mercato.com"
  },
  "homepage": "https://github.com/SHGrowth/om-claude-plugin",
  "repository": "https://github.com/SHGrowth/om-claude-plugin",
  "license": "MIT",
  "keywords": [
    "open-mercato",
    "skills",
    "code-review",
    "spec-writing",
    "implementation",
    "ddd",
    "platform"
  ]
}
```

- [ ] **Step 5: Create .claude-plugin/marketplace.json**

```json
{
  "name": "om-claude-plugin",
  "description": "Open Mercato developer skills marketplace",
  "owner": {
    "name": "Open Mercato"
  },
  "plugins": [
    {
      "name": "om-claude-plugin",
      "description": "Skills for Open Mercato developers: spec writing, platform challenge, implementation, code review, and testing",
      "version": "1.0.0",
      "source": "./",
      "author": {
        "name": "Open Mercato"
      }
    }
  ]
}
```

- [ ] **Step 6: Commit scaffold**

```bash
git add package.json .claude-plugin/ LICENSE
git commit -m "feat: init plugin scaffold with plugin.json and marketplace.json"
```

---

### Task 2: Create SessionStart hook

**Files:**
- Create: `hooks/hooks.json`
- Create: `hooks/run-hook.cmd`
- Create: `hooks/session-start`

- [ ] **Step 1: Create hooks/hooks.json**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
            "async": false
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Create hooks/run-hook.cmd**

Copy from superpowers — it's a cross-platform polyglot wrapper (batch + bash). The content:

```bash
: << 'CMDBLOCK'
@echo off
REM Cross-platform polyglot wrapper for hook scripts.
REM On Windows: cmd.exe runs the batch portion, which finds and calls bash.
REM On Unix: the shell interprets this as a script (: is a no-op in bash).

if "%~1"=="" (
    echo run-hook.cmd: missing script name >&2
    exit /b 1
)

set "HOOK_DIR=%~dp0"

if exist "C:\Program Files\Git\bin\bash.exe" (
    "C:\Program Files\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)
if exist "C:\Program Files (x86)\Git\bin\bash.exe" (
    "C:\Program Files (x86)\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)

where bash >nul 2>nul
if %ERRORLEVEL% equ 0 (
    bash "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)

exit /b 0
CMDBLOCK

# Unix: run the named script directly
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
exec bash "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
```

- [ ] **Step 3: Create hooks/session-start**

```bash
#!/usr/bin/env bash
# SessionStart hook for om-claude-plugin
# Detects OM projects and injects available skills context

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Detect OM project — check working directory for OM indicators
is_om_project=false

if [ -f "package.json" ] && grep -q "@open-mercato/" package.json 2>/dev/null; then
  is_om_project=true
elif [ -f "AGENTS.md" ] && grep -q "Open Mercato" AGENTS.md 2>/dev/null; then
  is_om_project=true
elif [ -d ".ai" ]; then
  is_om_project=true
fi

# If not an OM project, exit silently
if [ "$is_om_project" = false ]; then
  echo '{}'
  exit 0
fi

# Build context message
read -r -d '' OM_CONTEXT << 'CTXEOF' || true
You are working in an Open Mercato project. The following OM-specific skills are available via the Skill tool:

**Spec & Design:**
- om-mat: Product owner workflow — business context, workflows, user stories, platform mapping
- om-piotr: CTO challenge — gap analysis, "does OM already do X?", atomic commit estimation
- om-krug: UI architecture review — navigation, task completion, cognitive load

**Implementation:**
- om-implement-spec: Multi-phase spec implementation with coordinated subagents
- om-spec-writing: Specification creation with architectural compliance
- om-pre-implement-spec: Pre-implementation BC impact and risk analysis
- om-integration-tests: Playwright integration test creation and execution
- om-integration-builder: Provider package development (payment, shipping, data sync)
- om-backend-ui-design: Backend UI patterns within OM framework

**Quality:**
- om-code-review: CI/CD verification gate + full OM checklist (20+ sections)

When working on OM code, prefer om-* skills over generic equivalents.
OM platform conventions: https://github.com/open-mercato/open-mercato/blob/develop/AGENTS.md
CTXEOF

# Escape for JSON
escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

escaped_context=$(escape_for_json "$OM_CONTEXT")

# Output for Claude Code or Cursor
if [ -n "${CURSOR_PLUGIN_ROOT:-}" ]; then
  printf '{\n  "additional_context": "%s"\n}\n' "$escaped_context"
elif [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then
  printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$escaped_context"
else
  printf '{\n  "additional_context": "%s"\n}\n' "$escaped_context"
fi

exit 0
```

- [ ] **Step 4: Make hook scripts executable**

```bash
chmod +x hooks/session-start hooks/run-hook.cmd
```

- [ ] **Step 5: Commit hooks**

```bash
git add hooks/
git commit -m "feat: add SessionStart hook with OM project detection"
```

---

### Task 3: Move Mat, Piotr, Krug skills from ready-apps

**Files:**
- Create: `skills/om-mat/SKILL.md`
- Create: `skills/om-mat/references/platform-capabilities.md`
- Create: `skills/om-piotr/SKILL.md`
- Create: `skills/om-piotr/references/context-loading.md`
- Create: `skills/om-piotr/references/atomic-commits.md`
- Create: `skills/om-piotr/references/dashboard-widgets.md`
- Create: `skills/om-krug/SKILL.md`
- Create: `templates/app-spec-template.md`

- [ ] **Step 1: Copy skill files from ready-apps**

```bash
# Mat
mkdir -p skills/om-mat/references
cp /Users/maciejgren/Documents/OM-PRM/ready-apps/skills/mat/SKILL.md skills/om-mat/SKILL.md
cp /Users/maciejgren/Documents/OM-PRM/ready-apps/skills/mat/references/platform-capabilities.md skills/om-mat/references/

# Piotr
mkdir -p skills/om-piotr/references
cp /Users/maciejgren/Documents/OM-PRM/ready-apps/skills/piotr/SKILL.md skills/om-piotr/SKILL.md
cp /Users/maciejgren/Documents/OM-PRM/ready-apps/skills/piotr/references/context-loading.md skills/om-piotr/references/
cp /Users/maciejgren/Documents/OM-PRM/ready-apps/skills/piotr/references/atomic-commits.md skills/om-piotr/references/
cp /Users/maciejgren/Documents/OM-PRM/ready-apps/skills/piotr/references/dashboard-widgets.md skills/om-piotr/references/

# Krug
mkdir -p skills/om-krug
cp /Users/maciejgren/Documents/OM-PRM/ready-apps/skills/krug/SKILL.md skills/om-krug/SKILL.md

# Template (used by Mat)
mkdir -p templates
cp /Users/maciejgren/Documents/OM-PRM/ready-apps/skills/templates/app-spec-template.md templates/
```

- [ ] **Step 2: Rename skill `name:` fields in frontmatter**

In each SKILL.md, update the `name:` field in YAML frontmatter to add `om-` prefix:

- `skills/om-mat/SKILL.md`: `name: mat` → `name: om-mat`
- `skills/om-piotr/SKILL.md`: `name: piotr` → `name: om-piotr`
- `skills/om-krug/SKILL.md`: `name: krug` → `name: om-krug`

Also update `description:` to start with "Use when..." and mention Open Mercato explicitly.

- [ ] **Step 3: Update internal cross-references**

In `skills/om-mat/SKILL.md`:
- References to `skills/templates/app-spec-template.md` → `templates/app-spec-template.md`
- References to `references/platform-capabilities.md` → stays relative (no change)

In `skills/om-piotr/SKILL.md`:
- References to `references/context-loading.md` → stays relative (no change)
- References to `references/atomic-commits.md` → stays relative (no change)
- `$OM_REPO` references stay — Piotr still uses local OM repo when available

- [ ] **Step 4: Commit**

```bash
git add skills/om-mat/ skills/om-piotr/ skills/om-krug/ templates/
git commit -m "feat: add om-mat, om-piotr, om-krug skills (moved from ready-apps)"
```

---

### Task 4: Create sync script and vendor OM skills

**Files:**
- Create: `scripts/sync-om-skills.sh`

- [ ] **Step 1: Create scripts/sync-om-skills.sh**

```bash
#!/usr/bin/env bash
# Sync OM platform skills from open-mercato/open-mercato repo (develop branch)
# Run this before each plugin release to update vendored skills.

set -euo pipefail

REPO="open-mercato/open-mercato"
BRANCH="develop"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}/.ai/skills"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SKILLS_DIR="${PLUGIN_ROOT}/skills"

# Skills to sync: local-name → remote-name
declare -A SKILL_MAP=(
  ["om-code-review"]="code-review"
  ["om-implement-spec"]="implement-spec"
  ["om-spec-writing"]="spec-writing"
  ["om-pre-implement-spec"]="pre-implement-spec"
  ["om-integration-tests"]="integration-tests"
  ["om-integration-builder"]="integration-builder"
  ["om-backend-ui-design"]="backend-ui-design"
)

# Get current commit SHA for version tracking
echo "Fetching latest commit SHA from ${REPO}@${BRANCH}..."
COMMIT_SHA=$(gh api "repos/${REPO}/commits/${BRANCH}" --jq '.sha' 2>/dev/null || echo "unknown")
echo "Source: ${REPO}@${COMMIT_SHA:0:7}"
echo ""

fetch_file() {
  local url="$1"
  local dest="$2"
  local http_code

  mkdir -p "$(dirname "$dest")"
  http_code=$(curl -sL -w "%{http_code}" -o "$dest" "$url")

  if [ "$http_code" != "200" ]; then
    echo "  WARN: HTTP ${http_code} for $(basename "$dest") — skipping"
    rm -f "$dest"
    return 1
  fi
  return 0
}

for local_name in "${!SKILL_MAP[@]}"; do
  remote_name="${SKILL_MAP[$local_name]}"
  dest_dir="${SKILLS_DIR}/${local_name}"

  echo "Syncing ${local_name} ← ${remote_name}..."

  # Fetch SKILL.md
  fetch_file "${BASE_URL}/${remote_name}/SKILL.md" "${dest_dir}/SKILL.md" || continue

  # Rename skill name field to om-prefixed version
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/^name: ${remote_name}$/name: ${local_name}/" "${dest_dir}/SKILL.md"
  else
    sed -i "s/^name: ${remote_name}$/name: ${local_name}/" "${dest_dir}/SKILL.md"
  fi

  # Fetch references/ directory via GitHub API
  refs_json=$(gh api "repos/${REPO}/contents/.ai/skills/${remote_name}/references" 2>/dev/null || echo "[]")

  if [ "$refs_json" != "[]" ] && echo "$refs_json" | jq -e '.[0].name' &>/dev/null; then
    mkdir -p "${dest_dir}/references"
    echo "$refs_json" | jq -r '.[].name' | while read -r ref_file; do
      echo "  + references/${ref_file}"
      fetch_file "${BASE_URL}/${remote_name}/references/${ref_file}" "${dest_dir}/references/${ref_file}"
    done
  fi

  echo ""
done

# Save version info
echo "${COMMIT_SHA}" > "${SKILLS_DIR}/.om-sync-version"
echo "Done. Source commit: ${COMMIT_SHA:0:7}"
echo ""
echo "Next steps:"
echo "  git diff skills/"
echo "  git add skills/"
echo "  git commit -m \"chore: sync OM skills from ${REPO}@${COMMIT_SHA:0:7}\""
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/sync-om-skills.sh
```

- [ ] **Step 3: Run sync script to vendor initial OM skills**

```bash
bash scripts/sync-om-skills.sh
```

Expected output: 7 skills synced, each with SKILL.md and references/ files.

- [ ] **Step 4: Verify vendored files**

```bash
find skills/om-code-review skills/om-implement-spec skills/om-spec-writing \
     skills/om-pre-implement-spec skills/om-integration-tests \
     skills/om-integration-builder skills/om-backend-ui-design \
     -type f | sort
```

Expected: 13 files (7 SKILL.md + 6 reference files):
- `skills/om-code-review/SKILL.md`
- `skills/om-code-review/references/review-checklist.md`
- `skills/om-implement-spec/SKILL.md`
- `skills/om-implement-spec/references/code-review-compliance.md`
- `skills/om-spec-writing/SKILL.md`
- `skills/om-spec-writing/references/compliance-review.md`
- `skills/om-spec-writing/references/spec-checklist.md`
- `skills/om-spec-writing/references/spec-template.md`
- `skills/om-pre-implement-spec/SKILL.md`
- `skills/om-integration-tests/SKILL.md`
- `skills/om-integration-builder/SKILL.md`
- `skills/om-integration-builder/references/adapter-contracts.md`
- `skills/om-backend-ui-design/SKILL.md`
- `skills/om-backend-ui-design/references/ui-components.md`

- [ ] **Step 5: Verify frontmatter was renamed**

```bash
grep "^name:" skills/om-*/SKILL.md
```

Expected: all show `name: om-*` prefix, not the original names.

- [ ] **Step 6: Commit sync script + vendored skills**

```bash
git add scripts/ skills/om-code-review/ skills/om-implement-spec/ \
       skills/om-spec-writing/ skills/om-pre-implement-spec/ \
       skills/om-integration-tests/ skills/om-integration-builder/ \
       skills/om-backend-ui-design/ skills/.om-sync-version
git commit -m "feat: add sync script and vendor 7 OM platform skills"
```

---

### Task 5: Write README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README.md**

```markdown
# om-claude-plugin

Claude Code plugin for Open Mercato developers. 10 skills covering the full OM developer lifecycle: spec writing, platform challenge, UI review, implementation, and code review.

## Install

```bash
/plugin install https://github.com/SHGrowth/om-claude-plugin.git
```

### Prerequisites

- [Claude Code](https://claude.ai/code) (or Cursor with plugin support)
- [GitHub CLI](https://cli.github.com/) (`gh`) — authenticated, for om-piotr platform search
- Recommended: [superpowers](https://github.com/obra/superpowers) plugin

## Skills

### Spec & Design

| Skill | When to use |
|-------|-------------|
| `om-mat` | Starting a new feature, module, or spec — business context, workflows, user stories |
| `om-piotr` | Before any code — gap analysis, "does OM already do X?", atomic commit estimation |
| `om-krug` | After UI architecture is defined — navigation, task completion, cognitive load review |

### Implementation

| Skill | When to use |
|-------|-------------|
| `om-spec-writing` | Creating architecturally compliant specifications |
| `om-pre-implement-spec` | Before implementation — backward compatibility impact, risk analysis |
| `om-implement-spec` | Multi-phase spec implementation with coordinated subagents |
| `om-integration-tests` | Creating or running Playwright integration tests |
| `om-integration-builder` | Building provider packages (payment, shipping, data sync) |
| `om-backend-ui-design` | Designing backend UI pages within OM framework |

### Quality

| Skill | When to use |
|-------|-------------|
| `om-code-review` | After completing a feature, before merging — CI/CD gate + full OM checklist |

### Developer Flow

```
om-mat → om-piotr → om-krug → om-spec-writing → om-pre-implement-spec → om-implement-spec → om-code-review
```

## How it works

The plugin auto-detects OM projects (looks for `@open-mercato/` in package.json, "Open Mercato" in AGENTS.md, or `.ai/` directory) and injects available skills into the session context.

Invoke any skill via the Skill tool: `skill: "om-code-review"`

## Syncing OM platform skills

7 of the 10 skills are vendored from [open-mercato/open-mercato](https://github.com/open-mercato/open-mercato). To update them:

```bash
# Fetch latest skills from OM repo (develop branch)
bash scripts/sync-om-skills.sh

# Review what changed
git diff skills/

# Commit the update
git add skills/
git commit -m "chore: sync OM skills from open-mercato/open-mercato@$(cat skills/.om-sync-version | head -c7)"

# Tag a release
git tag v1.x.x
git push origin main --tags
```

The sync script:
1. Fetches each skill's `SKILL.md` and `references/` from `raw.githubusercontent.com`
2. Renames the `name:` field in frontmatter to add `om-` prefix
3. Saves the source commit SHA to `skills/.om-sync-version`

### When to sync

Before each plugin release. Skills change when OM platform patterns change — typically a few times per month.

## License

MIT
```

- [ ] **Step 2: Commit README**

```bash
git add README.md
git commit -m "docs: add README with install, skills, and sync instructions"
```

---

### Task 6: Test plugin installation

- [ ] **Step 1: Push to GitHub**

```bash
git push -u origin main
```

- [ ] **Step 2: Test direct install**

In a new Claude Code session:

```
/plugin install https://github.com/SHGrowth/om-claude-plugin.git
```

Expected: plugin installs without errors.

- [ ] **Step 3: Test SessionStart hook**

Start a new Claude Code session in an OM project directory (e.g., `ready-apps/apps/prm/`).

Expected: session context includes the OM skills list.

- [ ] **Step 4: Test skill invocation**

In the session, invoke a skill:

```
Use the om-code-review skill to review the latest commit.
```

Expected: Claude reads `skills/om-code-review/SKILL.md` and follows the workflow.

- [ ] **Step 5: Test non-OM project**

Start a new Claude Code session in a non-OM directory.

Expected: hook injects nothing (silent). Skills still available if explicitly invoked.

- [ ] **Step 6: Verify all 10 skills are discoverable**

Ask Claude: "What om-* skills are available?"

Expected: all 10 listed.

---

### Task 7: Clean up ready-apps (optional, after plugin is confirmed working)

- [ ] **Step 1: Remove skills from ready-apps**

Skills have moved to `om-claude-plugin`. Remove from ready-apps:

```bash
cd /Users/maciejgren/Documents/OM-PRM/ready-apps
rm -rf skills/mat skills/piotr skills/krug skills/templates
```

- [ ] **Step 2: Update ready-apps AGENTS.md and skills/CLAUDE.md**

Remove references to mat/piotr/krug skills. Add note pointing to `om-claude-plugin`.

- [ ] **Step 3: Remove symlinks from ~/.claude/skills/**

```bash
rm ~/.claude/skills/mat ~/.claude/skills/piotr
```

- [ ] **Step 4: Commit ready-apps cleanup**

```bash
cd /Users/maciejgren/Documents/OM-PRM/ready-apps
git add -A
git commit -m "chore: remove skills moved to SHGrowth/om-claude-plugin"
```
