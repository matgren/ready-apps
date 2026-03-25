"use client"

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { Spinner } from '@open-mercato/ui/primitives/spinner'

type RfpCampaignRow = {
  id: string
  title: string
  description: string
  deadline: string
  audience: string
  status: string
  winnerOrganizationId?: string | null
  createdAt: string
  created_at?: string
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  awarded: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
}

export default function RfpCampaignsPage() {
  const t = useT()
  const [items, setItems] = React.useState<RfpCampaignRow[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      const call = await apiCall<{ items: RfpCampaignRow[] }>('/api/partnerships/rfp-campaigns')
      if (call.ok && call.result?.items) {
        setItems(call.result.items)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <Page>
        <PageBody>
          <div className="flex h-64 items-center justify-center">
            <Spinner className="h-8 w-8 text-muted-foreground" />
          </div>
        </PageBody>
      </Page>
    )
  }

  return (
    <Page>
      <PageBody>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {t('partnerships.rfpCampaigns.title', 'RFP Campaigns')} ({items.length})
          </h2>
          <a
            href="/backend/partnerships/rfp-campaigns/create"
            className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t('partnerships.rfpCampaigns.createButton', 'Create Campaign')}
          </a>
        </div>

        {items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <p className="text-muted-foreground">
              {t('partnerships.rfpCampaigns.noData', 'No RFP campaigns yet.')}
            </p>
            <a
              href="/backend/partnerships/rfp-campaigns/create"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('partnerships.rfpCampaigns.createButton', 'Create Campaign')}
            </a>
          </div>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">
                    {t('partnerships.rfpCampaigns.columns.title', 'Title')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {t('partnerships.rfpCampaigns.columns.status', 'Status')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {t('partnerships.rfpCampaigns.columns.deadline', 'Deadline')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {t('partnerships.rfpCampaigns.columns.audience', 'Audience')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {t('partnerships.rfpCampaigns.columns.created', 'Created')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((campaign) => {
                  const createdDate = campaign.createdAt || campaign.created_at
                  return (
                    <tr key={campaign.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <a
                          href={`/backend/partnerships/rfp-campaigns/${campaign.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {campaign.title}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_BADGE[campaign.status] ?? STATUS_BADGE.draft
                        }`}>
                          {t(`partnerships.rfpCampaigns.status.${campaign.status}`, campaign.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString() : '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t(`partnerships.rfpCampaigns.audience.${campaign.audience}`, campaign.audience)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {createdDate ? new Date(createdDate).toLocaleDateString() : '\u2014'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
