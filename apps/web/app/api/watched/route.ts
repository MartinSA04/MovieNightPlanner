import { markWatchedSchema } from "@movie-night/domain";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { ensureProfileForUser, getCurrentUser } from "@/server/auth";
import { markWatched } from "@/server/personal-lists";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await ensureProfileForUser(user);

  const body = (await request.json().catch(() => null)) as
    | { tmdbMovieId?: unknown; eventId?: unknown; rating?: unknown; note?: unknown }
    | null;

  const parsed = markWatchedSchema.safeParse({
    tmdbMovieId: body?.tmdbMovieId,
    eventId: body?.eventId,
    rating: body?.rating,
    note: body?.note
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await markWatched({
      ...parsed.data,
      actorUserId: user.id
    });

    revalidatePath("/watchlist");
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not mark as watched.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
