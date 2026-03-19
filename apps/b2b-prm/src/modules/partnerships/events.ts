import { createModuleEvents } from '@open-mercato/shared/modules/events'

const events = [
  { id: 'partnerships.partner_agency.self_onboarded', label: 'Agency Self-Onboarded', entity: 'partner_agency', category: 'lifecycle' },
  { id: 'partnerships.partner_tier.assigned', label: 'Tier Assigned', entity: 'partner_tier', category: 'lifecycle' },
  { id: 'partnerships.partner_tier.downgraded', label: 'Tier Downgraded', entity: 'partner_tier', category: 'lifecycle' },
  { id: 'partnerships.partner_tier.expiring', label: 'Tier Expiring', entity: 'partner_tier', category: 'lifecycle' },
  { id: 'partnerships.partner_metric.snapshot_recorded', label: 'Metric Snapshot Recorded', entity: 'partner_metric', category: 'lifecycle' },
  { id: 'partnerships.partner_rfp.issued', label: 'RFP Campaign Issued', entity: 'partner_rfp', category: 'lifecycle' },
  { id: 'partnerships.partner_rfp.responded', label: 'RFP Response Submitted', entity: 'partner_rfp', category: 'lifecycle' },
] as const

export const eventsConfig = createModuleEvents({
  moduleId: 'partnerships',
  events,
})

export const emitPartnershipEvent = eventsConfig.emit

export type PartnershipEventId = typeof events[number]['id']

export default eventsConfig
