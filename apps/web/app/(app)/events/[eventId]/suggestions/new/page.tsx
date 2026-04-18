import Link from "next/link";
import { Panel, Pill, buttonVariants } from "@movie-night/ui";
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
    <div className="mx-auto max-w-5xl">
      <Panel className="overflow-hidden p-0">
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Add movie
                </h1>
                <Pill tone="muted">{data.event.title}</Pill>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="accent">{getRegionLabel(data.event.regionCode)}</Pill>
              </div>
            </div>

            <Link
              className={buttonVariants({ size: "sm", variant: "secondary" })}
              href={`/events/${data.event.id}?view=suggestions`}
            >
              Back to movies
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-6 dark:border-slate-800 sm:px-6">
          <TmdbSearchPanel
            canAddMovies={canAddMovies}
            enabled={isTmdbConfigured()}
            eventId={data.event.id}
            regionCode={data.event.regionCode}
            suggestedMovieIds={data.suggestions.map((suggestion) => suggestion.tmdbMovieId)}
          />
        </div>
      </Panel>
    </div>
  );
}
