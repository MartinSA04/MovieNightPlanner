import { addToWatchlistSchema } from "@movie-night/domain";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { ensureProfileForUser, getCurrentUser } from "@/server/auth";
import { addToWatchlist } from "@/server/personal-lists";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await ensureProfileForUser(user);

  const body = (await request.json().catch(() => null)) as
    | { tmdbMovieId?: unknown; note?: unknown }
    | null;

  const parsed = addToWatchlistSchema.safeParse({
    tmdbMovieId: body?.tmdbMovieId,
    note: body?.note
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await addToWatchlist({
      ...parsed.data,
      actorUserId: user.id
    });

    revalidatePath("/watchlist");
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add to watchlist.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
