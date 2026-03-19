import type { InjectionMenuItemWidget } from '@open-mercato/shared/modules/widgets/injection'

const widget: InjectionMenuItemWidget = {
  metadata: {
    id: 'partnerships.injection.portal-nav',
  },
  menuItems: [
    {
      id: 'partnerships-portal-dashboard',
      label: 'Partner Dashboard',
      labelKey: 'partnerships.portal.dashboard',
      href: '/portal/partnerships',
      icon: 'LayoutDashboard',
    },
    {
      id: 'partnerships-portal-kpi',
      label: 'KPI Details',
      labelKey: 'partnerships.portal.kpiDetail',
      href: '/portal/partnerships/kpi',
      icon: 'BarChart3',
    },
    {
      id: 'partnerships-portal-rfp',
      label: 'RFP Campaigns',
      labelKey: 'partnerships.portal.rfpInbox',
      href: '/portal/partnerships/rfp',
      icon: 'FileText',
    },
  ],
}

export default widget
