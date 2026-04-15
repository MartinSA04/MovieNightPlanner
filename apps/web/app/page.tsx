import { canCreateEvent, matchProviderAvailability, tallyVotes } from "@movie-night/domain";
import { Panel, Pill, SectionHeading } from "@movie-night/ui";
import { Clapperboard, ShieldCheck, TvMinimalPlay, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";

const previewVoteTotals = tallyVotes([
  { id: "1", eventId: "event-1", suggestionId: "arrival", userId: "alex" },
  { id: "2", eventId: "event-1", suggestionId: "arrival", userId: "sam" },
  { id: "3", eventId: "event-1", suggestionId: "perfect-days", userId: "jordan" }
]);

const providerPreview = matchProviderAvailability({
  regionCode: "NO",
  flatrateProviders: [
    { providerId: 8, providerName: "Netflix" },
    { providerId: 337, providerName: "Disney Plus" }
  ],
  rentProviders: [{ providerId: 2, providerName: "Apple TV" }],
  buyProviders: [],
  groupMemberSubscriptions: [
    { userId: "alex", providerIds: [8] },
    { userId: "sam", providerIds: [337, 9] },
    { userId: "jordan", providerIds: [2] }
  ],
  hostUserId: "alex"
});

const highlights = [
  {
    icon: Users,
    title: "Group-first planning",
    copy: "Create persistent groups, manage subscriptions, and keep the same movie night crew together."
  },
  {
    icon: Clapperboard,
    title: "TMDb-powered movie search",
    copy: "Search once, cache details, and attach suggestions to events without hiding the source of truth."
  },
  {
    icon: TvMinimalPlay,
    title: "Provider-aware choices",
    copy: "Match region-specific flatrate providers against the services your members already pay for."
  },
  {
    icon: ShieldCheck,
    title: "Server-trusted writes",
    copy: "Membership-sensitive actions stay on the server and validate against strict domain rules."
  }
];

export default function HomePage() {
  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <Panel className="relative overflow-hidden border-none bg-slate-950 px-8 py-10 text-white shadow-glow">
          <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,_rgba(247,178,103,0.35),_transparent_50%),radial-gradient(circle_at_top_right,_rgba(205,83,52,0.3),_transparent_45%)]" />
          <div className="relative space-y-6">
            <Pill tone="accent">Monorepo scaffold ready</Pill>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Settle the movie vote before the snacks get cold.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                This starter repo separates the product into clear boundaries: a Next.js app,
                shared domain logic, Supabase migrations, and docs that stay aligned with code.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Vote Rule</p>
                <p className="mt-2 text-2xl font-semibold">{previewVoteTotals.arrival} votes</p>
                <p className="mt-1 text-sm text-slate-300">One vote per member while the event is open.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Provider Match</p>
                <p className="mt-2 text-2xl font-semibold">{providerPreview.matchedMemberCount} members</p>
                <p className="mt-1 text-sm text-slate-300">Detected on your group’s flatrate services.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Permissions</p>
                <p className="mt-2 text-2xl font-semibold">
                  {canCreateEvent("admin") ? "Admin-ready" : "Locked down"}
                </p>
                <p className="mt-1 text-sm text-slate-300">Event creation starts with owner/admin roles.</p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel tone="accent" className="space-y-5">
          <SectionHeading>What ships in this scaffold</SectionHeading>
          <div className="space-y-4 text-sm leading-7 text-slate-700">
            <p>
              The workspace already includes a shared voting module, provider-matching helpers,
              a baseline Supabase schema, and starter docs for architecture, API contracts, and
              data design.
            </p>
            <p>
              Start with auth, groups, and subscriptions in Phase 1, then layer in events,
              suggestions, votes, and winner selection without rewriting core domain modules.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-sm leading-6 text-slate-700">
            <p className="font-semibold text-slate-900">Preview provider badge state</p>
            <p className="mt-2">
              Region <span className="font-medium text-slate-900">{providerPreview.regionCode}</span> is
              currently{" "}
              <span className="font-medium text-slate-900">
                {providerPreview.state.replaceAll("_", " ")}
              </span>
              .
            </p>
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {highlights.map(({ icon: Icon, title, copy }) => (
          <Panel key={title} className="space-y-3">
            <div className="inline-flex rounded-2xl bg-amber-100 p-3 text-slate-950">
              <Icon size={22} />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
            <p className="text-sm leading-7 text-slate-700">{copy}</p>
          </Panel>
        ))}
      </section>
    </AppShell>
  );
}

