import type { ReactNode } from "react";
import { ProtectedHeader } from "@/components/protected-header";
import { ensureProfileForUser, requireCurrentUser } from "@/server/auth";

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {
  const user = await requireCurrentUser();
  const profile = await ensureProfileForUser(user);

  return (
    <div className="min-h-screen bg-background">
      <ProtectedHeader profile={profile} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}
