import type { GroupRole } from "../dto";

export function canManageGroup(role: GroupRole): boolean {
  return role === "owner" || role === "admin";
}

export function canCreateEvent(role: GroupRole): boolean {
  return canManageGroup(role);
}

export function canEditOwnProfile(userId: string, actorUserId: string): boolean {
  return userId === actorUserId;
}

export function canManageMembership(role: GroupRole): boolean {
  return canManageGroup(role);
}

