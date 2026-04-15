export type CountryCode = string;
export type GroupRole = "owner" | "admin" | "member";
export type EventStatus = "draft" | "open" | "locked" | "completed" | "cancelled";

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
  providerType: "flatrate" | "rent" | "buy" | "free" | "ads";
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

