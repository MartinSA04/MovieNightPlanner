import Link from "next/link";
import type { ReactNode } from "react";
import { Pill } from "@movie-night/ui";
import { ensureProfileForUser, requireCurrentUser } from "@/server/auth";

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {
  const user = await requireCurrentUser();
  const profile = await ensureProfileForUser(user);

  return (
    <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <Link className="text-base font-semibold tracking-tight text-slate-950" href="/">
                Movie Night Planner
              </Link>
              <nav className="flex flex-wrap gap-2 text-sm text-slate-600">
                <Link
                  className="rounded-full bg-slate-900 px-3 py-1.5 text-white transition hover:bg-slate-800"
                  href="/dashboard"
                >
                  Dashboard
                </Link>
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-600">{profile.display_name}</span>
              <Pill tone="muted">{profile.country_code}</Pill>
              <form action="/auth/signout" method="post">
                <button className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
