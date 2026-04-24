import { z } from "zod";

const countryCodeSchema = z.string().length(2).transform((value) => value.toUpperCase());
const inviteCodeSchema = z
  .string()
  .trim()
  .min(6)
  .max(12)
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/.test(value), {
    message: "Invite codes may only contain uppercase letters and digits 2-9."
  });

export const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  countryCode: countryCodeSchema
});

export const joinGroupByInviteSchema = z.object({
  inviteCode: inviteCodeSchema
});

export const createEventSchema = z.object({
  groupId: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  scheduledFor: z.string().datetime().optional(),
  regionCode: countryCodeSchema
});

export const addSuggestionSchema = z.object({
  eventId: z.string().uuid(),
  tmdbMovieId: z.number().int().positive(),
  note: z.string().trim().max(280).optional()
});

export const removeSuggestionSchema = z.object({
  eventId: z.string().uuid(),
  suggestionId: z.string().uuid()
});

export const searchMoviesSchema = z.object({
  page: z.coerce.number().int().min(1).max(5).default(1),
  query: z.string().trim().min(2).max(100),
  regionCode: countryCodeSchema.optional()
});

const rankedSuggestionIdsSchema = z
  .array(z.string().uuid())
  .max(3)
  .refine((value) => new Set(value).size === value.length, {
    message: "Pick up to 3 different movies."
  });

export const castVoteSchema = z.object({
  eventId: z.string().uuid(),
  suggestionIds: rankedSuggestionIdsSchema
});

export const updateUserSettingsSchema = z.object({
  countryCode: countryCodeSchema,
  providerIds: z.array(z.string().uuid()).max(200)
});

export const transitionEventStatusSchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(["draft", "open", "locked", "completed", "cancelled"]),
  winningSuggestionId: z.string().uuid().nullable().optional()
});

export const postCommentSchema = z.object({
  eventId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000)
});

export const deleteCommentSchema = z.object({
  commentId: z.string().uuid()
});

export const addToWatchlistSchema = z.object({
  tmdbMovieId: z.number().int().positive(),
  note: z.string().trim().max(280).optional()
});

export const markWatchedSchema = z.object({
  tmdbMovieId: z.number().int().positive(),
  eventId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  note: z.string().trim().max(280).optional()
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type JoinGroupByInviteInput = z.infer<typeof joinGroupByInviteSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type AddSuggestionInput = z.infer<typeof addSuggestionSchema>;
export type RemoveSuggestionInput = z.infer<typeof removeSuggestionSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
export type SearchMoviesInput = z.infer<typeof searchMoviesSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
export type TransitionEventStatusInput = z.infer<typeof transitionEventStatusSchema>;
export type PostCommentInput = z.infer<typeof postCommentSchema>;
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
export type AddToWatchlistInput = z.infer<typeof addToWatchlistSchema>;
export type MarkWatchedInput = z.infer<typeof markWatchedSchema>;
