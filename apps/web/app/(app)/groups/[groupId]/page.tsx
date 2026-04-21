import Link from "next/link";
import { canCreateEvent } from "@movie-night/domain";
import { buttonVariants, cn, inputClassName } from "@movie-night/ui";
import { notFound } from "next/navigation";
import { createEventAction } from "@/app/actions/event-actions";
import { DeleteGroupButton } from "@/components/delete-group-button";
import { GroupInviteDialog } from "@/components/group-invite-dialog";
import { MoviePoster } from "@/components/movie-poster";
import { getEventStatusLabel } from "@/lib/event-status";
import { RegionSelect } from "@/components/region-select";
import { publicEnv } from "@/lib/env";
import { getRegionLabel } from "@/lib/regions";
import { loadGroupPageData } from "@/server/groups";

interface GroupDetailPageProps {
  params: Promise<{
    groupId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    notice?: string;
    view?: string;
  }>;
}

type GroupView = "events" | "members" | "new-event";

function getGroupView(view?: string): GroupView {
  if (view === "members" || view === "new-event") {
    return view;
  }

  return "events";
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

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getReleaseYear(value: string | null) {
  if (!value) {
    return null;
  }

  return value.slice(0, 4);
}

function formatEventMeta(
  status: Parameters<typeof getEventStatusLabel>[0],
  scheduledFor: string | null
) {
  return [getEventStatusLabel(status), formatDate(scheduledFor)]
    .filter((value): value is string => Boolean(value))
    .join(" · ");
}

export default async function GroupDetailPage({ params, searchParams }: GroupDetailPageProps) {
  const { groupId } = await params;
  const feedback = (await searchParams) ?? {};
  const data = await loadGroupPageData(groupId);
  const activeView = getGroupView(feedback.view);

  if (!data) {
    notFound();
  }

  const canManageEvents = canCreateEvent(data.actorRole);
  const canDeleteGroup = data.actorRole === "owner";
  const eventsHref = `/groups/${data.group.id}?view=events`;
  const membersHref = `/groups/${data.group.id}?view=members`;
  const createEventHref = `/groups/${data.group.id}?view=new-event`;
  const inviteLink = new URL(
    `/invite/${data.group.inviteCode}`,
    publicEnv.NEXT_PUBLIC_APP_URL
  ).toString();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {activeView === "new-event" ? "Create movie night" : data.group.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeView === "new-event"
              ? `${data.group.name} · ${getRegionLabel(data.group.countryCode)}`
              : `${formatLabel(data.actorRole)} · ${getRegionLabel(data.group.countryCode)}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeView === "new-event" ? (
            <Link
              className={buttonVariants({ size: "sm", variant: "ghost" })}
              href={eventsHref}
            >
              ← Back
            </Link>
          ) : (
            <>
              <GroupInviteDialog
                inviteCode={data.group.inviteCode}
                inviteLink={inviteLink}
              />
              {canDeleteGroup ? <DeleteGroupButton groupId={data.group.id} /> : null}
            </>
          )}
        </div>
      </header>

      {activeView !== "new-event" ? (
        <>
          <div className="border-b border-border/60">
            <nav className="flex gap-6">
              <Link className={tabLinkClass(activeView === "events")} href={eventsHref}>
                Movie nights
              </Link>
              <Link className={tabLinkClass(activeView === "members")} href={membersHref}>
                Members
              </Link>
            </nav>
          </div>

          {activeView === "events" ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {data.events.length === 1 ? "1 movie night" : `${data.events.length} movie nights`}
                </p>

                {canManageEvents ? (
                  <Link className={buttonVariants({ size: "sm" })} href={createEventHref}>
                    Create
                  </Link>
                ) : null}
              </div>

              {data.events.length > 0 ? (
                <div className="space-y-3">
                  {data.events.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "rounded-2xl border p-5 transition hover:border-primary/40",
                        event.isUpcomingHighlight
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/60 bg-card"
                      )}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <h3 className="text-base font-semibold text-foreground">
                              {event.title}
                            </h3>
                            {event.isUpcomingHighlight ? (
                              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                                Up next
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatEventMeta(event.status, event.scheduledFor)}
                          </p>
                          {event.topVote ? (
                            <div className="flex items-center gap-3 pt-1">
                              <MoviePoster
                                className="w-10 rounded-md"
                                posterPath={event.topVote.posterPath}
                                title={event.topVote.title}
                              />
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                  Top vote
                                </p>
                                <p className="truncate text-sm text-foreground">
                                  {event.topVote.title}
                                  {getReleaseYear(event.topVote.releaseDate)
                                    ? ` · ${getReleaseYear(event.topVote.releaseDate)}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <Link
                          className={buttonVariants({ size: "sm", variant: "outline" })}
                          href={`/events/${event.id}?view=suggestions`}
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-12 text-center">
                  <p className="text-base font-semibold text-foreground">
                    No movie nights yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create one to collect suggestions and votes.
                  </p>
                </div>
              )}
            </section>
          ) : null}

          {activeView === "members" ? (
            <section className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {data.members.length === 1 ? "1 member" : `${data.members.length} members`}
              </p>

              <div className="space-y-2">
                {data.members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {member.displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">{formatLabel(member.role)}</p>
                      <p>Joined {formatDate(member.joinedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {activeView === "new-event" ? (
        <section className="rounded-2xl border border-border/60 bg-card p-6">
          {canManageEvents ? (
            <form action={createEventAction} className="grid gap-5">
              <input name="groupId" type="hidden" value={data.group.id} />
              <label className="grid gap-2 text-sm font-medium text-foreground">
                <span>Title</span>
                <input
                  required
                  className={inputClassName}
                  maxLength={120}
                  name="title"
                  placeholder="Friday thriller showdown"
                  type="text"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                <span>Description</span>
                <textarea
                  className={cn(inputClassName, "min-h-24 py-2.5")}
                  maxLength={500}
                  name="description"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>Region</span>
                  <RegionSelect
                    className={inputClassName}
                    defaultValue={data.group.countryCode}
                    name="regionCode"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-foreground">
                  <span>Schedule</span>
                  <input
                    className={inputClassName}
                    name="scheduledFor"
                    type="datetime-local"
                  />
                </label>
              </div>
              <div className="flex justify-end">
                <button className={buttonVariants({ size: "sm" })} type="submit">
                  Create
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Only owners and admins can create movie nights.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
