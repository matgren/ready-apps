import { createModuleEvents } from '@open-mercato/shared/modules/events'

const events = [] as const

export const eventsConfig = createModuleEvents({ moduleId: 'partnerships', events })
export default eventsConfig
