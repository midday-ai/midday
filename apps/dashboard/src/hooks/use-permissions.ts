"use client";

import { useUserQuery } from "./use-user";
import type { TeamRole } from "@/utils/role-permissions";

export function usePermissions() {
  const { data: user } = useUserQuery();
  const role = (user?.role as TeamRole) ?? "member";

  return {
    role,
    isInternal: role === "owner" || role === "admin" || role === "member",
    isExternal:
      role === "broker" ||
      role === "syndicate" ||
      role === "merchant" ||
      role === "bookkeeper",
    isAdmin: role === "owner" || role === "admin",
    isOwner: role === "owner",
    isBookkeeper: role === "bookkeeper",
    canManageMembers: role === "owner" || role === "admin",
    canManageBilling: role === "owner",
    canDeleteTeam: role === "owner",
    canManageSettings: role === "owner" || role === "admin",
    canManageIntegrations: role === "owner" || role === "admin",
    canManageApiKeys: role === "owner",
    canWriteResources:
      role === "owner" || role === "admin" || role === "member",
    canReconcile:
      role === "owner" ||
      role === "admin" ||
      role === "member" ||
      role === "bookkeeper",
    entityId: (user as any)?.entityId as string | null,
    entityType: (user as any)?.entityType as string | null,
  };
}
