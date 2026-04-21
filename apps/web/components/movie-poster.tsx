import Image from "next/image";
import { cn } from "@movie-night/ui";
import { buildTmdbImageUrl, TMDB_POSTER_ASPECT_RATIO } from "@/lib/tmdb";

interface MoviePosterProps {
  className?: string;
  posterPath: string | null;
  priority?: boolean;
  size?: "list" | "search";
  title: string;
}

const sizeClassNames = {
  list: "w-20 sm:w-24",
  search: "w-24 sm:w-28"
} as const;

const sizeImageConfig = {
  list: {
    sizes: "(max-width: 640px) 80px, 96px",
    tmdbSize: "w185" as const
  },
  search: {
    sizes: "(max-width: 640px) 96px, 112px",
    tmdbSize: "w342" as const
  }
} as const;

export function MoviePoster({
  className,
  posterPath,
  priority = false,
  size = "list",
  title
}: MoviePosterProps) {
  const imageConfig = sizeImageConfig[size];
  const imageUrl = buildTmdbImageUrl(posterPath, imageConfig.tmdbSize);

  return (
    <div
      className={cn(
        "relative shrink-0 self-start overflow-hidden rounded-lg border border-border/60 bg-secondary",
        sizeClassNames[size],
        className
      )}
      style={{ aspectRatio: TMDB_POSTER_ASPECT_RATIO }}
    >
      {imageUrl ? (
        <Image
          alt={`${title} poster`}
          className="object-cover"
          fill
          priority={priority}
          sizes={imageConfig.sizes}
          src={imageUrl}
        />
      ) : (
        <div className="flex h-full items-center justify-center px-2 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
          No poster
        </div>
      )}
    </div>
  );
}
