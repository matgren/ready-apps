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
