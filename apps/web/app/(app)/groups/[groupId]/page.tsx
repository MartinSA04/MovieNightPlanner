import Link from "next/link";
import { canCreateEvent } from "@movie-night/domain";
import {
  Panel,
  buttonVariants,
  cn,
  inputClassName
} from "@movie-night/ui";
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

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getReleaseYear(value: string | null) {
  if (!value) {
    return null;
  }

  return value.slice(0, 4);
}

function formatEventMeta(status: Parameters<typeof getEventStatusLabel>[0], scheduledFor: string | null) {
  return [getEventStatusLabel(status), formatDate(scheduledFor)]
    .filter((value): value is string => Boolean(value))
    .join(" / ");
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
  const inviteLink = new URL(`/invite/${data.group.inviteCode}`, publicEnv.NEXT_PUBLIC_APP_URL).toString();

  return (
    <div className="mx-auto max-w-5xl">
      <Panel className="overflow-hidden p-0">
        <div className="space-y-6 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                {activeView === "new-event" ? "Create movie night" : data.group.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeView === "new-event"
                  ? `${data.group.name} / ${getRegionLabel(data.group.countryCode)}`
                  : `${formatLabel(data.actorRole)} / ${getRegionLabel(data.group.countryCode)}`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeView === "new-event" ? (
                <Link className={buttonVariants({ size: "sm", variant: "secondary" })} href={eventsHref}>
                  Back to movie nights
                </Link>
              ) : null}
              {activeView !== "new-event" ? (
                <GroupInviteDialog inviteCode={data.group.inviteCode} inviteLink={inviteLink} />
              ) : null}
              {activeView !== "new-event" && canDeleteGroup ? (
                <DeleteGroupButton groupId={data.group.id} />
              ) : null}
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 pt-0 sm:px-6">
          {activeView !== "new-event" ? (
            <div className="space-y-0">
              <nav className="relative z-10 flex flex-wrap gap-2 px-5 sm:px-6">
                <Link className={viewLinkClass(activeView === "events")} href={eventsHref}>
                  Movie nights
                </Link>
                <Link className={viewLinkClass(activeView === "members")} href={membersHref}>
                  Members
                </Link>
              </nav>

              {activeView === "events" ? (
                <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      {data.events.length === 1 ? "1 total" : `${data.events.length} total`}
                    </p>

                    {canManageEvents ? (
                      <Link className={buttonVariants({ size: "sm" })} href={createEventHref}>
                        Create
                      </Link>
                    ) : null}
                  </div>

                  {data.events.length > 0 ? (
                    <div className="grid gap-3">
                      {data.events.map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "rounded-xl border px-5 py-5",
                            event.isUpcomingHighlight
                              ? "border-primary/40 bg-primary/10"
                              : "border-border bg-secondary"
                          )}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                              <div className="space-y-1">
                                {event.isUpcomingHighlight ? (
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                                    Up next
                                  </p>
                                ) : null}
                                <h3 className="text-xl font-semibold text-foreground">
                                  {event.title}
                                </h3>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatEventMeta(event.status, event.scheduledFor)}
                              </p>
                              {event.topVote ? (
                                <div className="flex items-center gap-3 pt-1">
                                  <MoviePoster
                                    className="w-10 rounded-lg"
                                    posterPath={event.topVote.posterPath}
                                    title={event.topVote.title}
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                      Top vote
                                    </p>
                                    <p className="truncate text-sm text-foreground">
                                      {event.topVote.title}
                                      {getReleaseYear(event.topVote.releaseDate)
                                        ? ` / ${getReleaseYear(event.topVote.releaseDate)}`
                                        : ""}
                                    </p>
                                  </div>
                                </div>
                              ) : null}
                            </div>

                            <Link
                              className={buttonVariants({ size: "sm" })}
                              href={`/events/${event.id}?view=suggestions`}
                            >
                              Open
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-secondary px-5 py-10 text-center">
                      <p className="text-lg font-semibold text-foreground">No movie nights yet</p>
                    </div>
                  )}
                </section>
              ) : null}

              {activeView === "members" ? (
                <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
                  <p className="text-sm text-muted-foreground">
                    {data.members.length === 1 ? "1 total" : `${data.members.length} total`}
                  </p>

                  <div className="grid gap-3">
                    {data.members.map((member) => (
                      <div key={member.userId} className="rounded-xl border border-border bg-secondary px-5 py-5">
                        <div className="space-y-2">
                          <p className="text-lg font-semibold text-foreground">
                            {member.displayName}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatLabel(member.role)} / Joined {formatDate(member.joinedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          {activeView === "new-event" ? (
            <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <div className="max-w-3xl">
                {canManageEvents ? (
                  <form action={createEventAction} className="grid gap-4">
                    <input name="groupId" type="hidden" value={data.group.id} />
                    <label className="space-y-2 text-sm font-medium text-foreground">
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
                    <label className="space-y-2 text-sm font-medium text-foreground">
                      <span>Description</span>
                      <textarea
                        className={cn(inputClassName, "min-h-28")}
                        maxLength={500}
                        name="description"
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 text-sm font-medium text-foreground">
                        <span>Region</span>
                        <RegionSelect
                          className={inputClassName}
                          defaultValue={data.group.countryCode}
                          name="regionCode"
                        />
                      </label>
                      <label className="space-y-2 text-sm font-medium text-foreground">
                        <span>Schedule</span>
                        <input className={inputClassName} name="scheduledFor" type="datetime-local" />
                      </label>
                    </div>
                    <button className={buttonVariants()}>Create</button>
                  </form>
                ) : (
                  <div className="rounded-xl border border-border bg-secondary px-4 py-4 text-sm text-muted-foreground">
                    Only owners and admins can create movie nights.
                  </div>
                )}
              </div>
            </section>
          ) : null}

        </div>
      </Panel>
    </div>
  );
}
