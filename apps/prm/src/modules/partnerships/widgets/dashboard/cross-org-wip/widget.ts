import type { DashboardWidgetDefinition } from '@open-mercato/shared/modules/dashboard/widgets'

const widget: DashboardWidgetDefinition = {
  id: 'partnerships.dashboard.cross-org-wip',
  title: 'Agency Pipeline Activity',
  titleKey: 'partnerships.widgets.crossOrgWip.title',
  size: 'lg',
  icon: 'bar-chart-2',
  features: ['partnerships.manage'],
}

export default widget
