import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ensureProfileForUser, getCurrentUser } from "@/server/auth";
import { deleteGroupForOwner } from "@/server/groups";

interface RouteContext {
  params: Promise<{
    groupId: string;
  }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await ensureProfileForUser(user);

  const { groupId } = await context.params;

  try {
    await deleteGroupForOwner({
      actorUserId: user.id,
      groupId
    });

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/groups/new");
    revalidatePath("/groups/join");
    revalidatePath(`/groups/${groupId}`);

    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete group.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
