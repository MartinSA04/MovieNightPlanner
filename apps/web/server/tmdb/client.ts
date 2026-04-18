import type {
  MovieGenreDto,
  ProviderType,
  SearchMoviesInput,
  TmdbMovieDetailsDto,
  TmdbMovieSearchResultDto,
  WatchProviderAvailabilityDto,
  WatchProviderDto
} from "@movie-night/domain";
import { searchMoviesSchema } from "@movie-night/domain";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTmdbEnv, hasTmdbEnv } from "@/lib/env";

const TMDB_API_BASE_URL = "https://api.themoviedb.org/3/";
const TMDB_SEARCH_REVALIDATE_SECONDS = 60 * 60;
const TMDB_DETAILS_REVALIDATE_SECONDS = 60 * 60 * 24;
const TMDB_PROVIDER_REVALIDATE_SECONDS = 60 * 60 * 12;
const TMDB_PROVIDER_LIST_REVALIDATE_SECONDS = 60 * 60 * 24;
const MOVIE_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
const PROVIDER_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24;

const tmdbMovieSearchItemSchema = z.object({
  backdrop_path: z.string().nullable().optional(),
  id: z.number().int().positive(),
  original_title: z.string().nullable().optional(),
  overview: z.string().nullable().optional(),
  poster_path: z.string().nullable().optional(),
  release_date: z.string().nullable().optional(),
  title: z.string().min(1)
});

const tmdbMovieSearchResponseSchema = z.object({
  page: z.number().int().optional(),
  results: z.array(tmdbMovieSearchItemSchema)
});

const tmdbGenreSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1)
});

const tmdbMovieDetailsResponseSchema = tmdbMovieSearchItemSchema.extend({
  genres: z.array(tmdbGenreSchema).default([]),
  original_language: z.string().nullable().optional(),
  runtime: z.number().int().nullable().optional()
});

const tmdbWatchProviderSchema = z.object({
  display_priority: z.number().int().nullable().optional(),
  logo_path: z.string().nullable().optional(),
  provider_id: z.number().int().positive(),
  provider_name: z.string().min(1)
});

const tmdbRegionWatchProvidersSchema = z.object({
  ads: z.array(tmdbWatchProviderSchema).optional(),
  buy: z.array(tmdbWatchProviderSchema).optional(),
  flatrate: z.array(tmdbWatchProviderSchema).optional(),
  free: z.array(tmdbWatchProviderSchema).optional(),
  link: z.string().url().optional(),
  rent: z.array(tmdbWatchProviderSchema).optional()
});

const tmdbWatchProvidersResponseSchema = z.object({
  results: z.record(z.string(), tmdbRegionWatchProvidersSchema).default({})
});

const tmdbWatchProviderListResponseSchema = z.object({
  results: z.array(tmdbWatchProviderSchema).default([])
});

type TmdbMovieSearchItem = z.infer<typeof tmdbMovieSearchItemSchema>;
type TmdbMovieDetailsResponse = z.infer<typeof tmdbMovieDetailsResponseSchema>;
type TmdbRegionWatchProviders = z.infer<typeof tmdbRegionWatchProvidersSchema>;
type TmdbWatchProvider = z.infer<typeof tmdbWatchProviderSchema>;

interface MovieCacheRow {
  backdrop_path: string | null;
  genres_json: unknown;
  language_code: string | null;
  original_title: string | null;
  overview: string | null;
  poster_path: string | null;
  raw_payload_json: unknown;
  release_date: string | null;
  runtime: number | null;
  title: string;
  tmdb_movie_id: number;
  updated_at: string;
}

interface WatchProviderCacheRow {
  buy_json: unknown;
  flatrate_json: unknown;
  raw_payload_json: unknown;
  region_code: string;
  rent_json: unknown;
  tmdb_movie_id: number;
  updated_at: string;
}

export interface TmdbWatchProviderCatalogItem {
  displayPriority: number | null;
  logoPath: string | null;
  providerId: number;
  providerName: string;
}

function normalizeReleaseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function normalizeLanguageCode(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isCacheFresh(updatedAt: string, maxAgeMs: number) {
  const updatedAtMs = Date.parse(updatedAt);

  if (!Number.isFinite(updatedAtMs)) {
    return false;
  }

  return Date.now() - updatedAtMs <= maxAgeMs;
}

function tryCreateAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

function isBearerCredential(credential: string) {
  return credential.startsWith("Bearer ") || credential.length > 40;
}

function applyTmdbCredential(url: URL, headers: Headers) {
  const { credential } = getTmdbEnv();

  if (isBearerCredential(credential)) {
    headers.set(
      "Authorization",
      credential.startsWith("Bearer ") ? credential : `Bearer ${credential}`
    );
    return;
  }

  url.searchParams.set("api_key", credential);
}

export function buildTmdbUrl(path: string) {
  return new URL(path.replace(/^\/+/, ""), TMDB_API_BASE_URL);
}

async function fetchTmdb<TSchema extends z.ZodTypeAny>(
  path: string,
  schema: TSchema,
  options: {
    revalidateSeconds: number;
    searchParams?: Record<string, string | undefined>;
  }
): Promise<z.infer<TSchema>> {
  const url = buildTmdbUrl(path);

  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  const headers = new Headers({
    Accept: "application/json"
  });

  applyTmdbCredential(url, headers);

  const response = await fetch(url, {
    headers,
    next: { revalidate: options.revalidateSeconds }
  });

  if (!response.ok) {
    let detail = "";

    try {
      const payload = (await response.json()) as { status_message?: unknown };

      if (typeof payload.status_message === "string" && payload.status_message.trim().length > 0) {
        detail = `: ${payload.status_message.trim()}`;
      }
    } catch {
      detail = "";
    }

    throw new Error(`TMDb request failed with status ${response.status}${detail}`);
  }

  const json = await response.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    throw new Error("TMDb returned an unexpected response shape.");
  }

  return parsed.data;
}

function mapGenre(value: unknown): MovieGenreDto | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybeGenre = value as Record<string, unknown>;

  if (typeof maybeGenre.id !== "number" || typeof maybeGenre.name !== "string") {
    return null;
  }

  return {
    id: maybeGenre.id,
    name: maybeGenre.name
  };
}

function normalizeGenres(value: unknown): MovieGenreDto[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(mapGenre)
    .filter((genre): genre is MovieGenreDto => genre !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function normalizeTmdbMovieSearchResult(
  movie: TmdbMovieSearchItem
): TmdbMovieSearchResultDto {
  return {
    backdropPath: movie.backdrop_path ?? null,
    originalTitle: movie.original_title?.trim() || null,
    overview: movie.overview?.trim() || null,
    posterPath: movie.poster_path ?? null,
    releaseDate: normalizeReleaseDate(movie.release_date),
    tmdbMovieId: movie.id,
    title: movie.title.trim()
  };
}

export function normalizeTmdbMovieDetails(
  movie: TmdbMovieDetailsResponse
): TmdbMovieDetailsDto {
  const normalizedSearchResult = normalizeTmdbMovieSearchResult(movie);

  return {
    ...normalizedSearchResult,
    genres: movie.genres.map((genre) => ({
      id: genre.id,
      name: genre.name
    })),
    languageCode: normalizeLanguageCode(movie.original_language),
    rawPayload: movie as Record<string, unknown>,
    runtime: movie.runtime ?? null
  };
}

function normalizeProviderList(
  providers: TmdbWatchProvider[] | undefined,
  providerType: ProviderType
): WatchProviderDto[] {
  const providerMap = new Map<number, WatchProviderDto>();

  for (const provider of providers ?? []) {
    if (!providerMap.has(provider.provider_id)) {
      providerMap.set(provider.provider_id, {
        displayPriority: provider.display_priority ?? null,
        logoPath: provider.logo_path ?? null,
        providerId: provider.provider_id,
        providerName: provider.provider_name,
        providerType
      });
    }
  }

  return Array.from(providerMap.values()).sort((left, right) => {
    const leftPriority = left.displayPriority ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = right.displayPriority ?? Number.MAX_SAFE_INTEGER;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return left.providerName.localeCompare(right.providerName);
  });
}

export function normalizeTmdbWatchProviderCatalog(
  providers: TmdbWatchProvider[]
): TmdbWatchProviderCatalogItem[] {
  const providerMap = new Map<number, TmdbWatchProviderCatalogItem>();

  for (const provider of providers) {
    if (!providerMap.has(provider.provider_id)) {
      providerMap.set(provider.provider_id, {
        displayPriority: provider.display_priority ?? null,
        logoPath: provider.logo_path ?? null,
        providerId: provider.provider_id,
        providerName: provider.provider_name
      });
    }
  }

  return Array.from(providerMap.values()).sort((left, right) => {
    const leftPriority = left.displayPriority ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = right.displayPriority ?? Number.MAX_SAFE_INTEGER;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return left.providerName.localeCompare(right.providerName);
  });
}

export function normalizeTmdbWatchProviders(
  regionCode: string,
  providers: TmdbRegionWatchProviders | null | undefined
): WatchProviderAvailabilityDto {
  return {
    buyProviders: normalizeProviderList(providers?.buy, "buy"),
    flatrateProviders: normalizeProviderList(providers?.flatrate, "flatrate"),
    regionCode: regionCode.toUpperCase(),
    rentProviders: normalizeProviderList(providers?.rent, "rent")
  };
}

function mapMovieCacheRow(row: MovieCacheRow): TmdbMovieDetailsDto {
  return {
    backdropPath: row.backdrop_path,
    genres: normalizeGenres(row.genres_json),
    languageCode: normalizeLanguageCode(row.language_code),
    originalTitle: row.original_title,
    overview: row.overview,
    posterPath: row.poster_path,
    rawPayload:
      row.raw_payload_json && typeof row.raw_payload_json === "object"
        ? (row.raw_payload_json as Record<string, unknown>)
        : {},
    releaseDate: normalizeReleaseDate(row.release_date),
    runtime: row.runtime,
    tmdbMovieId: row.tmdb_movie_id,
    title: row.title
  };
}

function mapWatchProviderCacheRow(row: WatchProviderCacheRow): WatchProviderAvailabilityDto {
  const normalized = normalizeTmdbWatchProviders(row.region_code, null);

  return {
    ...normalized,
    buyProviders: normalizeProviderList(
      Array.isArray(row.buy_json) ? row.buy_json.filter(Boolean) as TmdbWatchProvider[] : [],
      "buy"
    ),
    flatrateProviders: normalizeProviderList(
      Array.isArray(row.flatrate_json)
        ? (row.flatrate_json.filter(Boolean) as TmdbWatchProvider[])
        : [],
      "flatrate"
    ),
    rentProviders: normalizeProviderList(
      Array.isArray(row.rent_json) ? (row.rent_json.filter(Boolean) as TmdbWatchProvider[]) : [],
      "rent"
    )
  };
}

async function cacheMovieSearchResults(
  results: TmdbMovieSearchResultDto[],
  rawResults: TmdbMovieSearchItem[]
) {
  const admin = tryCreateAdminClient();

  if (!admin || results.length === 0) {
    return;
  }

  const cacheRows = results.map((movie, index) => ({
    backdrop_path: movie.backdropPath ?? null,
    genres_json: [],
    language_code: null,
    original_title: movie.originalTitle ?? null,
    overview: movie.overview ?? null,
    poster_path: movie.posterPath ?? null,
    raw_payload_json: rawResults[index] ?? {},
    release_date: movie.releaseDate,
    runtime: null,
    title: movie.title,
    tmdb_movie_id: movie.tmdbMovieId
  }));

  const { error } = await admin.from("movie_cache").upsert(cacheRows, {
    onConflict: "tmdb_movie_id"
  });

  if (error) {
    console.error(`Could not cache TMDb search results: ${error.message}`);
  }
}

async function cacheMovieDetails(details: TmdbMovieDetailsDto) {
  const admin = tryCreateAdminClient();

  if (!admin) {
    return;
  }

  const { error } = await admin.from("movie_cache").upsert(
    {
      backdrop_path: details.backdropPath ?? null,
      genres_json: details.genres,
      language_code: details.languageCode ?? null,
      original_title: details.originalTitle ?? null,
      overview: details.overview ?? null,
      poster_path: details.posterPath ?? null,
      raw_payload_json: details.rawPayload ?? {},
      release_date: details.releaseDate ?? null,
      runtime: details.runtime ?? null,
      title: details.title,
      tmdb_movie_id: details.tmdbMovieId
    },
    {
      onConflict: "tmdb_movie_id"
    }
  );

  if (error) {
    console.error(`Could not cache TMDb movie details: ${error.message}`);
  }
}

async function cacheWatchProviderAvailability(
  movieId: number,
  regionCode: string,
  providers: TmdbRegionWatchProviders | null | undefined
) {
  const admin = tryCreateAdminClient();

  if (!admin) {
    return;
  }

  const { error } = await admin.from("watch_provider_cache").upsert(
    {
      buy_json: providers?.buy ?? [],
      flatrate_json: providers?.flatrate ?? [],
      raw_payload_json: providers ?? {},
      region_code: regionCode.toUpperCase(),
      rent_json: providers?.rent ?? [],
      tmdb_movie_id: movieId
    },
    {
      onConflict: "tmdb_movie_id,region_code"
    }
  );

  if (error) {
    console.error(`Could not cache TMDb watch providers: ${error.message}`);
  }
}

export function isTmdbConfigured() {
  return hasTmdbEnv();
}

const loadCachedMovieSearchResults = unstable_cache(
  async (query: string, page: number) => {
    const response = await fetchTmdb("/search/movie", tmdbMovieSearchResponseSchema, {
      revalidateSeconds: TMDB_SEARCH_REVALIDATE_SECONDS,
      searchParams: {
        include_adult: "false",
        language: "en-US",
        page: String(page),
        query
      }
    });

    const normalizedResults = response.results
      .slice(0, 8)
      .map((movie) => normalizeTmdbMovieSearchResult(movie));

    await cacheMovieSearchResults(normalizedResults, response.results.slice(0, 8));

    return normalizedResults;
  },
  ["tmdb-search-results"],
  { revalidate: TMDB_SEARCH_REVALIDATE_SECONDS }
);

export async function searchMovies(input: SearchMoviesInput): Promise<TmdbMovieSearchResultDto[]> {
  const parsed = searchMoviesSchema.parse(input);
  const normalizedResults = await loadCachedMovieSearchResults(parsed.query, parsed.page);

  const regionCode = parsed.regionCode;

  if (!regionCode) {
    return normalizedResults;
  }

  return Promise.all(
    normalizedResults.map(async (movie) => {
      try {
        return {
          ...movie,
          watchProviders: await getWatchProviderAvailability(movie.tmdbMovieId, regionCode)
        };
      } catch {
        return {
          ...movie,
          watchProviders: null
        };
      }
    })
  );
}

export async function getMovieDetails(movieId: number): Promise<TmdbMovieDetailsDto> {
  const admin = tryCreateAdminClient();

  if (admin) {
    const { data: cachedRow, error } = await admin
      .from("movie_cache")
      .select(
        "tmdb_movie_id, title, original_title, overview, poster_path, backdrop_path, release_date, runtime, genres_json, language_code, raw_payload_json, updated_at"
      )
      .eq("tmdb_movie_id", movieId)
      .maybeSingle<MovieCacheRow>();

    if (error) {
      console.error(`Could not load TMDb movie cache: ${error.message}`);
    } else if (cachedRow && isCacheFresh(cachedRow.updated_at, MOVIE_CACHE_MAX_AGE_MS)) {
      return mapMovieCacheRow(cachedRow);
    }
  }

  const details = normalizeTmdbMovieDetails(
    await fetchTmdb(`/movie/${movieId}`, tmdbMovieDetailsResponseSchema, {
      revalidateSeconds: TMDB_DETAILS_REVALIDATE_SECONDS,
      searchParams: {
        language: "en-US"
      }
    })
  );

  await cacheMovieDetails(details);

  return details;
}

export async function getWatchProviderAvailability(
  movieId: number,
  regionCode: string
): Promise<WatchProviderAvailabilityDto> {
  const normalizedRegionCode = regionCode.toUpperCase();
  const admin = tryCreateAdminClient();

  if (admin) {
    const { data: cachedRow, error } = await admin
      .from("watch_provider_cache")
      .select(
        "tmdb_movie_id, region_code, flatrate_json, rent_json, buy_json, raw_payload_json, updated_at"
      )
      .eq("tmdb_movie_id", movieId)
      .eq("region_code", normalizedRegionCode)
      .maybeSingle<WatchProviderCacheRow>();

    if (error) {
      console.error(`Could not load TMDb watch-provider cache: ${error.message}`);
    } else if (cachedRow && isCacheFresh(cachedRow.updated_at, PROVIDER_CACHE_MAX_AGE_MS)) {
      return mapWatchProviderCacheRow(cachedRow);
    }
  }

  const response = await fetchTmdb(
    `/movie/${movieId}/watch/providers`,
    tmdbWatchProvidersResponseSchema,
    {
      revalidateSeconds: TMDB_PROVIDER_REVALIDATE_SECONDS
    }
  );
  const regionProviders = (response.results ?? {})[normalizedRegionCode] ?? null;

  await cacheWatchProviderAvailability(movieId, normalizedRegionCode, regionProviders);

  return normalizeTmdbWatchProviders(normalizedRegionCode, regionProviders);
}

export async function listMovieWatchProviders(
  regionCode: string
): Promise<TmdbWatchProviderCatalogItem[]> {
  const normalizedRegionCode = regionCode.toUpperCase();
  const response = await fetchTmdb(
    "/watch/providers/movie",
    tmdbWatchProviderListResponseSchema,
    {
      revalidateSeconds: TMDB_PROVIDER_LIST_REVALIDATE_SECONDS,
      searchParams: {
        language: "en-US",
        watch_region: normalizedRegionCode
      }
    }
  );

  return normalizeTmdbWatchProviderCatalog(response.results);
}
