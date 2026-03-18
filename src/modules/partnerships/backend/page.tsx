'use client'
import { Page, PageHeader, PageBody } from '@open-mercato/ui/backend/Page'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function PartnershipsDashboard() {
  const t = useT()
  return (
    <Page>
      <PageHeader
        title={t('partnerships.pageTitle', 'Partnerships')}
        description={t('partnerships.description', 'B2B Partner Relationship Management — agencies, tiers, KPIs, RFPs.')}
      />
      <PageBody>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            {t('partnerships.dashboard.placeholder', 'Dashboard under construction. Agency, Tier, KPI, and RFP pages coming soon.')}
          </p>
        </div>
      </PageBody>
    </Page>
  )
}
