import Link from "next/link";
import { buttonVariants } from "@movie-night/ui";
import { notFound } from "next/navigation";
import { TmdbSearchPanel } from "@/components/tmdb-search-panel";
import { getRegionLabel } from "@/lib/regions";
import { loadEventPageData } from "@/server/events";
import { isTmdbConfigured } from "@/server/tmdb/client";

interface NewSuggestionPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function NewSuggestionPage({ params }: NewSuggestionPageProps) {
  const { eventId } = await params;
  const data = await loadEventPageData(eventId);

  if (!data) {
    notFound();
  }

  const canAddMovies = ["draft", "open"].includes(data.event.status);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Add a movie
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.event.title} · {getRegionLabel(data.event.regionCode)}
          </p>
        </div>

        <Link
          className={buttonVariants({ size: "sm", variant: "ghost" })}
          href={`/events/${data.event.id}?view=suggestions`}
        >
          ← Back to movies
        </Link>
      </header>

      <TmdbSearchPanel
        canAddMovies={canAddMovies}
        enabled={isTmdbConfigured()}
        eventId={data.event.id}
        regionCode={data.event.regionCode}
        suggestedMovieIds={data.suggestions.map((suggestion) => suggestion.tmdbMovieId)}
      />
    </div>
  );
}
