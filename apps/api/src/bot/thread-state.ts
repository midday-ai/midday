import type { BotPlatform } from "@midday/bot";

type BotThreadState = {
  teamId?: string;
  actingUserId?: string;
  platform?: BotPlatform;
  externalUserId?: string;
};

export function canReuseCachedThreadState(
  state: BotThreadState,
  params: {
    platform: BotPlatform;
    externalUserId: string;
  },
) {
  const { platform, externalUserId } = params;

  if (!state.teamId || !state.actingUserId || !externalUserId) {
    return false;
  }

  if (state.platform && state.platform !== platform) {
    return false;
  }

  return state.externalUserId === externalUserId;
}
