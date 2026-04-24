import type { EventStatus, GroupRole } from "../dto";

export type EventStatusTransition =
  | { from: "draft"; to: "open" }
  | { from: "draft" | "open"; to: "locked" }
  | { from: "locked"; to: "open" }
  | { from: "locked"; to: "completed" }
  | { from: "draft" | "open" | "locked"; to: "cancelled" };

const ALLOWED_TRANSITIONS: ReadonlyArray<readonly [EventStatus, EventStatus]> = [
  ["draft", "open"],
  ["draft", "locked"],
  ["draft", "cancelled"],
  ["open", "locked"],
  ["open", "cancelled"],
  ["locked", "completed"],
  ["locked", "open"],
  ["locked", "cancelled"]
];

export function canManageEvent(role: GroupRole): boolean {
  return role === "owner" || role === "admin";
}

export function canTransitionEventStatus(
  from: EventStatus,
  to: EventStatus
): boolean {
  if (from === to) {
    return false;
  }

  return ALLOWED_TRANSITIONS.some(([a, b]) => a === from && b === to);
}

export function statusRequiresWinner(status: EventStatus): boolean {
  return status === "locked" || status === "completed";
}

export function statusClearsWinner(status: EventStatus): boolean {
  return status === "draft" || status === "open" || status === "cancelled";
}
