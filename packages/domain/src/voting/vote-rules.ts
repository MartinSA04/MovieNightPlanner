import type { EventStatus, VoteDto, VoteRank } from "../dto";

export type VoteRuleErrorCode =
  | "duplicate_suggestion"
  | "event_closed"
  | "invalid_rank"
  | "not_group_member"
  | "too_many_picks";

export const MAX_RANKED_VOTES = 3;

export class VoteRuleError extends Error {
  readonly code: VoteRuleErrorCode;

  constructor(code: VoteRuleErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "VoteRuleError";
  }
}

interface VoteContext {
  eventStatus: EventStatus;
  isGroupMember: boolean;
}

interface UpsertVoteInput extends VoteContext {
  eventId: string;
  existingVotes: VoteDto[];
  nextVotes: VoteDto[];
  userId: string;
}

export function canUserVote({ eventStatus, isGroupMember }: VoteContext): boolean {
  return isGroupMember && (eventStatus === "draft" || eventStatus === "open");
}

export function upsertVote(input: UpsertVoteInput): VoteDto[] {
  if (!input.isGroupMember) {
    throw new VoteRuleError("not_group_member", "Only group members can vote.");
  }

  if (!canUserVote(input)) {
    throw new VoteRuleError(
      "event_closed",
      "Votes can only be changed while the movie night is in planning or open."
    );
  }

  if (input.nextVotes.length > MAX_RANKED_VOTES) {
    throw new VoteRuleError("too_many_picks", "Pick up to 3 movies.");
  }

  const sortedNextVotes = [...input.nextVotes].sort((left, right) => left.rank - right.rank);
  const seenSuggestionIds = new Set<string>();

  sortedNextVotes.forEach((vote, index) => {
    const expectedRank = (index + 1) as VoteRank;

    if (vote.eventId !== input.eventId || vote.userId !== input.userId || vote.rank !== expectedRank) {
      throw new VoteRuleError(
        "invalid_rank",
        "Ranked picks must stay in order from 1st through 3rd."
      );
    }

    if (seenSuggestionIds.has(vote.suggestionId)) {
      throw new VoteRuleError("duplicate_suggestion", "Pick different movies for each rank.");
    }

    seenSuggestionIds.add(vote.suggestionId);
  });

  const withoutExistingVote = input.existingVotes.filter(
    (vote) => !(vote.eventId === input.eventId && vote.userId === input.userId)
  );

  return [...withoutExistingVote, ...sortedNextVotes];
}

export function getVotePoints(rank: VoteRank): number {
  return MAX_RANKED_VOTES + 1 - rank;
}

export function buildRankedVotes(input: {
  eventId: string;
  suggestionIds: string[];
  userId: string;
}): VoteDto[] {
  return upsertVote({
    eventId: input.eventId,
    eventStatus: "open",
    existingVotes: [],
    isGroupMember: true,
    nextVotes: input.suggestionIds.map((suggestionId, index) => ({
      eventId: input.eventId,
      id: `${input.eventId}:${input.userId}:${index + 1}`,
      rank: (index + 1) as VoteRank,
      suggestionId,
      userId: input.userId
    })),
    userId: input.userId
  }).filter((vote) => vote.userId === input.userId && vote.eventId === input.eventId);
}

export function tallyVotes(votes: VoteDto[]): Record<string, number> {
  return votes.reduce<Record<string, number>>((totals, vote) => {
    totals[vote.suggestionId] = (totals[vote.suggestionId] ?? 0) + getVotePoints(vote.rank);
    return totals;
  }, {});
}
