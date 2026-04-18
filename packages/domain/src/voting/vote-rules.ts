import type { EventStatus, VoteDto } from "../dto";

export type VoteRuleErrorCode = "event_closed" | "not_group_member";

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
  existingVotes: VoteDto[];
  nextVote: VoteDto;
}

export function canUserVote({ eventStatus, isGroupMember }: VoteContext): boolean {
  return isGroupMember && eventStatus === "open";
}

export function upsertVote(input: UpsertVoteInput): VoteDto[] {
  if (!input.isGroupMember) {
    throw new VoteRuleError("not_group_member", "Only group members can vote.");
  }

  if (input.eventStatus !== "open") {
    throw new VoteRuleError("event_closed", "Votes can only be changed while the movie night is open.");
  }

  const withoutExistingVote = input.existingVotes.filter(
    (vote) => !(vote.eventId === input.nextVote.eventId && vote.userId === input.nextVote.userId)
  );

  return [...withoutExistingVote, input.nextVote];
}

export function tallyVotes(votes: VoteDto[]): Record<string, number> {
  return votes.reduce<Record<string, number>>((totals, vote) => {
    totals[vote.suggestionId] = (totals[vote.suggestionId] ?? 0) + 1;
    return totals;
  }, {});
}
