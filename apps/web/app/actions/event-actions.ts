"use server";

import { createEventSchema } from "@movie-night/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureProfileForUser, requireCurrentUser } from "@/server/auth";
import { createEventForGroup } from "@/server/events";

function redirectToGroup(
  groupId: string,
  type: "error" | "notice",
  message: string,
  view: "events" | "members" | "new-event" = "events"
): never {
  if (!groupId) {
    redirect(`/groups/new?${type}=${encodeURIComponent(message)}`);
  }

  redirect(`/groups/${groupId}?view=${view}&${type}=${encodeURIComponent(message)}`);
}

export async function createEventAction(formData: FormData) {
  const user = await requireCurrentUser();
  await ensureProfileForUser(user);

  const groupId = String(formData.get("groupId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const scheduledForValue = String(formData.get("scheduledFor") ?? "").trim();
  const scheduledForDate = scheduledForValue.length > 0 ? new Date(scheduledForValue) : null;
  const scheduledFor =
    scheduledForDate && Number.isFinite(scheduledForDate.getTime())
      ? scheduledForDate.toISOString()
      : undefined;

  if (scheduledForValue.length > 0 && !scheduledFor) {
    redirectToGroup(groupId, "error", "Choose a valid schedule.", "new-event");
  }

  const parsed = createEventSchema.safeParse({
    description: description.length > 0 ? description : undefined,
    groupId,
    regionCode: String(formData.get("regionCode") ?? "").toUpperCase(),
    scheduledFor,
    title: formData.get("title")
  });

  if (!parsed.success) {
    redirectToGroup(
      groupId,
      "error",
      "Create a movie night with a title, region, and optional valid schedule.",
      "new-event"
    );
  }

  let event;

  try {
    event = await createEventForGroup({
      ...parsed.data,
      actorUserId: user.id
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create movie night.";
    redirectToGroup(groupId, "error", message, "new-event");
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/events/${event.id}`);
  redirect(`/events/${event.id}?view=suggestions`);
}
