"use client"

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { Spinner } from '@open-mercato/ui/primitives/spinner'

type RfpCampaign = {
  id: string
  title: string
  description: string
  deadline: string
  audience: string
  selectedAgencyIds?: string[] | null
  selected_agency_ids?: string[] | null
  status: string
  winnerOrganizationId?: string | null
  winner_organization_id?: string | null
  organizationId: string
  organization_id?: string
  createdBy: string
  created_by?: string
  createdAt: string
  created_at?: string
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  awarded: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
}

export default function RfpCampaignDetailPage() {
  const t = useT()
  const params = useParams()
  const router = useRouter()
  const campaignId = params?.id as string

  const [campaign, setCampaign] = React.useState<RfpCampaign | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [publishing, setPublishing] = React.useState(false)

  React.useEffect(() => {
    if (!campaignId) return

    async function load() {
      const call = await apiCall<{ items: RfpCampaign[] }>(
        `/api/partnerships/rfp-campaigns?page=1&pageSize=1&search=`
      )
      if (call.ok && call.result?.items) {
        const found = call.result.items.find((c) => c.id === campaignId)
        if (found) {
          setCampaign(found)
        } else {
          // Retry with a broader fetch - the campaign might not be in page 1
          const retryCall = await apiCall<{ items: RfpCampaign[] }>(
            `/api/partnerships/rfp-campaigns?pageSize=100`
          )
          if (retryCall.ok && retryCall.result?.items) {
            const retryFound = retryCall.result.items.find((c) => c.id === campaignId)
            if (retryFound) {
              setCampaign(retryFound)
            } else {
              setError(t('partnerships.rfpCampaigns.notFound', 'Campaign not found'))
            }
          } else {
            setError(t('partnerships.rfpCampaigns.loadError', 'Failed to load campaign'))
          }
        }
      } else {
        setError(t('partnerships.rfpCampaigns.loadError', 'Failed to load campaign'))
      }
      setLoading(false)
    }
    load()
  }, [campaignId, t])

  async function handlePublish() {
    if (!campaign) return
    setPublishing(true)

    const call = await apiCall<{ ok: boolean }>('/api/partnerships/rfp-campaigns-publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: campaign.id }),
    })

    setPublishing(false)

    if (call.ok) {
      flash(t('partnerships.rfpCampaigns.published', 'Campaign published successfully'))
      setCampaign({ ...campaign, status: 'open' })
    } else {
      const result = call.result as Record<string, unknown> | null
      flash(typeof result?.error === 'string' ? result.error : t('partnerships.rfpCampaigns.publishError', 'Failed to publish campaign'))
    }
  }

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

  if (error || !campaign) {
    return (
      <Page>
        <PageBody>
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <p className="text-muted-foreground">{error ?? t('partnerships.rfpCampaigns.notFound', 'Campaign not found')}</p>
            <a
              href="/backend/partnerships/rfp-campaigns"
              className="text-sm text-primary hover:underline"
            >
              {t('partnerships.rfpCampaigns.backToList', 'Back to Campaigns')}
            </a>
          </div>
        </PageBody>
      </Page>
    )
  }

  const deadlineDate = campaign.deadline ? new Date(campaign.deadline) : null
  const createdDate = campaign.createdAt || campaign.created_at
  const agencyIds = campaign.selectedAgencyIds ?? campaign.selected_agency_ids
  const winnerId = campaign.winnerOrganizationId ?? campaign.winner_organization_id

  return (
    <Page>
      <PageBody>
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{campaign.title}</h2>
              <div className="mt-1 flex items-center gap-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_BADGE[campaign.status] ?? STATUS_BADGE.draft
                }`}>
                  {t(`partnerships.rfpCampaigns.status.${campaign.status}`, campaign.status)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {campaign.status === 'draft' && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {publishing ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      {t('partnerships.rfpCampaigns.publishing', 'Publishing...')}
                    </>
                  ) : (
                    t('partnerships.rfpCampaigns.publishButton', 'Publish')
                  )}
                </button>
              )}
              <a
                href="/backend/partnerships/rfp-campaigns"
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted/50"
              >
                {t('partnerships.rfpCampaigns.backToList', 'Back to Campaigns')}
              </a>
            </div>
          </div>

          {/* Awarded banner */}
          {campaign.status === 'awarded' && winnerId && (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
              {t('partnerships.rfpCampaigns.awardedBanner', 'This campaign has been awarded.')}
            </div>
          )}

          {/* Details */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                {t('partnerships.rfpCampaigns.fields.description', 'Description')}
              </h3>
              <p className="text-sm whitespace-pre-wrap">{campaign.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('partnerships.rfpCampaigns.fields.deadline', 'Deadline')}
                </h3>
                <p className="text-sm">
                  {deadlineDate ? deadlineDate.toLocaleDateString() : '\u2014'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('partnerships.rfpCampaigns.fields.audience', 'Audience')}
                </h3>
                <p className="text-sm">
                  {t(`partnerships.rfpCampaigns.audience.${campaign.audience}`, campaign.audience)}
                  {campaign.audience === 'selected' && agencyIds && (
                    <span className="text-muted-foreground ml-1">
                      ({agencyIds.length} {t('partnerships.rfpCampaigns.agenciesSelected', 'agencies')})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('partnerships.rfpCampaigns.fields.created', 'Created')}
                </h3>
                <p className="text-sm">
                  {createdDate ? new Date(createdDate).toLocaleDateString() : '\u2014'}
                </p>
              </div>
            </div>
          </div>

          {/* Responses section (placeholder for Task 4) */}
          {campaign.status === 'open' && (
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-3">
                {t('partnerships.rfpCampaigns.responses', 'Responses')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('partnerships.rfpCampaigns.noResponses', 'No responses yet.')}
              </p>
            </div>
          )}
        </div>
      </PageBody>
    </Page>
  )
}
