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
    "px-5 py-3 text-[15px] font-medium transition",
    active
      ? "relative z-10 -mb-px rounded-t-[22px] rounded-b-none border border-slate-200 border-b-transparent bg-slate-50/80 text-slate-950 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-slate-50/80 dark:border-slate-800 dark:border-b-transparent dark:bg-slate-900/70 dark:text-white dark:after:bg-slate-900/70"
      : "rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
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
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {data.event.title}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {eventHeaderMeta}
                </p>
              </div>

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
              <section className="space-y-5 rounded-[32px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
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
                  <div className="rounded-[28px] bg-white px-5 py-10 text-center dark:bg-slate-950">
                    <p className="text-lg font-semibold text-slate-950 dark:text-white">No movies yet</p>
                  </div>
                )}
              </section>
            ) : null}

            {activeView === "details" ? (
              <section className="space-y-5 rounded-[32px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[28px] bg-white px-5 py-5 dark:bg-slate-950">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Schedule
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                      {formatDate(data.event.scheduledFor)}
                    </p>
                  </div>
                  <div className="rounded-[28px] bg-white px-5 py-5 dark:bg-slate-950">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Created by
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                      {data.event.createdByDisplayName}
                    </p>
                  </div>
                  <div className="rounded-[28px] bg-white px-5 py-5 dark:bg-slate-950">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Members
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                      {data.stats.memberCount}
                    </p>
                  </div>
                  <div className="rounded-[28px] bg-white px-5 py-5 dark:bg-slate-950">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Votes
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                      {data.stats.voteCount}
                    </p>
                  </div>
                </div>

                <div className="rounded-[28px] bg-white px-5 py-5 dark:bg-slate-950">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Description
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
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
