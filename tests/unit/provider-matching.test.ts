import { describe, expect, it } from "vitest";
import { matchProviderAvailability } from "@movie-night/domain";

describe("provider matching", () => {
  it("detects when the host already has an available flatrate provider", () => {
    const result = matchProviderAvailability({
      regionCode: "NO",
      flatrateProviders: [
        { providerId: 8, providerName: "Netflix" },
        { providerId: 337, providerName: "Disney Plus" }
      ],
      rentProviders: [],
      buyProviders: [],
      groupMemberSubscriptions: [
        { userId: "alex", providerIds: [8] },
        { userId: "sam", providerIds: [337] }
      ],
      hostUserId: "alex"
    });

    expect(result.state).toBe("available_on_host_service");
    expect(result.matchedMemberCount).toBe(2);
    expect(result.hostHasMatch).toBe(true);
  });

  it("falls back to rent_only when the group has no matching subscription", () => {
    const result = matchProviderAvailability({
      regionCode: "US",
      flatrateProviders: [{ providerId: 15, providerName: "Hulu" }],
      rentProviders: [{ providerId: 2, providerName: "Apple TV" }],
      buyProviders: [],
      groupMemberSubscriptions: [{ userId: "alex", providerIds: [8] }]
    });

    expect(result.state).toBe("rent_only");
    expect(result.matchedMemberCount).toBe(0);
  });

  it("returns unknown when no provider data exists for the region", () => {
    const result = matchProviderAvailability({
      regionCode: "NO",
      groupMemberSubscriptions: []
    });

    expect(result.state).toBe("unknown");
  });
});

