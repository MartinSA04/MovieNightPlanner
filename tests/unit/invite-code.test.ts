import { describe, expect, it } from "vitest";
import { makeInviteCode, normalizeInviteCode } from "../../apps/web/server/invite-code";

describe("group helpers", () => {
  it("creates uppercase invite codes with the requested length", () => {
    const code = makeInviteCode(10);

    expect(code).toHaveLength(10);
    expect(code).toMatch(/^[A-Z2-9]+$/);
  });

  it("normalizes invite codes to uppercase", () => {
    expect(normalizeInviteCode("  abcd2345  ")).toBe("ABCD2345");
  });

  it("rejects invite codes with ambiguous or unsupported characters", () => {
    expect(normalizeInviteCode("abcd1234")).toBeNull();
    expect(normalizeInviteCode("abcde!23")).toBeNull();
  });
});
