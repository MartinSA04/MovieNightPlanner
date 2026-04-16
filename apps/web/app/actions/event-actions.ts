"use server";

import { createEventSchema } from "@movie-night/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureProfileForUser, requireCurrentUser } from "@/server/auth";
import { createEventForGroup } from "@/server/events";

function redirectToGroup(groupId: string, type: "error" | "notice", message: string): never {
  if (!groupId) {
    redirect(`/dashboard?${type}=${encodeURIComponent(message)}`);
  }

  redirect(`/groups/${groupId}?${type}=${encodeURIComponent(message)}`);
}

export async function createEventAction(formData: FormData) {
  const user = await requireCurrentUser();
  await ensureProfileForUser(user);

  const groupId = String(formData.get("groupId") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  const parsed = createEventSchema.safeParse({
    description: description.length > 0 ? description : undefined,
    groupId,
    regionCode: String(formData.get("regionCode") ?? "").toUpperCase(),
    title: formData.get("title")
  });

  if (!parsed.success) {
    redirectToGroup(groupId, "error", "Create an event with a title and 2-letter region code.");
  }

  try {
    const event = await createEventForGroup({
      ...parsed.data,
      actorUserId: user.id
    });

    revalidatePath(`/groups/${groupId}`);
    redirect(`/events/${event.id}?notice=${encodeURIComponent("Event created.")}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create event.";
    redirectToGroup(groupId, "error", message);
  }
}
