"use server";

import { createGroupSchema } from "@movie-night/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureProfileForUser, requireCurrentUser } from "@/server/auth";
import { createGroupForOwner } from "@/server/groups";

function redirectToCreateGroupError(message: string): never {
  redirect(`/groups/new?error=${encodeURIComponent(message)}`);
}

export async function createGroupAction(formData: FormData) {
  const user = await requireCurrentUser();
  await ensureProfileForUser(user);

  const parsed = createGroupSchema.safeParse({
    countryCode: String(formData.get("countryCode") ?? "").toUpperCase(),
    name: formData.get("name")
  });

  if (!parsed.success) {
    redirectToCreateGroupError("Create a group with a name and 2-letter country code.");
  }

  const group = await createGroupForOwner({
    countryCode: parsed.data.countryCode,
    name: parsed.data.name,
    ownerUserId: user.id
  });

  revalidatePath("/dashboard");
  revalidatePath("/groups/new");
  redirect(`/groups/${group.id}`);
}
