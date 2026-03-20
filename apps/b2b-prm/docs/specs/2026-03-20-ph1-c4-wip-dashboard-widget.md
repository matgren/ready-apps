# Phase 1, Commit 4: KPI Dashboard Widget — WIP Count + API Route

## Source
- App Spec sections: §1.4.2 (WIP count formula), §1.4.3 (cross-org visibility rules)
- User stories: US-2.3
- Commit plans: commits-WF1.md Commit 4 + commits-WF2.md Commits 5–6

## What This Delivers
After this commit, the PM dashboard shows a "WIP This Month" tile displaying the count of deals that first reached SQL stage in the current month. BD/Admin see their own org's WIP count. PM sees the currently selected org's WIP count via the org switcher. The widget uses a live query (no batch aggregation) via a dedicated API endpoint.

## Acceptance Criteria
From App Spec §7 Phase 1 (Vernon domain criteria):
- [ ] WIP live-query widget scopes by authenticated user's org (or PM's switched org) — no unscoped cross-org counts
- [ ] `wip_registered_at` stored in UTC; WIP period attribution uses UTC month boundaries (stamped 2026-03-31T23:59:59Z = March)

From App Spec §7 Phase 1 (Mat business criteria):
- [ ] BD can log a deal and move it to SQL → WIP count appears on dashboard immediately
- [ ] PM can switch between agencies and see each agency's WIP count

## Files
| File | Action | Purpose |
|------|--------|---------|
| `src/modules/prm/api/get/wip-count.ts` | Create | `GET /api/prm/wip-count?month=YYYY-MM` — returns `{ count, month }`, org-scoped, feature-gated. Exports `handler`, `metadata`, and `openApi`. |
| `src/modules/prm/data/validators.ts` | Create | Zod schemas: `wipCountQuerySchema` (`month` as `z.string().regex(/^\d{4}-\d{2}$/).optional()`), `wipCountResponseSchema` |
| `src/modules/prm/widgets/dashboard/wip-count/widget.ts` | Create | Server-side widget definition: metadata, lazy import, settings |
| `src/modules/prm/widgets/dashboard/wip-count/widget.client.tsx` | Create | Client component: fetches WIP count, renders tile with count and month label |
| `src/modules/prm/widgets/dashboard/wip-count/config.ts` | Create | Widget settings type + hydration (month selector) |
| `src/modules/prm/widgets/injection-table.ts` | Create | Widget-to-slot mapping (dashboard:widgets entry) |
| `src/i18n/en.json` | Modify | Add i18n keys: `prm.dashboard.wipCount`, `prm.dashboard.wipCountDescription`, `prm.dashboard.noData`, `prm.dashboard.invalidMonth` |

## OM Patterns Used
- **Custom GET API route** — handler + `openApi` export, `metadata` with auth guards
  - Reference: `packages/core/src/modules/translations/api/get/locales.ts`
- **Dashboard widget** — `lazyDashboardWidget()` + `DashboardWidgetModule` + `injection-table.ts`
  - Reference: `packages/core/src/modules/customers/widgets/dashboard/new-customers/`
- **Widget settings** — `hydrateSettings()` / `dehydrateSettings()` for month selection
  - Reference: `packages/core/src/modules/customers/widgets/dashboard/new-customers/config.ts`

## Implementation Notes

### API Route: GET /api/prm/wip-count

```typescript
export const metadata = {
  path: '/prm/wip-count',
  GET: { requireAuth: true, requireFeatures: ['prm.widgets.wip-count'] },
}
```

**Zod validation** (in `data/validators.ts`):
```typescript
export const wipCountQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

export const wipCountResponseSchema = z.object({
  count: z.number().int().nonneg(),
  month: z.string(),
})
```

**OpenAPI export** (required by OM convention):
```typescript
export const openApi: OpenApiRouteDoc = {
  tag: 'PRM',
  summary: 'WIP count for a given month',
  methods: {
    GET: {
      summary: 'Get WIP count for current org and month',
      tags: ['PRM'],
      responses: [
        { status: 200, description: 'WIP count', schema: wipCountResponseSchema },
        { status: 422, description: 'Invalid month format' },
      ],
    },
  },
}
```

Query parameters:
- `month` (optional, format: `YYYY-MM`, defaults to current month). Validated with Zod — malformed values return 422.

Response:
```json
{ "count": 7, "month": "2026-03" }
```

### Custom Field Query (EAV Pattern)
OM stores custom field values in the `custom_field_values` table (EAV pattern), NOT as columns on entity tables. The query JOINs `custom_field_values` to count deals with a `wip_registered_at` value in the target month:

```sql
SELECT COUNT(DISTINCT d.id)
FROM customers_deal d
JOIN custom_field_values cfv
  ON cfv.record_id = CAST(d.id AS TEXT)
  AND cfv.entity_id = 'customers:deal'
  AND cfv.field_key = 'wip_registered_at'
  AND cfv.tenant_id = :tenantId
WHERE d.organization_id = :orgId
  AND d.tenant_id = :tenantId
  AND cfv.value_text IS NOT NULL
  AND cfv.value_text >= :monthStart     -- e.g., '2026-03-01T00:00:00.000Z'
  AND cfv.value_text < :monthEnd        -- e.g., '2026-04-01T00:00:00.000Z'
```

Note: `value_text` stores ISO 8601 datetime strings. String comparison works correctly for UTC month boundaries because ISO 8601 sorts lexicographically.

### Org Scoping
- `context.organizationId` provides the correct org:
  - For BD/Admin: their own org
  - For PM: the org selected in the org switcher (platform handles this transparently)
- No special PM case needed — the org switcher already scopes the context.

### Widget Component
- `mode === 'display'`: Shows large count number + month label + "WIP This Month" title
- `mode === 'settings'`: Month selector (current month default, can go back 12 months)
- Uses `apiCall('/api/prm/wip-count?month=...')` for data fetch
- `supportsRefresh: true` — user can manually refresh
- `defaultSize: 'sm'` — compact tile

### Feature Gate
Widget visible to roles with `prm.widgets.wip-count` feature:
- `partner_admin`, `partner_member`, `partnership_manager` (from Commit 1 role mapping)
- `partner_contributor` does NOT see this widget

## Verification
```bash
yarn generate          # Regenerate (widget files added)
yarn typecheck         # Must pass
yarn build             # Must pass
# Manual:
#   1. GET /api/prm/wip-count → { count: 0, month: "2026-03" } (no deals yet)
#   2. Create deal, move to SQL → GET /api/prm/wip-count → { count: 1, month: "2026-03" }
#   3. Dashboard shows WIP tile with count
#   4. Switch org as PM → count updates to selected org's WIP
#   5. GET /api/prm/wip-count?month=2026-02 → count for February
```
