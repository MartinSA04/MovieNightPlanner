import Link from "next/link";
import { Panel, Pill, SectionHeading } from "@movie-night/ui";
import { notFound } from "next/navigation";
import { loadEventPageData } from "@/server/events";

interface EventDetailPageProps {
  params: Promise<{
    eventId: string;
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

export default async function EventDetailPage({
  params,
  searchParams
}: EventDetailPageProps) {
  const { eventId } = await params;
  const feedback = (await searchParams) ?? {};
  const data = await loadEventPageData(eventId);

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
            <SectionHeading>Event</SectionHeading>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {data.event.title}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="muted">{data.event.status}</Pill>
            <Pill tone="accent">{data.event.regionCode}</Pill>
            <Pill tone="muted">{data.group.name}</Pill>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          <a className={menuLinkClass} href="#details">
            Details
          </a>
          <a className={menuLinkClass} href="#stats">
            Stats
          </a>
          <Link className={menuLinkClass} href={`/groups/${data.group.id}`}>
            Group
          </Link>
          <Link className={menuLinkClass} href="/dashboard">
            Dashboard
          </Link>
        </nav>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Panel id="details" className="space-y-5">
          <div className="space-y-2">
            <SectionHeading>Details</SectionHeading>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Overview</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Schedule</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {formatDate(data.event.scheduledFor)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Created by</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {data.event.createdByDisplayName}
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
            {data.event.description?.trim() ? data.event.description : "No description."}
          </div>
        </Panel>

        <Panel id="stats" tone="muted" className="space-y-5">
          <div className="space-y-2">
            <SectionHeading>Stats</SectionHeading>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Participation
            </h2>
          </div>
          <div className="grid gap-3">
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Members</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{data.stats.memberCount}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Suggestions</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {data.stats.suggestionCount}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Votes</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{data.stats.voteCount}</p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
