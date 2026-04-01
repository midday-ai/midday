import type { BotPlatform } from "@midday/bot";

export type BotThreadState = {
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

  if (
    !state.teamId ||
    !state.actingUserId ||
    !state.platform ||
    !externalUserId
  ) {
    return false;
  }

  if (state.platform !== platform) {
    return false;
  }

  return state.externalUserId === externalUserId;
}
