const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";
export const TMDB_POSTER_ASPECT_RATIO = "2 / 3";

export type TmdbImageSize = "w154" | "w185" | "w342" | "w500" | "original";

export function buildTmdbImageUrl(
  path: string | null | undefined,
  size: TmdbImageSize = "w342"
) {
  if (!path) {
    return null;
  }

  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  if (!normalizedPath) {
    return null;
  }

  return `${TMDB_IMAGE_BASE_URL}${size}/${normalizedPath}`;
}
