import Link from "next/link";
import { canCreateEvent } from "@movie-night/domain";
import {
  Panel,
  Pill,
  SectionHeading,
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
    <div className="mx-auto max-w-5xl space-y-6">
      <Panel className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {activeView === "new-event" ? "Create event" : data.group.name}
                </h1>
                <Pill tone={data.actorRole === "owner" ? "neutral" : "muted"}>{data.actorRole}</Pill>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeView === "new-event" ? <Pill tone="muted">{data.group.name}</Pill> : null}
                <Pill tone="accent">{getRegionLabel(data.group.countryCode)}</Pill>
              </div>
            </div>

            {activeView !== "new-event" ? (
              <nav className="flex flex-wrap gap-2">
                <Link className={viewLinkClass(activeView === "events")} href={eventsHref}>
                  Events
                </Link>
                <Link className={viewLinkClass(activeView === "members")} href={membersHref}>
                  Members
                </Link>
              </nav>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {activeView === "new-event" ? (
              <Link className={buttonVariants({ size: "sm", variant: "secondary" })} href={eventsHref}>
                Back to events
              </Link>
            ) : null}
            {activeView !== "new-event" ? (
              <GroupInviteDialog inviteCode={data.group.inviteCode} inviteLink={inviteLink} />
            ) : null}
          </div>
        </div>
      </Panel>

      {activeView === "events" ? (
        <Panel tone="muted" className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <SectionHeading>Events</SectionHeading>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {data.events.length === 1 ? "1 event" : `${data.events.length} events`}
              </h2>
            </div>

            {canManageEvents ? (
              <Link className={buttonVariants({ size: "sm" })} href={createEventHref}>
                Create event
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
                      <div className="flex flex-wrap gap-2">
                        <Pill tone="muted">{event.status}</Pill>
                        <Pill tone="muted">{formatDate(event.scheduledFor)}</Pill>
                      </div>
                    </div>

                    <Link
                      className={buttonVariants({ size: "sm" })}
                      href={`/events/${event.id}?view=suggestions`}
                    >
                      Open event
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] bg-white px-5 py-10 text-center dark:bg-slate-950">
              <p className="text-lg font-semibold text-slate-950 dark:text-white">No events yet</p>
            </div>
          )}
        </Panel>
      ) : null}

      {activeView === "new-event" ? (
        <Panel className="max-w-3xl">
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
              <button className={buttonVariants()}>Create event</button>
            </form>
          ) : (
            <div className="rounded-[28px] bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              Only owners and admins can create events.
            </div>
          )}
        </Panel>
      ) : null}

      {activeView === "members" ? (
        <Panel className="space-y-5">
          <div className="space-y-2">
            <SectionHeading>Members</SectionHeading>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {data.members.length === 1 ? "1 member" : `${data.members.length} members`}
            </h2>
          </div>

          <div className="grid gap-3">
            {data.members.map((member) => (
              <div key={member.userId} className="rounded-[28px] bg-slate-50 px-5 py-5 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-950 dark:text-white">
                      {member.displayName}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{member.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={member.role === "owner" ? "neutral" : "muted"}>{member.role}</Pill>
                    <Pill tone="muted">{formatDate(member.joinedAt)}</Pill>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
