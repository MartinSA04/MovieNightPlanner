import Link from "next/link";
import { Trophy } from "lucide-react";
import { buttonVariants, cn } from "@movie-night/ui";
import { notFound } from "next/navigation";
import { canManageEvent } from "@movie-night/domain";
import { EventCommentsThread } from "@/components/event-comments-thread";
import { EventRealtimeSync } from "@/components/event-realtime-sync";
import { EventStatusActions } from "@/components/event-status-actions";
import { EventSuggestionsBoard } from "@/components/event-suggestions-board";
import { EventVoteDialog } from "@/components/event-vote-dialog";
import { getEventStatusLabel } from "@/lib/event-status";
import { getRegionLabel } from "@/lib/regions";
import { loadEventComments } from "@/server/comments";
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

type EventView = "details" | "suggestions" | "discussion";

function getEventView(view?: string): EventView {
  if (view === "details" || view === "discussion") {
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

  const comments = await loadEventComments(data.event.id);

  const canAddMovies = ["draft", "open"].includes(data.event.status);
  const canVote = ["draft", "open"].includes(data.event.status);
  const canManage = canManageEvent(data.actorRole);
  const eventHeaderMeta = [
    data.group.name,
    getRegionLabel(data.event.regionCode),
    getEventStatusLabel(data.event.status)
  ]
    .filter((value): value is string => Boolean(value))
    .join(" · ");
  const winningSuggestion = data.event.winningSuggestionId
    ? data.suggestions.find((s) => s.id === data.event.winningSuggestionId)
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <EventRealtimeSync eventId={data.event.id} />
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
            className={tabLinkClass(activeView === "discussion")}
            href={`/events/${data.event.id}?view=discussion`}
          >
            Discussion
            {comments.length > 0 ? (
              <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {comments.length}
              </span>
            ) : null}
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
          {winningSuggestion ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-primary/40 bg-primary/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Trophy className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
                    {data.event.status === "completed" ? "Watched" : "Locked pick"}
                  </p>
                  <p className="truncate text-base font-semibold text-foreground">
                    {winningSuggestion.title}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

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

          {canManage ? (
            <EventStatusActions
              canManage={canManage}
              eventId={data.event.id}
              status={data.event.status}
              suggestions={data.suggestions.map((s) => ({
                id: s.id,
                points: s.points,
                title: s.title
              }))}
              winningSuggestionId={data.event.winningSuggestionId}
            />
          ) : null}

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

      {activeView === "discussion" ? (
        <section className="space-y-4">
          <EventCommentsThread
            currentUserId={data.profile.id}
            eventId={data.event.id}
            initialComments={comments}
          />
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
