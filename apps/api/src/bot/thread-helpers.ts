import type { ConnectedResolvedConversation } from "@api/bot/conversation-identity";
import type { BotThreadState } from "@api/bot/thread-state";
import { db } from "@midday/db/client";
import { hasTeamAccess } from "@midday/db/queries";
import type { Thread } from "chat";

export function consumeResolvedConversation(
  resolved: ConnectedResolvedConversation,
) {
  return { ...resolved, consumed: true as const };
}

export async function hasCurrentTeamAccess(teamId: string, userId: string) {
  return hasTeamAccess(db, teamId, userId);
}

export async function rememberThreadState(
  thread: Thread<BotThreadState>,
  state: BotThreadState,
) {
  await thread.setState(state);
}

export async function forgetThreadState(thread: Thread<BotThreadState>) {
  await thread.setState({});
}

export async function notifyTeamAccessRevoked(thread: Thread<BotThreadState>) {
  await forgetThreadState(thread);
  await thread
    .post(
      "This chat is linked, but that Midday user no longer has access to this workspace. Reconnect it from Midday and try again.",
    )
    .catch(() => {});
}
