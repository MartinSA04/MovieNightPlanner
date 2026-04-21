import { describe, expect, it } from "vitest";
import {
  VoteRuleError,
  buildRankedVotes,
  canUserVote,
  getVotePoints,
  tallyVotes,
  upsertVote
} from "@movie-night/domain";

describe("voting rules", () => {
  it("allows voting only for draft or open events and group members", () => {
    expect(canUserVote({ eventStatus: "draft", isGroupMember: true })).toBe(true);
    expect(canUserVote({ eventStatus: "open", isGroupMember: true })).toBe(true);
    expect(canUserVote({ eventStatus: "locked", isGroupMember: true })).toBe(false);
    expect(canUserVote({ eventStatus: "open", isGroupMember: false })).toBe(false);
  });

  it("replaces the current user's prior ranked ballot for the event", () => {
    const updatedVotes = upsertVote({
      eventId: "event-1",
      eventStatus: "open",
      isGroupMember: true,
      existingVotes: [
        { id: "vote-1", eventId: "event-1", rank: 1, suggestionId: "a", userId: "sam" },
        { id: "vote-2", eventId: "event-1", rank: 2, suggestionId: "c", userId: "sam" },
        { id: "vote-3", eventId: "event-1", rank: 1, suggestionId: "b", userId: "alex" }
      ],
      nextVotes: buildRankedVotes({
        eventId: "event-1",
        suggestionIds: ["perfect-days", "arrival", "aftersun"],
        userId: "sam"
      }),
      userId: "sam"
    });

    expect(updatedVotes).toEqual([
      { id: "vote-3", eventId: "event-1", rank: 1, suggestionId: "b", userId: "alex" },
      {
        id: "event-1:sam:1",
        eventId: "event-1",
        rank: 1,
        suggestionId: "perfect-days",
        userId: "sam"
      },
      {
        id: "event-1:sam:2",
        eventId: "event-1",
        rank: 2,
        suggestionId: "arrival",
        userId: "sam"
      },
      {
        id: "event-1:sam:3",
        eventId: "event-1",
        rank: 3,
        suggestionId: "aftersun",
        userId: "sam"
      }
    ]);
  });

  it("throws when a non-member attempts to vote", () => {
    expect(() =>
      upsertVote({
        eventId: "event-1",
        eventStatus: "open",
        isGroupMember: false,
        existingVotes: [],
        nextVotes: buildRankedVotes({
          eventId: "event-1",
          suggestionIds: ["a"],
          userId: "sam"
        }),
        userId: "sam"
      })
    ).toThrowError(VoteRuleError);
  });

  it("rejects duplicate picks in the same ballot", () => {
    expect(() =>
      buildRankedVotes({
        eventId: "event-1",
        suggestionIds: ["arrival", "arrival"],
        userId: "sam"
      })
    ).toThrowError(VoteRuleError);
  });

  it("maps ranks to descending point values", () => {
    expect(getVotePoints(1)).toBe(3);
    expect(getVotePoints(2)).toBe(2);
    expect(getVotePoints(3)).toBe(1);
  });

  it("tallies votes by ranked points", () => {
    expect(
      tallyVotes([
        { id: "1", eventId: "event-1", rank: 1, suggestionId: "arrival", userId: "alex" },
        { id: "2", eventId: "event-1", rank: 3, suggestionId: "arrival", userId: "sam" },
        { id: "3", eventId: "event-1", rank: 2, suggestionId: "perfect-days", userId: "jordan" }
      ])
    ).toEqual({
      arrival: 4,
      "perfect-days": 2
    });
  });
});
