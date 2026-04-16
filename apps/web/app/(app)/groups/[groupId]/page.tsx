import Link from "next/link";
import { canCreateEvent } from "@movie-night/domain";
import { Panel, Pill, SectionHeading } from "@movie-night/ui";
import { notFound } from "next/navigation";
import { createEventAction } from "@/app/actions/event-actions";
import { loadGroupPageData } from "@/server/groups";

interface GroupDetailPageProps {
  params: Promise<{
    groupId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    notice?: string;
  }>;
}

const menuLinkClass =
  "rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200";

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

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {(feedback.error || feedback.notice) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.error
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {feedback.error ?? feedback.notice}
        </div>
      )}

      <Panel className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="space-y-2">
            <SectionHeading>Group</SectionHeading>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {data.group.name}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone={data.actorRole === "owner" ? "neutral" : "muted"}>{data.actorRole}</Pill>
            <Pill tone="accent">{data.group.countryCode}</Pill>
            <Pill tone="muted">{data.group.inviteCode}</Pill>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          <a className={menuLinkClass} href="#members">
            Members
          </a>
          <a className={menuLinkClass} href="#events">
            Events
          </a>
          <Link className={menuLinkClass} href={`/invite/${data.group.inviteCode}`}>
            Invite
          </Link>
          <Link className={menuLinkClass} href="/dashboard">
            Dashboard
          </Link>
        </nav>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel id="members" className="space-y-5">
          <div className="space-y-2">
            <SectionHeading>Members</SectionHeading>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              {data.members.length === 1 ? "1 member" : `${data.members.length} members`}
            </h2>
          </div>
          <div className="grid gap-3">
            {data.members.map((member) => (
              <div
                key={member.userId}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-950">{member.displayName}</p>
                    <p className="text-sm text-slate-600">{member.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={member.role === "owner" ? "neutral" : "muted"}>{member.role}</Pill>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {formatDate(member.joinedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel id="events" tone="muted" className="space-y-5">
          <div className="space-y-2">
            <SectionHeading>Events</SectionHeading>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Movie nights</h2>
          </div>

          {canCreateEvent(data.actorRole) ? (
            <form action={createEventAction} className="grid gap-4 rounded-2xl bg-white p-4">
              <input name="groupId" type="hidden" value={data.group.id} />
              <label className="space-y-2 text-sm text-slate-700">
                <span>Title</span>
                <input
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-amber-400"
                  maxLength={120}
                  name="title"
                  placeholder="Friday thriller showdown"
                  type="text"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Description</span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-amber-400"
                  maxLength={500}
                  name="description"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Region</span>
                <input
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 uppercase text-slate-950 outline-none transition focus:border-amber-400"
                  defaultValue={data.group.countryCode}
                  maxLength={2}
                  name="regionCode"
                  type="text"
                />
              </label>
              <button className="inline-flex w-fit rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Create event
              </button>
            </form>
          ) : (
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
              Only owners and admins can create events.
            </div>
          )}

          {data.events.length > 0 ? (
            <div className="grid gap-3">
              {data.events.map((event) => (
                <div key={event.id} className="rounded-2xl bg-white px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-950">{event.title}</p>
                      <p className="text-sm text-slate-600">{formatDate(event.scheduledFor)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="muted">{event.status}</Pill>
                      <Link
                        className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                        href={`/events/${event.id}`}
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">No events.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
