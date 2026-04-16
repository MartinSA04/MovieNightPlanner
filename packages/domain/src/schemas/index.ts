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

export const searchMoviesSchema = z.object({
  page: z.coerce.number().int().min(1).max(5).default(1),
  query: z.string().trim().min(2).max(100),
  regionCode: countryCodeSchema.optional()
});

export const castVoteSchema = z.object({
  eventId: z.string().uuid(),
  suggestionId: z.string().uuid()
});

export const updateUserSettingsSchema = z.object({
  countryCode: countryCodeSchema,
  providerIds: z.array(z.string().uuid()).max(200)
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type JoinGroupByInviteInput = z.infer<typeof joinGroupByInviteSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type AddSuggestionInput = z.infer<typeof addSuggestionSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
export type SearchMoviesInput = z.infer<typeof searchMoviesSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
