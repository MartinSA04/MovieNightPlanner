import { postCommentSchema } from "@movie-night/domain";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { ensureProfileForUser, getCurrentUser } from "@/server/auth";
import { loadEventComments, postComment } from "@/server/comments";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { eventId } = await context.params;

  try {
    const comments = await loadEventComments(eventId);
    return NextResponse.json({ comments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load comments.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await ensureProfileForUser(user);

  const { eventId } = await context.params;
  const body = (await request.json().catch(() => null)) as { body?: unknown } | null;
  const parsed = postCommentSchema.safeParse({
    eventId,
    body: body?.body
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Write a comment first." }, { status: 400 });
  }

  try {
    const comment = await postComment({
      ...parsed.data,
      actorUserId: user.id
    });

    revalidatePath(`/events/${eventId}`);

    return NextResponse.json({ comment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not post comment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
