import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbIntegrationData } from './webhooks.data'
import { WebhookState, WebhookType } from '@crowd/types'
import { generateUUIDv1 } from '@crowd/common'

export class WebhooksRepository extends RepositoryBase<WebhooksRepository> {
  public constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async findIntegrationByIdentifier(
    platform: string,
    identifier: string,
  ): Promise<IDbIntegrationData | null> {
    const result = await this.db().oneOrNone(
      `
      select id, "tenantId", platform from integrations
      where platform = $(platform) and "integrationIdentifier" = $(identifier) and "deletedAt" is null
      `,
      {
        platform,
        identifier,
      },
    )

    return result
  }

  public async createIncomingWebhook(
    tenantId: string,
    integrationId: string,
    type: WebhookType,
    payload: unknown,
  ): Promise<string> {
    const id = generateUUIDv1()
    const result = await this.db().result(
      `
      insert into "incomingWebhooks"(id, "tenantId", "integrationId", state, type, payload)
      values($(id), $(tenantId), $(integrationId), $(state), $(type), $(payload))
      `,
      {
        id,
        tenantId,
        integrationId,
        type,
        state: WebhookState.PENDING,
        payload: JSON.stringify(payload),
      },
    )

    this.checkUpdateRowCount(result.rowCount, 1)

    return id
  }
}