# Upstream Flags — PRM App Spec

## US-1.1b: Email invitation flow (Phase 4)

### Upstream investigation
- **Scope:** `core-module` — auth module changes needed
- **Needed capability:** Invite User by email (send link, user sets own password)
- **Spec found:** `SPEC-038-2026-02-23-invite-user-email.md` — full spec exists in `.ai/specs/`
  - Adds `sendInviteEmail` flag to `auth.users.create` command
  - Reuses `PasswordReset` entity with 48h token expiry
  - New command: `auth.users.resend_invite`
  - Modifies `CreateUserPage` UI with invite toggle
  - Clean, minimal design — no new entities or modules
- **Issues/PRs found:** None open on `open-mercato/open-mercato`
- **On develop branch:** No — not implemented. Zero commits matching SPEC-038 or invite flow.
- **Recommendation:** Submit PR implementing SPEC-038 during Phase 2-3 work. Spec is already approved and designed. Implementation is straightforward (the spec reuses existing PasswordReset mechanism). If PR is merged before Phase 4 starts, the 2 commits become `app` scope (just configure the invite in PRM's setup.ts). If not merged in time, Phase 4 keeps self-onboard workaround until upstream merges.

### Timeline
- Spec written: 2026-02-23
- Implementation: not started
- Risk: low — spec is approved, design is clean, no architectural debate expected
- Mitigation: submit PR early, self-onboard workaround covers until merge

---

## defaultRoleFeatures ignores custom role keys (Phase 1 blocker — workaround active)

### Upstream investigation
- **Scope:** `core-module` — auth module `setup-app.ts`
- **Needed capability:** `defaultRoleFeatures` should process arbitrary role keys, not just superadmin/admin/employee
- **Spec found:** None
- **Issues/PRs found:** PR #1040 submitted (https://github.com/open-mercato/open-mercato/pull/1040)
- **On develop branch:** No — not implemented
- **Recommendation:** PR submitted. App workaround: `seedPrmRoles` manually creates RoleAcl entries for custom roles.

### Impact
- Every OM app with custom roles (PRM, CFP, any future app) hits this
- Without fix, custom role features silently ignored during `yarn initialize`
- Workaround: manually seed RoleAcl in module's `seedDefaults`

### Timeline
- PR submitted: 2026-03-20
- Risk: low — fix is 22 lines, backward compatible, no architectural debate
- Mitigation: workaround in seedPrmRoles is stable

---

## Per-org feature scoping for PM role (Phase 2+ enhancement)

### Upstream investigation
- **Scope:** `core-module` — auth module RBAC
- **Needed capability:** Different feature sets per organization for the same role. E.g., PM gets `customers.*` in own org but `customers.*.view` in agency orgs.
- **Spec found:** None
- **Issues/PRs found:** None
- **On develop branch:** No — `RoleAcl.featuresJson` applies to all visible orgs equally
- **Recommendation:** This is a significant RBAC enhancement. Phase 1 workaround: PM gets `customers.*` everywhere (procedural read-only on agencies). Acceptable for small partner programs. For Phase 2+, propose upstream spec for per-org feature override.

### Impact
- PM can technically edit agency CRM data in Phase 1 — no enforcement
- Acceptable for trust-based partner program with ~15 agencies
- Becomes a problem at scale (50+ agencies, multiple PMs)

### Timeline
- Spec: not written — needs upstream discussion
- Risk: medium — architectural change to RBAC, may require schema migration
- Mitigation: Phase 1 workaround is acceptable for MVP scope
