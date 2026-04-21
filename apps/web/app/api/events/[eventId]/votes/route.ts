import { castVoteSchema } from "@movie-night/domain";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { ensureProfileForUser, getCurrentUser } from "@/server/auth";
import { setEventVotes } from "@/server/events";

interface RouteContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await ensureProfileForUser(user);

  const { eventId } = await context.params;
  const body = (await request.json().catch(() => null)) as { suggestionIds?: unknown } | null;
  const parsed = castVoteSchema.safeParse({
    eventId,
    suggestionIds: body?.suggestionIds
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Pick up to 3 different movies." }, { status: 400 });
  }

  try {
    const result = await setEventVotes({
      ...parsed.data,
      actorUserId: user.id
    });

    revalidatePath(`/events/${eventId}`);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save picks.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
