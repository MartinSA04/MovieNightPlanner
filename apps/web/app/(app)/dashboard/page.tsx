import Link from "next/link";
import { Panel, Pill, SectionHeading } from "@movie-night/ui";
import { createGroupAction, updateStreamingServicesAction } from "./actions";
import { joinGroupByInviteAction } from "@/app/actions/group-invite-actions";
import { loadDashboardData } from "@/server/groups";

interface DashboardPageProps {
  searchParams?: Promise<{
    error?: string;
    notice?: string;
  }>;
}

const menuLinkClass =
  "rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200";

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const data = await loadDashboardData();
  const selectedServiceIds = new Set(data.selectedServiceIds);

  return (
    <div className="space-y-6">
      {(params.error || params.notice) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            params.error
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {params.error ?? params.notice}
        </div>
      )}

      <Panel className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <SectionHeading>Dashboard</SectionHeading>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Manage groups</h1>
        </div>
        <nav className="flex flex-wrap gap-2">
          <a className={menuLinkClass} href="#groups">
            Groups
          </a>
          <a className={menuLinkClass} href="#join">
            Join
          </a>
          <a className={menuLinkClass} href="#create">
            Create
          </a>
          <a className={menuLinkClass} href="#services">
            Services
          </a>
        </nav>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel id="groups" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <SectionHeading>Groups</SectionHeading>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                {data.groups.length === 1 ? "1 group" : `${data.groups.length} groups`}
              </h2>
            </div>
            <Pill tone="muted">{data.profile.country_code}</Pill>
          </div>

          {data.groups.length > 0 ? (
            <div className="grid gap-4">
              {data.groups.map((group) => (
                <div
                  key={group.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-slate-950">{group.name}</h3>
                        <Pill tone={group.role === "owner" ? "neutral" : "muted"}>
                          {group.role}
                        </Pill>
                      </div>
                      <p className="text-sm text-slate-600">
                        {group.countryCode} · {group.inviteCode}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        href={`/groups/${group.id}`}
                      >
                        Open
                      </Link>
                      <Link
                        className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                        href={`/invite/${group.inviteCode}`}
                      >
                        Invite
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">No groups.</div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel id="create" className="space-y-5">
            <div className="space-y-2">
              <SectionHeading>Create</SectionHeading>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                New group
              </h2>
            </div>
            <form action={createGroupAction} className="grid gap-4">
              <label className="space-y-2 text-sm text-slate-700">
                <span>Group name</span>
                <input
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-amber-400"
                  maxLength={80}
                  name="name"
                  placeholder="Friday Film Club"
                  type="text"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Country</span>
                <input
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center uppercase text-slate-950 outline-none transition focus:border-amber-400"
                  defaultValue={data.profile.country_code}
                  maxLength={2}
                  name="countryCode"
                  placeholder="US"
                  type="text"
                />
              </label>
              <button className="inline-flex w-fit rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Create group
              </button>
            </form>
          </Panel>

          <Panel id="join" className="space-y-5">
            <div className="space-y-2">
              <SectionHeading>Join</SectionHeading>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Invite code</h2>
            </div>
            <form action={joinGroupByInviteAction} className="grid gap-4">
              <label className="space-y-2 text-sm text-slate-700">
                <span>Code</span>
                <input
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 uppercase tracking-[0.16em] text-slate-950 outline-none transition focus:border-amber-400"
                  inputMode="text"
                  maxLength={12}
                  name="inviteCode"
                  placeholder="ABCD2345"
                  type="text"
                />
              </label>
              <button className="inline-flex w-fit rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900">
                Join group
              </button>
            </form>
          </Panel>

          <Panel id="services" tone="muted" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <SectionHeading>Services</SectionHeading>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Streaming services
                </h2>
              </div>
              <Pill tone="accent">{data.selectedServiceIds.length} saved</Pill>
            </div>
            <form action={updateStreamingServicesAction} className="space-y-3">
              <div className="grid gap-3">
                {data.streamingServices.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm text-slate-800"
                  >
                    <span>
                      {service.name}
                      <span className="ml-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {service.providerType}
                      </span>
                    </span>
                    <input
                      defaultChecked={selectedServiceIds.has(service.id)}
                      name="providerIds"
                      type="checkbox"
                      value={service.id}
                    />
                  </label>
                ))}
              </div>
              <button className="inline-flex rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200">
                Save services
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}
