import { describe, expect, it } from "vitest";
import { searchMoviesSchema } from "@movie-night/domain";
import {
  buildTmdbUrl,
  normalizeTmdbMovieDetails,
  normalizeTmdbMovieSearchResult,
  normalizeTmdbWatchProviderCatalog,
  normalizeTmdbWatchProviders
} from "@/server/tmdb/client";

describe("tmdb client helpers", () => {
  it("builds TMDb urls without dropping the version path", () => {
    expect(buildTmdbUrl("/search/movie").toString()).toBe(
      "https://api.themoviedb.org/3/search/movie"
    );
    expect(buildTmdbUrl("movie/603/watch/providers").toString()).toBe(
      "https://api.themoviedb.org/3/movie/603/watch/providers"
    );
  });

  it("normalizes movie search results into app DTOs", () => {
    const result = normalizeTmdbMovieSearchResult({
      backdrop_path: "/backdrop.jpg",
      id: 603,
      original_title: " The Matrix ",
      overview: "  Neo learns the truth. ",
      poster_path: "/poster.jpg",
      release_date: "1999-03-31",
      title: " The Matrix "
    });

    expect(result).toEqual({
      backdropPath: "/backdrop.jpg",
      originalTitle: "The Matrix",
      overview: "Neo learns the truth.",
      posterPath: "/poster.jpg",
      releaseDate: "1999-03-31",
      tmdbMovieId: 603,
      title: "The Matrix"
    });
  });

  it("normalizes movie details and keeps genres/runtime", () => {
    const result = normalizeTmdbMovieDetails({
      backdrop_path: null,
      genres: [
        { id: 878, name: "Science Fiction" },
        { id: 28, name: "Action" }
      ],
      id: 603,
      original_language: "en",
      original_title: "The Matrix",
      overview: "Neo learns the truth.",
      poster_path: "/poster.jpg",
      release_date: "1999-03-31",
      runtime: 136,
      title: "The Matrix"
    });

    expect(result.genres).toEqual([
      { id: 878, name: "Science Fiction" },
      { id: 28, name: "Action" }
    ]);
    expect(result.runtime).toBe(136);
    expect(result.languageCode).toBe("en");
    expect(result.tmdbMovieId).toBe(603);
  });

  it("deduplicates and sorts watch providers per region", () => {
    const result = normalizeTmdbWatchProviders("no", {
      buy: [{ provider_id: 2, provider_name: "Apple TV", display_priority: 4, logo_path: null }],
      flatrate: [
        { provider_id: 337, provider_name: "Disney Plus", display_priority: 2, logo_path: null },
        { provider_id: 8, provider_name: "Netflix", display_priority: 1, logo_path: null },
        { provider_id: 8, provider_name: "Netflix", display_priority: 1, logo_path: null }
      ],
      rent: [{ provider_id: 2, provider_name: "Apple TV", display_priority: 4, logo_path: null }]
    });

    expect(result.regionCode).toBe("NO");
    expect(result.flatrateProviders.map((provider) => provider.providerName)).toEqual([
      "Netflix",
      "Disney Plus"
    ]);
    expect(result.rentProviders).toHaveLength(1);
    expect(result.buyProviders).toHaveLength(1);
  });

  it("normalizes provider catalogs for settings", () => {
    const result = normalizeTmdbWatchProviderCatalog([
      { provider_id: 337, provider_name: "Disney Plus", display_priority: 3, logo_path: null },
      { provider_id: 8, provider_name: "Netflix", display_priority: 1, logo_path: "/logo.png" },
      { provider_id: 8, provider_name: "Netflix", display_priority: 1, logo_path: "/logo.png" }
    ]);

    expect(result).toEqual([
      {
        displayPriority: 1,
        logoPath: "/logo.png",
        providerId: 8,
        providerName: "Netflix"
      },
      {
        displayPriority: 3,
        logoPath: null,
        providerId: 337,
        providerName: "Disney Plus"
      }
    ]);
  });

  it("validates TMDb search inputs", () => {
    const parsed = searchMoviesSchema.parse({
      page: "2",
      query: "arrival",
      regionCode: "no"
    });

    expect(parsed).toEqual({
      page: 2,
      query: "arrival",
      regionCode: "NO"
    });
  });
});
