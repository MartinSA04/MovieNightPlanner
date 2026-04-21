import Link from "next/link";
import { buttonVariants, cn } from "@movie-night/ui";
import { notFound } from "next/navigation";
import { EventSuggestionsBoard } from "@/components/event-suggestions-board";
import { EventVoteDialog } from "@/components/event-vote-dialog";
import { getEventStatusLabel } from "@/lib/event-status";
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

function tabLinkClass(active: boolean) {
  return cn(
    "-mb-px inline-flex h-10 items-center border-b-2 px-1 text-sm font-medium transition-colors",
    active
      ? "border-primary text-foreground"
      : "border-transparent text-muted-foreground hover:text-foreground"
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
  const canVote = ["draft", "open"].includes(data.event.status);
  const eventHeaderMeta = [
    data.group.name,
    getRegionLabel(data.event.regionCode),
    getEventStatusLabel(data.event.status)
  ]
    .filter((value): value is string => Boolean(value))
    .join(" · ");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {data.event.title}
          </h1>
          <p className="text-sm text-muted-foreground">{eventHeaderMeta}</p>
        </div>

        <Link
          className={buttonVariants({ size: "sm", variant: "ghost" })}
          href={`/groups/${data.group.id}?view=events`}
        >
          ← Back to group
        </Link>
      </header>

      <div className="border-b border-border/60">
        <nav className="flex gap-6">
          <Link
            className={tabLinkClass(activeView === "suggestions")}
            href={`/events/${data.event.id}?view=suggestions`}
          >
            Movies
          </Link>
          <Link
            className={tabLinkClass(activeView === "details")}
            href={`/events/${data.event.id}?view=details`}
          >
            Details
          </Link>
        </nav>
      </div>

      {activeView === "suggestions" ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {data.suggestions.length === 1 ? "1 movie" : `${data.suggestions.length} movies`}
              {data.stats.voteCount > 0
                ? ` · ${data.stats.voteCount} ${data.stats.voteCount === 1 ? "vote" : "votes"}`
                : ""}
            </p>

            <div className="flex flex-wrap gap-2">
              <EventVoteDialog
                canVote={canVote}
                eventId={data.event.id}
                suggestions={data.suggestions}
              />

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

          {data.suggestions.length > 0 ? (
            <EventSuggestionsBoard
              canRemoveMovies={canAddMovies}
              currentUserId={data.profile.id}
              eventId={data.event.id}
              suggestions={data.suggestions}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-12 text-center">
              <p className="text-base font-semibold text-foreground">No movies yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a pick to get the vote going.
              </p>
            </div>
          )}
        </section>
      ) : null}

      {activeView === "details" ? (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card px-5 py-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Schedule
              </p>
              <p className="mt-1.5 text-base font-semibold text-foreground">
                {formatDate(data.event.scheduledFor)}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card px-5 py-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Created by
              </p>
              <p className="mt-1.5 text-base font-semibold text-foreground">
                {data.event.createdByDisplayName}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card px-5 py-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Members
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-foreground">
                {data.stats.memberCount}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card px-5 py-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Votes
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-foreground">
                {data.stats.voteCount}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card px-5 py-5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground/90">
              {data.event.description?.trim()
                ? data.event.description
                : "No description yet."}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
