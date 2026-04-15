const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";

function getTmdbCredential() {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("TMDB_API_KEY is required before calling TMDb.");
  }

  return apiKey;
}

export async function searchMovies(query: string) {
  const credential = getTmdbCredential();
  const url = new URL("/search/movie", TMDB_API_BASE_URL);
  url.searchParams.set("query", query);

  const headers: HeadersInit = {
    Accept: "application/json"
  };

  if (credential.startsWith("Bearer ")) {
    headers.Authorization = credential;
  } else {
    url.searchParams.set("api_key", credential);
  }

  const response = await fetch(url, {
    headers,
    next: { revalidate: 3_600 }
  });

  if (!response.ok) {
    throw new Error(`TMDb search failed with status ${response.status}.`);
  }

  return response.json();
}
