import Link from "next/link";
import { Panel, Pill, SectionHeading, buttonVariants, cn } from "@movie-night/ui";
import { notFound } from "next/navigation";
import { getRegionLabel } from "@/lib/regions";
import { loadEventPageData } from "@/server/events";

interface EventDetailPageProps {
  params: Promise<{
    eventId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    notice?: string;
    view?: string;
  }>;
}

type EventView = "details" | "suggestions";

function getEventView(view?: string): EventView {
  if (view === "details") {
    return view;
  }

  return "suggestions";
}

function viewLinkClass(active: boolean) {
  return cn(
    "rounded-full px-4 py-2 text-sm font-medium transition",
    active
      ? "bg-slate-950 text-white dark:bg-amber-300 dark:text-slate-950"
      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unscheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function EventDetailPage({
  params,
  searchParams
}: EventDetailPageProps) {
  const { eventId } = await params;
  const feedback = (await searchParams) ?? {};
  const data = await loadEventPageData(eventId);
  const activeView = getEventView(feedback.view);

  if (!data) {
    notFound();
  }

  const canAddMovies = ["draft", "open"].includes(data.event.status);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Panel className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {data.event.title}
                </h1>
                <Pill tone="muted">{data.event.status}</Pill>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="accent">{getRegionLabel(data.event.regionCode)}</Pill>
                <Pill tone="muted">{data.group.name}</Pill>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2">
              <Link
                className={viewLinkClass(activeView === "suggestions")}
                href={`/events/${data.event.id}?view=suggestions`}
              >
                Movies
              </Link>
              <Link
                className={viewLinkClass(activeView === "details")}
                href={`/events/${data.event.id}?view=details`}
              >
                Details
              </Link>
            </nav>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              className={buttonVariants({ size: "sm", variant: "secondary" })}
              href={`/groups/${data.group.id}?view=events`}
            >
              Back to group
            </Link>
            {canAddMovies ? (
              <Link
                className={buttonVariants({ size: "sm" })}
                href={`/events/${data.event.id}/suggestions/new`}
              >
                Add movie
              </Link>
            ) : null}
          </div>
        </div>
      </Panel>

      {activeView === "suggestions" ? (
        <Panel className="space-y-5">
          <div className="space-y-2">
            <SectionHeading>Movies</SectionHeading>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {data.suggestions.length === 1 ? "1 movie" : `${data.suggestions.length} movies`}
            </h2>
          </div>

          {data.suggestions.length > 0 ? (
            <div className="grid gap-3">
              {data.suggestions.map((suggestion) => (
                <div key={suggestion.id} className="rounded-[28px] bg-slate-50 px-5 py-5 dark:bg-slate-900">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
                        {suggestion.title}
                      </h3>
                      {suggestion.releaseDate ? (
                        <Pill tone="muted">{suggestion.releaseDate.slice(0, 4)}</Pill>
                      ) : null}
                    </div>

                    {suggestion.originalTitle && suggestion.originalTitle !== suggestion.title ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {suggestion.originalTitle}
                      </p>
                    ) : null}

                    {suggestion.overview ? (
                      <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                        {suggestion.overview}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Pill tone="muted">{suggestion.suggestedByDisplayName}</Pill>
                      <Pill tone="muted">{formatDate(suggestion.createdAt)}</Pill>
                    </div>

                    {suggestion.note ? (
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {suggestion.note}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] bg-slate-50 px-5 py-10 text-center dark:bg-slate-900">
              <p className="text-lg font-semibold text-slate-950 dark:text-white">No movies yet</p>
            </div>
          )}
        </Panel>
      ) : null}

      {activeView === "details" ? (
        <Panel className="space-y-5">
          <div className="space-y-2">
            <SectionHeading>Details</SectionHeading>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Event details
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[28px] bg-slate-50 px-5 py-5 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Schedule
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {formatDate(data.event.scheduledFor)}
              </p>
            </div>
            <div className="rounded-[28px] bg-slate-50 px-5 py-5 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Created by
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {data.event.createdByDisplayName}
              </p>
            </div>
            <div className="rounded-[28px] bg-slate-50 px-5 py-5 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Members
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                {data.stats.memberCount}
              </p>
            </div>
            <div className="rounded-[28px] bg-slate-50 px-5 py-5 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Votes
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                {data.stats.voteCount}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] bg-slate-50 px-5 py-5 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Description
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {data.event.description?.trim() ? data.event.description : "No description."}
            </p>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
