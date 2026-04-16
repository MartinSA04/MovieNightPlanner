import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ensureProfileForUser, requireCurrentUser } from "@/server/auth";
import { loadNavigationGroups } from "@/server/groups";

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {
  const user = await requireCurrentUser();
  const [profile, groups] = await Promise.all([
    ensureProfileForUser(user),
    loadNavigationGroups()
  ]);

  return (
    <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-6 sm:min-h-[calc(100vh-3rem)] lg:flex-row lg:items-start">
        <AppSidebar groups={groups} profile={profile} />
        <div className="min-h-0 min-w-0 flex-1 space-y-6">{children}</div>
      </div>
    </main>
  );
}
