import { describe, expect, it } from "vitest";
import { VoteRuleError, canUserVote, tallyVotes, upsertVote } from "@movie-night/domain";

describe("voting rules", () => {
  it("allows voting only for open events and group members", () => {
    expect(canUserVote({ eventStatus: "open", isGroupMember: true })).toBe(true);
    expect(canUserVote({ eventStatus: "locked", isGroupMember: true })).toBe(false);
    expect(canUserVote({ eventStatus: "open", isGroupMember: false })).toBe(false);
  });

  it("replaces the current user's prior vote for the event", () => {
    const updatedVotes = upsertVote({
      eventStatus: "open",
      isGroupMember: true,
      existingVotes: [
        { id: "vote-1", eventId: "event-1", suggestionId: "a", userId: "sam" },
        { id: "vote-2", eventId: "event-1", suggestionId: "b", userId: "alex" }
      ],
      nextVote: { id: "vote-3", eventId: "event-1", suggestionId: "c", userId: "sam" }
    });

    expect(updatedVotes).toEqual([
      { id: "vote-2", eventId: "event-1", suggestionId: "b", userId: "alex" },
      { id: "vote-3", eventId: "event-1", suggestionId: "c", userId: "sam" }
    ]);
  });

  it("throws when a non-member attempts to vote", () => {
    expect(() =>
      upsertVote({
        eventStatus: "open",
        isGroupMember: false,
        existingVotes: [],
        nextVote: { id: "vote-1", eventId: "event-1", suggestionId: "a", userId: "sam" }
      })
    ).toThrowError(VoteRuleError);
  });

  it("tallies votes by suggestion", () => {
    expect(
      tallyVotes([
        { id: "1", eventId: "event-1", suggestionId: "arrival", userId: "alex" },
        { id: "2", eventId: "event-1", suggestionId: "arrival", userId: "sam" },
        { id: "3", eventId: "event-1", suggestionId: "perfect-days", userId: "jordan" }
      ])
    ).toEqual({
      arrival: 2,
      "perfect-days": 1
    });
  });
});

