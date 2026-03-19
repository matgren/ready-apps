import type {
  SearchModuleConfig,
  SearchBuildContext,
  SearchIndexSource,
  SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

export const config: SearchModuleConfig = {
  entities: [
    {
      entityId: 'partnerships:partner_agency',
      enabled: true,
      priority: 8,

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const lines: string[] = []
        const record = ctx.record
        if (record.agencyOrganizationId) lines.push(`Organization: ${record.agencyOrganizationId}`)
        if (record.status) lines.push(`Status: ${record.status}`)
        if (record.onboardedAt) lines.push(`Onboarded: ${record.onboardedAt}`)
        if (!lines.length) return null

        return {
          text: lines,
          presenter: {
            title: String(record.agencyOrganizationId ?? record.id ?? 'Agency'),
            subtitle: record.status ? String(record.status) : undefined,
            icon: 'building',
            badge: 'Partner Agency',
          },
          checksumSource: {
            id: record.id,
            status: record.status,
            onboardedAt: record.onboardedAt,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const { record } = ctx
        return {
          title: String(record.agencyOrganizationId ?? record.id ?? 'Agency'),
          subtitle: record.status ? String(record.status) : undefined,
          icon: 'building',
          badge: 'Partner Agency',
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => {
        const id = ctx.record.id
        if (!id) return null
        return `/backend/agencies/${encodeURIComponent(String(id))}`
      },

      fieldPolicy: {
        searchable: ['agencyOrganizationId', 'status'],
        hashOnly: [],
        excluded: [],
      },
    },
  ],
}

export const searchConfig = config

export default config
