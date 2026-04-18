import { removeSuggestionSchema } from "@movie-night/domain";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ensureProfileForUser, getCurrentUser } from "@/server/auth";
import { removeSuggestionFromEvent } from "@/server/events";

interface RouteContext {
  params: Promise<{
    eventId: string;
    suggestionId: string;
  }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await ensureProfileForUser(user);

  const { eventId, suggestionId } = await context.params;
  const parsed = removeSuggestionSchema.safeParse({
    eventId,
    suggestionId
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid movie to remove." }, { status: 400 });
  }

  try {
    const result = await removeSuggestionFromEvent({
      ...parsed.data,
      actorUserId: user.id
    });

    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/suggestions/new`);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove movie.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
