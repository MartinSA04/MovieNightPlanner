export type CountryCode = string;
export type GroupRole = "owner" | "admin" | "member";
export type EventStatus = "draft" | "open" | "locked" | "completed" | "cancelled";
export type ProviderType = "flatrate" | "rent" | "buy" | "free" | "ads";

export interface UserDto {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  countryCode: CountryCode;
}

export interface StreamingServiceDto {
  id: string;
  tmdbProviderId: number;
  name: string;
  logoPath?: string | null;
  providerType: ProviderType;
}

export interface GroupDto {
  id: string;
  name: string;
  ownerUserId: string;
  countryCode: CountryCode;
  inviteCode: string;
}

export interface GroupMemberDto {
  groupId: string;
  userId: string;
  role: GroupRole;
}

export interface MovieNightEventDto {
  id: string;
  groupId: string;
  title: string;
  description?: string | null;
  scheduledFor?: string | null;
  status: EventStatus;
  regionCode: CountryCode;
  createdByUserId: string;
  winningSuggestionId?: string | null;
}

export interface MovieSuggestionDto {
  id: string;
  eventId: string;
  suggestedByUserId: string;
  tmdbMovieId: number;
  note?: string | null;
}

export interface VoteDto {
  id: string;
  eventId: string;
  suggestionId: string;
  userId: string;
  createdAt?: string;
}

export interface MovieGenreDto {
  id: number;
  name: string;
}

export interface WatchProviderDto {
  displayPriority?: number | null;
  logoPath?: string | null;
  providerId: number;
  providerName: string;
  providerType: ProviderType;
}

export interface WatchProviderAvailabilityDto {
  buyProviders: WatchProviderDto[];
  flatrateProviders: WatchProviderDto[];
  regionCode: CountryCode;
  rentProviders: WatchProviderDto[];
}

export interface TmdbMovieSearchResultDto {
  backdropPath?: string | null;
  originalTitle?: string | null;
  overview?: string | null;
  posterPath?: string | null;
  releaseDate?: string | null;
  tmdbMovieId: number;
  title: string;
  watchProviders?: WatchProviderAvailabilityDto | null;
}

export interface TmdbMovieDetailsDto extends TmdbMovieSearchResultDto {
  genres: MovieGenreDto[];
  languageCode?: string | null;
  rawPayload?: Record<string, unknown>;
  runtime?: number | null;
}
