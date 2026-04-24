import { transitionEventStatusSchema } from "@movie-night/domain";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { ensureProfileForUser, getCurrentUser } from "@/server/auth";
import { transitionEventStatus } from "@/server/events";

interface RouteContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await ensureProfileForUser(user);

  const { eventId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { status?: unknown; winningSuggestionId?: unknown }
    | null;

  const parsed = transitionEventStatusSchema.safeParse({
    eventId,
    status: body?.status,
    winningSuggestionId: body?.winningSuggestionId
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Pick a valid status for this movie night." },
      { status: 400 }
    );
  }

  try {
    const result = await transitionEventStatus({
      ...parsed.data,
      actorUserId: user.id
    });

    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/groups/${result.event.groupId}`);
    revalidatePath(`/dashboard`);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update movie night.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
