import Link from "next/link";
import { Crown, Calendar, Film, Plus, Users, KeyRound } from "lucide-react";
import { buttonVariants, cn } from "@movie-night/ui";
import { redirect } from "next/navigation";
import { CreateMovieNightButton } from "@/components/create-movie-night-button";
import { MoviePoster } from "@/components/movie-poster";
import { loadDashboardPageData } from "@/server/groups";

interface DashboardPageProps {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    notice?: string;
    view?: string;
  }>;
}

type DashboardView = "groups" | "nights" | "upcoming";

function getDashboardView(view?: string): DashboardView {
  if (view === "nights" || view === "upcoming") {
    return view;
  }

  return "groups";
}

function formatRole(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatScheduledDate(value: string | null) {
  if (!value) {
    return "Unscheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getMovieNightBadge(status: string) {
  if (status === "completed") {
    return {
      className: "bg-chart-4/10 text-chart-4",
      label: "Confirmed"
    };
  }

  if (status === "cancelled") {
    return {
      className: "bg-destructive/10 text-destructive",
      label: "Cancelled"
    };
  }

  if (status === "locked") {
    return {
      className: "bg-primary/15 text-primary",
      label: "Locked"
    };
  }

  return {
    className: "bg-accent/15 text-accent",
    label: "Vote now"
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) ?? {};

  if (params.view === "create") {
    redirect("/groups/new");
  }

  if (params.view === "join") {
    redirect("/groups/join");
  }

  const activeView = getDashboardView(params.view);
  const data = await loadDashboardPageData();
  const movieNights = activeView === "upcoming" ? data.upcomingMovieNights : data.movieNights;

  return (
    <div className="space-y-8">
      {activeView === "groups" ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Your groups
              </h1>
              <p className="text-sm text-muted-foreground">
                Open a group, create a new one, or join with an invite.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className={buttonVariants({ size: "sm", variant: "outline" })}
                href="/groups/join"
              >
                <KeyRound className="h-4 w-4" />
                Join
              </Link>
              <Link className={buttonVariants({ size: "sm" })} href="/groups/new">
                <Plus className="h-4 w-4" />
                Create
              </Link>
            </div>
          </div>

          {data.groups.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.groups.map((group) => (
                <Link
                  key={group.id}
                  className="group rounded-2xl border border-border/60 bg-card p-5 transition hover:border-primary/50"
                  href={`/groups/${group.id}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Users className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-foreground">
                        {group.name}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {group.countryCode}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>
                        {group.memberCount}{" "}
                        {group.memberCount === 1 ? "member" : "members"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5" />
                      <span>{formatRole(group.role)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <p className="mt-3 text-base font-semibold text-foreground">No groups yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first group or join one with an invite code.
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {activeView === "upcoming" ? "Upcoming movie nights" : "Movie nights"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeView === "upcoming"
                  ? "The next scheduled movie nights across your groups."
                  : "Active movie nights across all of your groups."}
              </p>
            </div>
            <CreateMovieNightButton
              groups={data.groups.map((group) => ({
                countryCode: group.countryCode,
                id: group.id,
                name: group.name
              }))}
            />
          </div>

          {movieNights.length > 0 ? (
            <div className="space-y-3">
              {movieNights.map((movieNight) => {
                const badge = getMovieNightBadge(movieNight.status);
                const actionLabel =
                  movieNight.status === "draft" || movieNight.status === "open"
                    ? "Vote"
                    : "Open";
                const actionVariant =
                  movieNight.status === "draft" || movieNight.status === "open"
                    ? "primary"
                    : "outline";

                if (movieNight.isUpcomingHighlight) {
                  return (
                    <div
                      key={movieNight.id}
                      className="rounded-2xl border border-primary/40 bg-primary/5 p-5 sm:p-7"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                        {movieNight.topVote ? (
                          <MoviePoster
                            className="w-28 sm:w-36"
                            posterPath={movieNight.topVote.posterPath}
                            priority
                            size="search"
                            title={movieNight.topVote.title}
                          />
                        ) : null}
                        <div className="min-w-0 flex-1 space-y-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                  badge.className
                                )}
                              >
                                {badge.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {movieNight.groupName}
                              </span>
                            </div>
                            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                              {movieNight.title}
                            </h2>
                          </div>

                          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                            <div className="inline-flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              <span>{formatScheduledDate(movieNight.scheduledFor)}</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5">
                              <Users className="h-4 w-4" />
                              <span>
                                {movieNight.memberCount}{" "}
                                {movieNight.memberCount === 1 ? "member" : "members"}
                              </span>
                            </div>
                            <div className="inline-flex min-w-0 items-center gap-1.5">
                              <Film className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                {movieNight.topVote
                                  ? `Top pick · ${movieNight.topVote.title}`
                                  : "No lead yet"}
                              </span>
                            </div>
                          </div>

                          <div>
                            <Link
                              className={buttonVariants({
                                size: "sm",
                                variant: actionVariant
                              })}
                              href={`/events/${movieNight.id}?view=suggestions`}
                            >
                              {actionLabel}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={movieNight.id}
                    className="rounded-2xl border border-border/60 bg-card p-5 transition hover:border-primary/40"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h2 className="text-base font-semibold text-foreground">
                            {movieNight.title}
                          </h2>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-medium",
                              badge.className
                            )}
                          >
                            {badge.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {movieNight.groupName}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          <div className="inline-flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{formatScheduledDate(movieNight.scheduledFor)}</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span>
                              {movieNight.memberCount}{" "}
                              {movieNight.memberCount === 1 ? "member" : "members"}
                            </span>
                          </div>
                          <div className="inline-flex min-w-0 items-center gap-1.5">
                            <Film className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                              {movieNight.topVote
                                ? `Top pick · ${movieNight.topVote.title}`
                                : "No lead yet"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        className={buttonVariants({
                          size: "sm",
                          variant: actionVariant
                        })}
                        href={`/events/${movieNight.id}?view=suggestions`}
                      >
                        {actionLabel}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-12 text-center">
              <Calendar className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <p className="mt-3 text-base font-semibold text-foreground">
                No movie nights here yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeView === "upcoming"
                  ? "Upcoming movie nights will appear here."
                  : "Create a movie night from one of your groups to get started."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
