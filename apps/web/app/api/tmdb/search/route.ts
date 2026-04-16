import { searchMoviesSchema } from "@movie-night/domain";
import { NextRequest, NextResponse } from "next/server";
import { isTmdbConfigured, searchMovies } from "@/server/tmdb/client";
import { getCurrentUser } from "@/server/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = searchMoviesSchema.safeParse({
    page: request.nextUrl.searchParams.get("page") ?? "1",
    query: request.nextUrl.searchParams.get("query") ?? "",
    regionCode: request.nextUrl.searchParams.get("regionCode") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Search with a query between 2 and 100 characters." },
      { status: 400 }
    );
  }

  if (!isTmdbConfigured()) {
    return NextResponse.json({ error: "TMDb is not configured." }, { status: 503 });
  }

  try {
    const results = await searchMovies(parsed.data);

    return NextResponse.json({
      query: parsed.data.query,
      regionCode: parsed.data.regionCode ?? null,
      results
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "TMDb search failed.";

    console.error("TMDb search route failed", {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      query: parsed.data.query,
      regionCode: parsed.data.regionCode ?? null
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
