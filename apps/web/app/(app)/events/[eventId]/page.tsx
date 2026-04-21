import Link from "next/link";
import { Panel, buttonVariants, cn } from "@movie-night/ui";
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

function viewLinkClass(active: boolean) {
  return cn(
    "px-5 py-3 text-[15px] font-medium transition-colors",
    active
      ? "relative z-10 -mb-px rounded-t-lg border border-border border-b-card bg-card text-foreground"
      : "rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
    .join(" / ");

  return (
    <div className="mx-auto max-w-5xl">
      <Panel className="overflow-hidden p-0">
        <div className="space-y-6 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                {data.event.title}
              </h1>
              <p className="text-sm text-muted-foreground">{eventHeaderMeta}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                className={buttonVariants({ size: "sm", variant: "secondary" })}
                href={`/groups/${data.group.id}?view=events`}
              >
                Back to group
              </Link>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 pt-0 sm:px-6">
          <div className="space-y-0">
            <nav className="relative z-10 flex flex-wrap gap-2 px-5 sm:px-6">
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

            {activeView === "suggestions" ? (
              <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {data.suggestions.length === 1 ? "1 total" : `${data.suggestions.length} total`}
                    {data.stats.voteCount > 0
                      ? data.stats.voteCount === 1
                        ? " / 1 vote"
                        : ` / ${data.stats.voteCount} votes`
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
                        Add
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
                  <div className="rounded-xl border border-border bg-secondary px-5 py-10 text-center">
                    <p className="text-lg font-semibold text-foreground">No movies yet</p>
                  </div>
                )}
              </section>
            ) : null}

            {activeView === "details" ? (
              <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-secondary px-5 py-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Schedule
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {formatDate(data.event.scheduledFor)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary px-5 py-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Created by
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {data.event.createdByDisplayName}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary px-5 py-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Members
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-foreground">
                      {data.stats.memberCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary px-5 py-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Votes
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-foreground">
                      {data.stats.voteCount}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-secondary px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Description
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {data.event.description?.trim() ? data.event.description : "No description."}
                  </p>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </Panel>
    </div>
  );
}
