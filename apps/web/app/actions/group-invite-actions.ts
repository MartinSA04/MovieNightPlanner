"use server";

import { joinGroupByInviteSchema } from "@movie-night/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureProfileForUser, requireCurrentUser } from "@/server/auth";
import { joinGroupByInviteCode } from "@/server/groups";

function redirectToJoinGroupError(message: string): never {
  redirect(`/groups/join?error=${encodeURIComponent(message)}`);
}

export async function joinGroupByInviteAction(formData: FormData) {
  const user = await requireCurrentUser();
  await ensureProfileForUser(user);

  const parsed = joinGroupByInviteSchema.safeParse({
    inviteCode: formData.get("inviteCode")
  });

  if (!parsed.success) {
    redirectToJoinGroupError("Enter a valid invite code before joining a group.");
  }

  const result = await joinGroupByInviteCode({
    inviteCode: parsed.data.inviteCode,
    userId: user.id
  });

  if (result.status === "not-found") {
    redirectToJoinGroupError("That invite code was not found.");
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/groups/join");
  revalidatePath(`/groups/${result.group.id}`);

  const notice =
    result.status === "joined"
      ? `Joined ${result.group.name}.`
      : `You're already a member of ${result.group.name}.`;

  redirect(`/groups/${result.group.id}?notice=${encodeURIComponent(notice)}`);
}
