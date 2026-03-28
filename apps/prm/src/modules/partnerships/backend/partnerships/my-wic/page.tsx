"use client"

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { Spinner } from '@open-mercato/ui/primitives/spinner'

type WicScoreRecord = {
  recordId: string
  contributorGithubUsername: string
  month: string
  wicScore: number
  level: string
  impactBonus: number
  bountyBonus: number
  whyBonus: string
  included: string
  excluded: string
  scriptVersion: string
  assessmentSource: string
  assessmentId: string
  archivedAt: string | null
}

type WicScoresResponse = {
  records: WicScoreRecord[]
  month: string
  totalWicScore: number
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function currentYearMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split('-')
  if (!year || !monthNum) return month
  const date = new Date(Number(year), Number(monthNum) - 1, 1)
  if (Number.isNaN(date.getTime())) return month
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function SourceBadge({ source, t }: { source: string; t: (key: string, fallback?: string) => string }) {
  const isAutomated = source === 'automated_pipeline'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isAutomated
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      }`}
    >
      {isAutomated ? t('partnerships.myWic.sourceAutomated') : t('partnerships.myWic.sourceManual')}
    </span>
  )
}

export default function MyWicPage() {
  const t = useT()
  const [selectedMonth, setSelectedMonth] = React.useState<string>(currentYearMonth)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [data, setData] = React.useState<WicScoresResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())
  const [showArchive, setShowArchive] = React.useState(false)
  const [archiveData, setArchiveData] = React.useState<WicScoresResponse | null>(null)
  const [loadingArchive, setLoadingArchive] = React.useState(false)

  function toggleRow(recordId: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(recordId)) next.delete(recordId)
      else next.add(recordId)
      return next
    })
  }

  async function loadArchive() {
    if (archiveData) { setShowArchive(!showArchive); return }
    setLoadingArchive(true)
    const call = await apiCall<WicScoresResponse>(
      `/api/partnerships/wic-scores?month=${encodeURIComponent(selectedMonth)}&includeArchived=true&pageSize=100`,
    )
    if (call.ok && call.result) {
      setArchiveData(call.result)
    }
    setLoadingArchive(false)
    setShowArchive(true)
  }

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      const call = await apiCall<WicScoresResponse>(
        `/api/partnerships/wic-scores?month=${encodeURIComponent(selectedMonth)}&page=${currentPage}&pageSize=20`,
      )
      if (call.ok && call.result) {
        setData(call.result)
      } else {
        setData(null)
      }
      setLoading(false)
    }
    load()
  }, [selectedMonth, currentPage])

  function handleMonthChange(value: string) {
    setSelectedMonth(value)
    setCurrentPage(1)
    setArchiveData(null)
    setShowArchive(false)
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

  const records = data?.records ?? []
  const totalWicScore = data?.totalWicScore ?? 0

  return (
    <Page>
      <PageBody>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {t('partnerships.myWic.title')} — {formatMonthLabel(selectedMonth)}
          </h2>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm"
          />
        </div>

        {records.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <p className="text-muted-foreground">{t('partnerships.myWic.noData')}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {t('partnerships.myWic.totalScore')} <span className="font-semibold text-foreground tabular-nums">{totalWicScore.toFixed(2)}</span>
            </div>
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">{t('partnerships.myWic.colContributor')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('partnerships.myWic.colLevel')}</th>
                    <th className="px-4 py-3 text-right font-medium">{t('partnerships.myWic.colScore')}</th>
                    <th className="px-4 py-3 text-right font-medium">{t('partnerships.myWic.colImpactBonus')}</th>
                    <th className="px-4 py-3 text-right font-medium">{t('partnerships.myWic.colBountyBonus')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('partnerships.myWic.colWhyBonus')}</th>
                    <th className="px-4 py-3 text-left font-medium">{t('partnerships.myWic.colSource')}</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <React.Fragment key={record.recordId}>
                      <tr
                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                        onClick={() => toggleRow(record.recordId)}
                      >
                        <td className="px-4 py-3 font-medium">{record.contributorGithubUsername}</td>
                        <td className="px-4 py-3">{record.level}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{record.wicScore.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{record.impactBonus > 0 ? `+${record.impactBonus}` : '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{record.bountyBonus > 0 ? `+${record.bountyBonus}` : '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{record.whyBonus || '—'}</td>
                        <td className="px-4 py-3"><SourceBadge source={record.assessmentSource} t={t} /></td>
                      </tr>
                      {expandedRows.has(record.recordId) && (
                        <tr className="border-b bg-muted/10">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">{t('partnerships.myWic.colIncluded')}:</span>
                                <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{record.included || '—'}</p>
                              </div>
                              <div>
                                <span className="font-medium">{t('partnerships.myWic.colExcluded')}:</span>
                                <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{record.excluded || '—'}</p>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {t('partnerships.myWic.colScriptVersion')}: {record.scriptVersion}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Page {data.page} of {data.totalPages} ({data.total} records)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={data.page <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="rounded-md border px-3 py-1 text-sm hover:bg-muted/50 disabled:opacity-50"
                    data-testid="pagination-prev"
                  >
                    {t('partnerships.myWic.paginationPrev')}
                  </button>
                  <button
                    type="button"
                    disabled={data.page >= data.totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="rounded-md border px-3 py-1 text-sm hover:bg-muted/50 disabled:opacity-50"
                    data-testid="pagination-next"
                  >
                    {t('partnerships.myWic.paginationNext')}
                  </button>
                </div>
              </div>
            )}

            {/* Archive section */}
            <div className="mt-6">
              <button
                type="button"
                onClick={loadArchive}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                data-testid="archive-toggle"
              >
                <span>{showArchive ? '▾' : '▸'}</span>
                {t('partnerships.myWic.previousAssessments')}
                {loadingArchive && <Spinner className="ml-1 h-3 w-3" />}
              </button>
              {showArchive && archiveData && (() => {
                const archived = archiveData.records.filter((r) => r.archivedAt)
                const groups = new Map<string, WicScoreRecord[]>()
                for (const r of archived) {
                  const list = groups.get(r.assessmentId) ?? []
                  list.push(r)
                  groups.set(r.assessmentId, list)
                }
                const sortedGroups = [...groups.entries()].sort((a, b) => {
                  const dateA = a[1][0]?.archivedAt ?? ''
                  const dateB = b[1][0]?.archivedAt ?? ''
                  return dateB.localeCompare(dateA)
                })
                if (sortedGroups.length === 0) {
                  return <p className="mt-2 text-xs text-muted-foreground">No previous assessments.</p>
                }
                return (
                  <div className="mt-2 space-y-3">
                    {sortedGroups.map(([assessmentId, groupRecords]) => {
                      const archivedAt = groupRecords[0]?.archivedAt
                      const source = groupRecords[0]?.assessmentSource ?? ''
                      const version = groupRecords[0]?.scriptVersion ?? ''
                      return (
                        <details key={assessmentId} className="rounded-md border p-3">
                          <summary className="cursor-pointer text-sm font-medium">
                            {t('partnerships.myWic.archivedOn')} {archivedAt ? new Date(archivedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '?'}
                            {' · '}{source === 'automated_pipeline' ? t('partnerships.myWic.sourceAutomated') : t('partnerships.myWic.sourceManual')}
                            {' · v'}{version}
                          </summary>
                          <div className="mt-2 rounded-lg border">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="px-3 py-2 text-left font-medium">{t('partnerships.myWic.colContributor')}</th>
                                  <th className="px-3 py-2 text-left font-medium">{t('partnerships.myWic.colLevel')}</th>
                                  <th className="px-3 py-2 text-right font-medium">{t('partnerships.myWic.colScore')}</th>
                                  <th className="px-3 py-2 text-right font-medium">{t('partnerships.myWic.colImpactBonus')}</th>
                                  <th className="px-3 py-2 text-right font-medium">{t('partnerships.myWic.colBountyBonus')}</th>
                                  <th className="px-3 py-2 text-left font-medium">{t('partnerships.myWic.colWhyBonus')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {groupRecords.map((r) => (
                                  <tr key={r.recordId} className="border-b last:border-0">
                                    <td className="px-3 py-2">{r.contributorGithubUsername}</td>
                                    <td className="px-3 py-2">{r.level}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{r.wicScore.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{r.impactBonus > 0 ? `+${r.impactBonus}` : '—'}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{r.bountyBonus > 0 ? `+${r.bountyBonus}` : '—'}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{r.whyBonus || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </>
        )}
      </PageBody>
    </Page>
  )
}
