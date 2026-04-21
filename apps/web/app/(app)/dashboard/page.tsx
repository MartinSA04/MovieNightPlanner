import Link from "next/link";
import { Crown, Calendar, Film, Plus, Users, KeyRound } from "lucide-react";
import { buttonVariants, cn } from "@movie-night/ui";
import { redirect } from "next/navigation";
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
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getMovieNightBadge(status: string) {
  if (status === "completed") {
    return {
      className: "bg-chart-4/20 text-chart-4",
      label: "Confirmed"
    };
  }

  if (status === "cancelled") {
    return {
      className: "bg-destructive/20 text-destructive",
      label: "Cancelled"
    };
  }

  if (status === "locked") {
    return {
      className: "bg-primary/20 text-primary",
      label: "Locked"
    };
  }

  return {
    className: "bg-accent/20 text-accent",
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Your Groups</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Open a group, create a new one, or join an existing invite.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className={buttonVariants({ size: "sm", variant: "secondary" })} href="/groups/join">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.groups.map((group) => (
                <Link
                  key={group.id}
                  className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
                  href={`/groups/${group.id}`}
                >
                  <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Users className="h-12 w-12" />
                  </div>
                  <h2 className="text-xl font-semibold text-card-foreground">{group.name}</h2>
                  <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{group.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Crown className="h-3.5 w-3.5" />
                      <span>{formatRole(group.role)}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{group.countryCode}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card px-6 py-10 text-center">
              <p className="text-lg font-semibold text-foreground">No groups yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first group or join one with an invite code.
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {activeView === "upcoming" ? "Upcoming Movie Nights" : "Movie Nights"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {activeView === "upcoming"
                  ? "The next scheduled movie nights across your groups."
                  : "Active movie nights across all of your groups."}
              </p>
            </div>
            {data.groups.length === 1 ? (
              <Link className={buttonVariants({ size: "sm" })} href={`/groups/${data.groups[0].id}?view=new-event`}>
                <Plus className="h-4 w-4" />
                Create
              </Link>
            ) : null}
          </div>

          {movieNights.length > 0 ? (
            <div className="space-y-4">
              {movieNights.map((movieNight) => {
                const badge = getMovieNightBadge(movieNight.status);

                return (
                  <div
                    key={movieNight.id}
                    className={cn(
                      "rounded-xl border p-6 transition-colors",
                      movieNight.isUpcomingHighlight
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-semibold text-card-foreground">{movieNight.title}</h2>
                          <span className={cn("rounded-full px-3 py-1 text-sm font-medium", badge.className)}>
                            {badge.label}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground">{movieNight.groupName}</p>

                        <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatScheduledDate(movieNight.scheduledFor)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{movieNight.memberCount} members</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Film className="h-4 w-4" />
                            <span>
                              {movieNight.topVote
                                ? `Top vote: ${movieNight.topVote.title}`
                                : "No lead yet"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        className={buttonVariants({
                          size: "sm",
                          variant:
                            movieNight.status === "draft" || movieNight.status === "open"
                              ? "primary"
                              : "secondary"
                        })}
                        href={`/events/${movieNight.id}?view=suggestions`}
                      >
                        {movieNight.status === "draft" || movieNight.status === "open" ? "Vote" : "Open"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
              <Calendar className="mx-auto h-14 w-14 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold text-foreground">No movie nights here yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
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
