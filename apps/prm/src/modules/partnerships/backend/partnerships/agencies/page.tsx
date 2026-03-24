"use client"

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { Button } from '@/components/ui/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { TIER_THRESHOLDS } from '../../../data/tier-thresholds'

type AgencyListItem = {
  organizationId: string
  name: string
  adminEmail: string | null
  wipCount: number
  wicScore: number
  minCount: number
  createdAt: string
  currentTier: string | null
}

function ChangeTierDialog({
  agency,
  onClose,
  onDone,
}: {
  agency: AgencyListItem
  onClose: () => void
  onDone: () => void
}) {
  const t = useT()
  const [selectedTier, setSelectedTier] = React.useState(agency.currentTier ?? TIER_THRESHOLDS[0].tier)
  const [reason, setReason] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) return
    setSubmitting(true)
    setError(null)
    const call = await apiCall<{ success: boolean; error?: string }>(
      '/api/partnerships/tier-assign',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: agency.organizationId,
          tier: selectedTier,
          reason: reason.trim(),
        }),
      },
    )
    setSubmitting(false)
    if (call.ok) {
      flash(t('partnerships.agencies.tierChanged', 'Tier updated successfully'))
      onDone()
    } else {
      const msg = (call.result as Record<string, unknown>)?.error
      setError(typeof msg === 'string' ? msg : 'Failed to update tier')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      if (reason.trim() && !submitting) {
        handleSubmit(e as unknown as React.FormEvent)
      }
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-1">
          {t('partnerships.agencies.changeTier', 'Change Tier')}: {agency.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('partnerships.agencies.currentTier', 'Current Tier')}: {agency.currentTier ?? t('partnerships.agencies.noTier', 'No tier')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="tier-select">
              {t('partnerships.agencies.changeTier', 'Change Tier')}
            </label>
            <select
              id="tier-select"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
            >
              {TIER_THRESHOLDS.map((threshold) => (
                <option key={threshold.tier} value={threshold.tier}>
                  {threshold.tier}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="tier-reason">
              {t('partnerships.agencies.changeTierReason', 'Reason for tier change')} *
            </label>
            <textarea
              id="tier-reason"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('partnerships.agencies.changeTierReason', 'Reason for tier change')}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting || !reason.trim()}
            >
              {submitting ? 'Saving...' : t('partnerships.agencies.changeTier', 'Change Tier')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AgenciesPage() {
  const t = useT()
  const [agencies, setAgencies] = React.useState<AgencyListItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogAgency, setDialogAgency] = React.useState<AgencyListItem | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    const call = await apiCall<{ agencies: AgencyListItem[] }>('/api/partnerships/agencies')
    if (call.ok && call.result) {
      setAgencies(call.result.agencies)
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  function handleDone() {
    setDialogAgency(null)
    load()
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

  if (agencies.length === 0) {
    return (
      <Page>
        <PageBody>
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <p className="text-muted-foreground">No agencies yet. Add your first agency to start the partner program.</p>
            <a
              href="/backend/partnerships/add-agency"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add Agency
            </a>
          </div>
        </PageBody>
      </Page>
    )
  }

  return (
    <Page>
      <PageBody>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{agencies.length} Agencies</h2>
          <a
            href="/backend/partnerships/add-agency"
            className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add Agency
          </a>
        </div>
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Agency</th>
                <th className="px-4 py-3 text-left font-medium">{t('partnerships.agencies.currentTier', 'Current Tier')}</th>
                <th className="px-4 py-3 text-left font-medium">Admin Email</th>
                <th className="px-4 py-3 text-right font-medium">WIP (this month)</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((agency) => (
                <tr key={agency.organizationId} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{agency.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {agency.currentTier ?? t('partnerships.agencies.noTier', 'No tier')}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{agency.adminEmail ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{agency.wipCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(agency.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setDialogAgency(agency)}
                    >
                      {t('partnerships.agencies.changeTier', 'Change Tier')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {dialogAgency && (
          <ChangeTierDialog
            agency={dialogAgency}
            onClose={() => setDialogAgency(null)}
            onDone={handleDone}
          />
        )}
      </PageBody>
    </Page>
  )
}
