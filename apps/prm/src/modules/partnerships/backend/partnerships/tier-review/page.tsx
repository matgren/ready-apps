"use client"

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@/components/ui/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Spinner } from '@open-mercato/ui/primitives/spinner'

type Proposal = {
  id: string
  organizationId: string
  organizationName: string
  evaluationMonth: string
  currentTier: string
  proposedTier: string
  type: string
  status: string
  wicSnapshot: number
  wipSnapshot: number
  minSnapshot: number
  rejectionReason: string | null
  resolvedAt: string | null
  createdAt: string
}

function TypeBadge({ type }: { type: string }) {
  const isUpgrade = type === 'upgrade'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isUpgrade
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}
    >
      {isUpgrade ? 'Upgrade' : 'Downgrade'}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PendingApproval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>
      {status === 'PendingApproval' ? 'Pending' : status}
    </span>
  )
}

function ActionDialog({
  proposal,
  action,
  onClose,
  onDone,
}: {
  proposal: Proposal
  action: 'approve' | 'reject'
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const isReject = action === 'reject'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isReject && !reason.trim()) {
      setError('Reason is required when rejecting')
      return
    }
    setSubmitting(true)
    setError(null)
    const call = await apiCall<{ ok: boolean; error?: string }>(
      '/api/partnerships/tier-proposals/action',
      {
        method: 'POST',
        body: JSON.stringify({
          proposalId: proposal.id,
          action,
          reason: reason.trim() || undefined,
        }),
      },
    )
    setSubmitting(false)
    if (call.ok) {
      onDone()
    } else {
      const msg = (call.result as Record<string, unknown>)?.error
      setError(typeof msg === 'string' ? msg : 'Action failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-1">
          {isReject ? 'Reject' : 'Approve'} Tier Change
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {proposal.organizationName}: {proposal.currentTier} &rarr; {proposal.proposedTier}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="reason">
              Reason {isReject ? '(required)' : '(optional)'}
            </label>
            <textarea
              id="reason"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isReject ? 'Why is this proposal being rejected?' : 'Optional note for the approval'}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isReject ? 'destructive' : 'default'}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : isReject ? 'Reject' : 'Approve'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TierReviewPage() {
  const [proposals, setProposals] = React.useState<Proposal[]>([])
  const [lastEvaluatedAt, setLastEvaluatedAt] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [evaluationRunning, setEvaluationRunning] = React.useState(false)
  const [statusFilter, setStatusFilter] = React.useState('PendingApproval')
  const [dialog, setDialog] = React.useState<{ proposal: Proposal; action: 'approve' | 'reject' } | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    const query = statusFilter ? `?status=${statusFilter}` : ''
    const call = await apiCall<{ proposals: Proposal[]; lastEvaluatedAt: string | null }>(`/api/partnerships/tier-proposals${query}`)
    if (call.ok && call.result) {
      setProposals(call.result.proposals)
      setLastEvaluatedAt(call.result.lastEvaluatedAt ?? null)
    }
    setLoading(false)
  }, [statusFilter])

  React.useEffect(() => {
    load()
  }, [load])

  function handleDone() {
    setDialog(null)
    load()
  }

  const lastEval = lastEvaluatedAt ? new Date(lastEvaluatedAt) : null
  const daysSinceEval = lastEval ? Math.floor((Date.now() - lastEval.getTime()) / (1000 * 60 * 60 * 24)) : null
  const isOverdue = daysSinceEval !== null && daysSinceEval > 35
  const isNever = lastEval === null

  async function handleRunEvaluation() {
    setEvaluationRunning(true)
    const call = await apiCall<{ jobsEnqueued: number }>('/api/partnerships/enqueue-tier-evaluation', { method: 'POST' })
    if (call.ok && call.result) {
      const count = call.result.jobsEnqueued
      flash(`Evaluation jobs queued: ${count} agencies`, 'success')
    }
    setEvaluationRunning(false)
  }

  return (
    <Page>
      <PageBody>
        <div className={`flex items-center justify-between rounded-md border px-4 py-2 mb-4 text-sm ${isOverdue ? 'border-yellow-400 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200' : isNever ? 'border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200' : 'border-border bg-muted/40 text-muted-foreground'}`}>
          <span>
            {isNever
              ? 'Auto-evaluation has not run yet'
              : `Last auto-evaluation: ${lastEval!.toLocaleDateString()}${isOverdue ? ' — Overdue' : ''}`}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleRunEvaluation}
            disabled={evaluationRunning}
          >
            {evaluationRunning ? 'Evaluation running...' : 'Run Evaluation Now'}
          </Button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tier Review</h2>
          <div className="flex gap-1">
            {['PendingApproval', 'Approved', 'Rejected', ''].map((s) => (
              <Button
                key={s}
                type="button"
                variant={statusFilter === s ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(s)}
              >
                {s === '' ? 'All' : s === 'PendingApproval' ? 'Pending' : s}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="h-8 w-8 text-muted-foreground" />
          </div>
        ) : proposals.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No proposals {statusFilter ? `with status "${statusFilter === 'PendingApproval' ? 'Pending' : statusFilter}"` : ''}.
          </div>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Agency</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Current</th>
                  <th className="px-4 py-3 text-left font-medium">Proposed</th>
                  <th className="px-4 py-3 text-left font-medium">Period</th>
                  <th className="px-4 py-3 text-right font-medium">WIC</th>
                  <th className="px-4 py-3 text-right font-medium">WIP</th>
                  <th className="px-4 py-3 text-right font-medium">MIN</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.organizationName}</td>
                    <td className="px-4 py-3"><TypeBadge type={p.type} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{p.currentTier}</td>
                    <td className="px-4 py-3">{p.proposedTier}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.evaluationMonth}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.wicSnapshot}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.wipSnapshot}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.minSnapshot}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'PendingApproval' ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setDialog({ proposal: p, action: 'approve' })}
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setDialog({ proposal: p, action: 'reject' })}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : p.rejectionReason ? (
                        <span className="text-xs text-muted-foreground" title={p.rejectionReason}>
                          {p.rejectionReason.length > 30 ? `${p.rejectionReason.slice(0, 30)}...` : p.rejectionReason}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {dialog && (
          <ActionDialog
            proposal={dialog.proposal}
            action={dialog.action}
            onClose={() => setDialog(null)}
            onDone={handleDone}
          />
        )}
      </PageBody>
    </Page>
  )
}
