export type ConnectedResolvedConversation = {
  connected: true;
  teamId: string;
  actingUserId: string;
  identityId?: string;
  notificationContext?: Record<string, unknown> | null;
};

type PlatformIdentityLike = {
  id: string;
  teamId: string;
  userId: string;
  metadata?: unknown;
};

export function getPlatformIdentityNotificationContext(metadata?: unknown) {
  const metadataRecord =
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>)
      : null;
  const notificationContext = metadataRecord?.lastNotificationContext;

  return notificationContext && typeof notificationContext === "object"
    ? (notificationContext as Record<string, unknown>)
    : null;
}

export function requireResolvedConversationIdentity(
  resolved: ConnectedResolvedConversation,
  identity: PlatformIdentityLike | null,
): ConnectedResolvedConversation | null {
  if (!identity) {
    return null;
  }

  if (
    identity.teamId !== resolved.teamId ||
    identity.userId !== resolved.actingUserId
  ) {
    return null;
  }

  return {
    ...resolved,
    identityId: identity.id,
    notificationContext: getPlatformIdentityNotificationContext(
      identity.metadata,
    ),
  };
}
