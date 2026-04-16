import { addSuggestionSchema } from "@movie-night/domain";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { ensureProfileForUser, getCurrentUser } from "@/server/auth";
import { addSuggestionToEvent } from "@/server/events";

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
  const body = (await request.json().catch(() => null)) as { tmdbMovieId?: unknown; note?: unknown } | null;
  const parsed = addSuggestionSchema.safeParse({
    eventId,
    note: typeof body?.note === "string" ? body.note : undefined,
    tmdbMovieId:
      typeof body?.tmdbMovieId === "number"
        ? body.tmdbMovieId
        : Number(body?.tmdbMovieId ?? Number.NaN)
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid movie before adding it." }, { status: 400 });
  }

  try {
    const result = await addSuggestionToEvent({
      ...parsed.data,
      actorUserId: user.id
    });

    revalidatePath(`/events/${eventId}`);

    return NextResponse.json(result, { status: result.status === "added" ? 201 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add movie suggestion.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
