import type { EventStatus } from "@movie-night/domain";

export function getEventStatusLabel(status: EventStatus) {
  if (status === "locked") {
    return "Locked";
  }

  if (status === "completed") {
    return "Completed";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  return null;
}
