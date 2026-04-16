import { redirect } from "next/navigation";
import { loadNavigationGroups } from "@/server/groups";

interface DashboardPageProps {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    notice?: string;
    view?: string;
  }>;
}

function appendFeedback(
  destination: string,
  params: Awaited<DashboardPageProps["searchParams"]> | undefined
) {
  if (!params) {
    return destination;
  }

  const nextParams = new URLSearchParams();

  if (params.error) {
    nextParams.set("error", params.error);
  }

  if (params.notice) {
    nextParams.set("notice", params.notice);
  }

  if (params.message) {
    nextParams.set("message", params.message);
  }

  const query = nextParams.toString();

  return query ? `${destination}?${query}` : destination;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) ?? {};

  if (params.view === "create") {
    redirect(appendFeedback("/groups/new", params));
  }

  if (params.view === "join") {
    redirect(appendFeedback("/groups/join", params));
  }

  const groups = await loadNavigationGroups();
  const destination = groups[0] ? `/groups/${groups[0].id}` : "/groups/new";

  redirect(appendFeedback(destination, params));
}
