import { deleteCommentSchema } from "@movie-night/domain";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { deleteComment } from "@/server/comments";

interface RouteContext {
  params: Promise<{ eventId: string; commentId: string }>;
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { eventId, commentId } = await context.params;
  const parsed = deleteCommentSchema.safeParse({ commentId });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid comment." }, { status: 400 });
  }

  try {
    const result = await deleteComment({
      ...parsed.data,
      actorUserId: user.id
    });

    revalidatePath(`/events/${eventId}`);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete comment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
