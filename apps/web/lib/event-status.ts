import type { EventStatus } from "@movie-night/domain";

export function getEventStatusLabel(status: EventStatus) {
  if (status === "draft") {
    return "Planning";
  }

  if (status === "open") {
    return "Voting open";
  }

  if (status === "locked") {
    return "Locked";
  }

  if (status === "completed") {
    return "Watched";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  return null;
}
