import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 rounded-[28px] border border-white/40 bg-white/55 px-6 py-5 shadow-glow backdrop-blur sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Movie Night Planner
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Monorepo kickoff
            </p>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600">
            Shared logic lives in packages, trusted writes stay on the server, and docs remain
            close to the implementation.
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}
