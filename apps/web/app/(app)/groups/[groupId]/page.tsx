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
import { GroupInviteDialog } from "@/components/group-invite-dialog";
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

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  const eventsHref = `/groups/${data.group.id}?view=events`;
  const membersHref = `/groups/${data.group.id}?view=members`;
  const createEventHref = `/groups/${data.group.id}?view=new-event`;
  const inviteLink = new URL(`/invite/${data.group.inviteCode}`, publicEnv.NEXT_PUBLIC_APP_URL).toString();

  return (
    <div className="mx-auto max-w-5xl">
      <Panel className="overflow-hidden p-0">
        <div className="space-y-6 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {activeView === "new-event" ? "Create movie night" : data.group.name}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {activeView === "new-event"
                    ? `${data.group.name} / ${getRegionLabel(data.group.countryCode)}`
                    : `${formatLabel(data.actorRole)} / ${getRegionLabel(data.group.countryCode)}`}
                </p>
              </div>

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
                <section className="space-y-5 rounded-[32px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
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
                        <div key={event.id} className="rounded-[28px] bg-white px-5 py-5 dark:bg-slate-950">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                              <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
                                {event.title}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {formatLabel(event.status)} / {formatDate(event.scheduledFor)}
                              </p>
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
                    <div className="rounded-[28px] bg-white px-5 py-10 text-center dark:bg-slate-950">
                      <p className="text-lg font-semibold text-slate-950 dark:text-white">No movie nights yet</p>
                    </div>
                  )}
                </section>
              ) : null}

              {activeView === "members" ? (
                <section className="space-y-5 rounded-[32px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70 sm:p-5">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {data.members.length === 1 ? "1 total" : `${data.members.length} total`}
                  </p>

                  <div className="grid gap-3">
                    {data.members.map((member) => (
                      <div key={member.userId} className="rounded-[28px] bg-white px-5 py-5 dark:bg-slate-950">
                        <div className="space-y-2">
                          <p className="text-lg font-semibold text-slate-950 dark:text-white">
                            {member.displayName}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{member.email}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
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
            <section className="rounded-[32px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70 sm:p-5">
              <div className="max-w-3xl">
                {canManageEvents ? (
                  <form action={createEventAction} className="grid gap-4">
                    <input name="groupId" type="hidden" value={data.group.id} />
                    <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
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
                    <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <span>Description</span>
                      <textarea
                        className={cn(inputClassName, "min-h-28")}
                        maxLength={500}
                        name="description"
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <span>Region</span>
                        <RegionSelect
                          className={inputClassName}
                          defaultValue={data.group.countryCode}
                          name="regionCode"
                        />
                      </label>
                      <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <span>Schedule</span>
                        <input className={inputClassName} name="scheduledFor" type="datetime-local" />
                      </label>
                    </div>
                    <button className={buttonVariants()}>Create</button>
                  </form>
                ) : (
                  <div className="rounded-[28px] bg-white px-4 py-4 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
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
