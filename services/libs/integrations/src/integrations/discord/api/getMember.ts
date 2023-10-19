import axios, { AxiosRequestConfig } from 'axios'
import { DiscordApiMember } from '../types'
import { handleDiscordError } from './errorHandler'
import { IProcessStreamContext } from '../../../types'
import { getRateLimiter } from './handleRateLimit'

export const getMember = async (
  guildId: string,
  userId: string,
  token: string,
  ctx: IProcessStreamContext,
): Promise<DiscordApiMember> => {
  const rateLimiter = getRateLimiter(ctx)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: AxiosRequestConfig<any> = {
    method: 'get',
    url: `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
    headers: {
      Authorization: token,
    },
  }

  try {
    await rateLimiter.checkRateLimit('getMember')
    await rateLimiter.incrementRateLimit()
    const response = await axios(config)
    return response.data
  } catch (err) {
    const newErr = handleDiscordError(err, config, { guildId, userId }, ctx)
    if (newErr) {
      throw newErr
    }
  }
}
