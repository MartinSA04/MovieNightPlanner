import { z } from "zod";

const countryCodeSchema = z.string().length(2).transform((value) => value.toUpperCase());

export const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  countryCode: countryCodeSchema
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

export const castVoteSchema = z.object({
  eventId: z.string().uuid(),
  suggestionId: z.string().uuid()
});

export const updateStreamingServicesSchema = z.object({
  providerIds: z.array(z.number().int().positive()).max(20)
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type AddSuggestionInput = z.infer<typeof addSuggestionSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
export type UpdateStreamingServicesInput = z.infer<typeof updateStreamingServicesSchema>;

