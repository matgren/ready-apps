# Phase 1, Commit 3: WIP Interceptor — Stamp wip_registered_at on First SQL Stage Transition

## Source
- App Spec sections: §1.3 (WIP definition), §1.4.2 (WIP registration), §1.4.3 (immutability rule)
- User stories: US-2.2
- Commit plans: commits-WF1.md Commit 3 / commits-WF2.md Commit 4

## What This Delivers
After this commit, when a BD moves a deal to the SQL stage (or any stage with order >= SQL) for the first time, the system automatically stamps `wip_registered_at` with the current UTC timestamp. This stamp is immutable — moving the deal backward and forward does not re-stamp. BD cannot write this field directly. This is the core WIP counting mechanism.

## Acceptance Criteria
From App Spec §7 Phase 1 (Vernon domain criteria):
- [ ] `wip_registered_at` is never overwritten once set — moving a stamped deal backward and forward does not change the timestamp
- [ ] `wip_registered_at` is only stamped when deal transitions INTO SQL+ for the first time — not on creation, not on non-qualifying stage changes
- [ ] A deal without `wip_registered_at` does not appear in any WIP count regardless of pipeline stage
- [ ] `wip_registered_at` stored in UTC; WIP period attribution uses UTC month boundaries
- [ ] BD cannot create or modify `wip_registered_at` directly — only the API interceptor writes it
- [ ] PM's org switcher reads are read-only — no write operations through switched-org context

From App Spec §7 Phase 1 (Mat business criteria):
- [ ] BD can log a deal and move it to SQL → WIP count appears on dashboard immediately (live query — dashboard in Commit 4)

## Files
| File | Action | Purpose |
|------|--------|---------|
| `src/modules/prm/api/interceptors.ts` | Create | `after` hook on `customers/deals` POST and PATCH — stamps `wip_registered_at` on first SQL+ transition |

## OM Patterns Used
- **API interceptor (after hook)** — `ApiInterceptor` with `targetRoute`, `methods`, `after()` callback
  - Reference: `packages/core/src/modules/payment_gateways/api/interceptors.ts`
  - Reference: `packages/core/src/modules/shipping_carriers/api/interceptors.ts`
- **Custom field value write (EAV)** — write to `CustomFieldValue` entity via entities module
  - Reference: `packages/core/src/modules/entities/data/entities.ts` (CustomFieldValue entity)
  - Reference: `packages/shared/src/lib/crud/custom-fields.ts` (normalization helpers)

## Implementation Notes

### Custom Field Storage Model
OM stores custom field values in an **EAV pattern** using the `custom_field_values` table — NOT as columns on entity tables. The `cf_` prefix is used only in API response normalization, not in the database schema.

To write `wip_registered_at`:
1. Look up the `CustomFieldDef` for key `wip_registered_at` on entity `customers:deal`
2. Create or update a `CustomFieldValue` record with `recordId = deal.id`, `fieldKey = 'wip_registered_at'`, `value_text = new Date().toISOString()`
3. The `value_text` column is used for dateTime values (stored as ISO 8601 string)

To read `wip_registered_at`:
- Query `CustomFieldValue` WHERE `entityId = 'customers:deal'` AND `recordId = deal.id` AND `fieldKey = 'wip_registered_at'`

### Why Both POST and PATCH
Deal creation (POST) sets `pipelineStageId` in a single atomic operation — no subsequent PATCH is triggered. If a deal is created directly at SQL stage or above, the PATCH interceptor alone would miss it. Therefore the interceptor must handle **both** POST (deal creation) and PATCH (stage change).

### Interceptor Logic
```
after(response, context):
  1. Only fire on successful response (response.ok === true)
  2. Extract deal record from response body (includes pipelineStageId)
  3. If no pipelineStageId in response → skip
  4. Load the pipeline stage record from em using pipelineStageId
  5. Check stage.value (the key field) — compare against SQL_STAGE_KEY ('sql') from data/pipeline.ts
  6. If stage is before SQL: look up stage order, compare against SQL stage order → skip if below
  7. Query CustomFieldValue for this deal's wip_registered_at
  8. If wip_registered_at value already exists → skip (immutability — no re-stamp)
  9. Create CustomFieldValue record: entityId='customers:deal', recordId=deal.id,
     fieldKey='wip_registered_at', value_text=new Date().toISOString()
  10. em.flush()
```

### Stage Identification
Use **key-based lookup** (`stage.value === 'sql'`), not order index. This is robust against stage reordering or insertion. The `SQL_STAGE_KEY` constant from `data/pipeline.ts` keeps the interceptor and seed in sync.

To determine "SQL or above": load all stages for the PRM pipeline, find the SQL stage by key, then compare order indices. This handles Won/Proposal/etc. correctly.

### Key Design Decisions
- **`after` hook, not `before`** — the deal operation has already succeeded by the time we stamp. No risk of blocking the deal creation/update if stamping fails.
- **Key-based stage identification** — `stage.value === 'sql'` is more robust than order index comparison. Survives stage reordering.
- **Org scoping** — interceptor reads `context.organizationId` to confirm the deal belongs to the org. Platform already scopes this, but double-check for safety.
- **No `before` hook to block BD writes** — `wip_registered_at` is seeded with `formEditable: false` (Commit 1), so the CRM form doesn't render an input for it.

### Error Handling
If `em.flush()` fails after stamping:
- Call `em.clear()` to prevent inconsistent EM state
- Log error but do NOT fail the response (deal operation already succeeded)
- The stamp will be retried on the next qualifying stage transition (idempotent — checks if value already exists)

### Route Targeting
```typescript
{
  id: 'prm.wip-stamp',
  targetRoute: 'customers/deals/*',
  methods: ['POST', 'PATCH'],
  priority: 100,
}
```

## Verification
```bash
yarn typecheck         # Must pass
yarn build             # Must pass
# Manual test sequence:
#   1. Create deal at "New" stage → wip_registered_at is null
#   2. Move deal to "Contacted" → wip_registered_at still null
#   3. Move deal to "SQL" → wip_registered_at stamped with current UTC
#   4. Move deal back to "Qualified" → wip_registered_at unchanged
#   5. Move deal forward to "SQL" again → wip_registered_at unchanged (no re-stamp)
#   6. Move deal to "Won" → wip_registered_at unchanged
#   7. Create deal directly at "Proposal" stage → wip_registered_at stamped (POST interceptor)
#   8. Create deal at "New" stage → wip_registered_at is null (POST interceptor skips pre-SQL)
```
