import Link from "next/link";
import { Panel, SectionHeading } from "@movie-night/ui";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/server/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  const menu = [
    { href: "/", label: "Home", active: true },
    { href: user ? "/dashboard" : "/login", label: user ? "Dashboard" : "Login" }
  ];

  const sections: Array<{ href?: string; label: string }> = user
    ? [
        { href: "/dashboard#groups", label: "Groups" },
        { href: "/dashboard#join", label: "Invites" },
        { href: "/dashboard#create", label: "Create" },
        { href: "/dashboard#services", label: "Services" }
      ]
    : [
        { label: "Groups" },
        { label: "Invites" },
        { label: "Events" },
        { label: "Services" }
      ];

  return (
    <AppShell
      actions={
        <>
          <Link
            className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            href={user ? "/dashboard" : "/login"}
          >
            {user ? "Open dashboard" : "Sign in"}
          </Link>
          {!user ? (
            <Link
              className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              href="/login"
            >
              Create account
            </Link>
          ) : null}
        </>
      }
      menu={menu}
      subtitle="Groups, invites, events, and streaming services."
      title="Plan movie nights."
    >
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel className="space-y-4">
          <SectionHeading>Actions</SectionHeading>
          <div className="grid gap-3">
            <Link
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-900"
              href={user ? "/dashboard#groups" : "/login"}
            >
              {user ? "Open groups" : "Sign in to continue"}
            </Link>
            <Link
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-900"
              href={user ? "/dashboard#create" : "/login"}
            >
              {user ? "Create a group" : "Create an account"}
            </Link>
          </div>
        </Panel>

        <Panel tone="muted" className="space-y-4">
          <SectionHeading>Menu</SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            {sections.map((section) => (
              section.href ? (
                <Link
                  key={`${section.href}-${section.label}`}
                  className="rounded-2xl bg-white px-4 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
                  href={section.href}
                >
                  {section.label}
                </Link>
              ) : (
                <div
                  key={section.label}
                  className="rounded-2xl bg-white px-4 py-4 text-base font-semibold text-slate-900"
                >
                  {section.label}
                </div>
              )
            ))}
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
