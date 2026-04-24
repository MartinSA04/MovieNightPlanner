import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { removeFromWatchlist } from "@/server/personal-lists";

interface RouteContext {
  params: Promise<{ tmdbMovieId: string }>;
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { tmdbMovieId } = await context.params;
  const parsedId = Number.parseInt(tmdbMovieId, 10);

  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const result = await removeFromWatchlist({
      actorUserId: user.id,
      tmdbMovieId: parsedId
    });

    revalidatePath("/watchlist");
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove from watchlist.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
