import { createCrudOpenApiFactory } from '@open-mercato/shared/lib/openapi/crud'

export const createPartnershipsCrudOpenApi = createCrudOpenApiFactory({
  defaultTag: 'Partnerships',
})
