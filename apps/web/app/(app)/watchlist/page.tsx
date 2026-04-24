import Link from "next/link";
import { Bookmark, History } from "lucide-react";
import { buttonVariants, cn } from "@movie-night/ui";
import { requireCurrentUser } from "@/server/auth";
import { loadWatched, loadWatchlist } from "@/server/personal-lists";
import { WatchlistRow } from "@/components/watchlist-row";

interface WatchlistPageProps {
  searchParams?: Promise<{
    view?: string;
  }>;
}

type WatchlistView = "watchlist" | "watched";

function getView(value?: string): WatchlistView {
  return value === "watched" ? "watched" : "watchlist";
}

function tabLinkClass(active: boolean) {
  return cn(
    "-mb-px inline-flex h-10 items-center border-b-2 px-1 text-sm font-medium transition-colors",
    active
      ? "border-primary text-foreground"
      : "border-transparent text-muted-foreground hover:text-foreground"
  );
}

export default async function WatchlistPage({ searchParams }: WatchlistPageProps) {
  const user = await requireCurrentUser();
  const params = (await searchParams) ?? {};
  const view = getView(params.view);

  const [watchlist, watched] = await Promise.all([
    loadWatchlist(user.id),
    loadWatched(user.id)
  ]);

  const rows = view === "watched" ? watched : watchlist;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          My movies
        </h1>
        <p className="text-sm text-muted-foreground">
          A private shelf of what you want to watch and what you have seen.
        </p>
      </header>

      <div className="border-b border-border/60">
        <nav className="flex gap-6">
          <Link
            className={tabLinkClass(view === "watchlist")}
            href="/watchlist?view=watchlist"
          >
            <Bookmark className="mr-2 h-4 w-4" />
            To watch
            <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {watchlist.length}
            </span>
          </Link>
          <Link
            className={tabLinkClass(view === "watched")}
            href="/watchlist?view=watched"
          >
            <History className="mr-2 h-4 w-4" />
            Watched
            <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {watched.length}
            </span>
          </Link>
        </nav>
      </div>

      {rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map((movie) => (
            <WatchlistRow key={movie.tmdbMovieId} kind={view} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-12 text-center">
          <p className="text-base font-semibold text-foreground">
            {view === "watchlist" ? "Your watchlist is empty" : "You have not marked anything watched yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {view === "watchlist"
              ? "Add movies from a TMDb search and they will show up here."
              : "Finished movie nights add their winner to your watched list automatically."}
          </p>
          <Link
            className={cn(buttonVariants({ size: "sm" }), "mt-4")}
            href="/dashboard?view=groups"
          >
            Back to groups
          </Link>
        </div>
      )}
    </div>
  );
}
