export type ProviderBadgeState =
  | "available_on_our_services"
  | "available_on_host_service"
  | "available_on_x_member_services"
  | "rent_only"
  | "buy_only"
  | "unavailable_in_region"
  | "unknown";

export interface ProviderReference {
  providerId: number;
  providerName: string;
}

export interface GroupMemberSubscription {
  userId: string;
  providerIds: number[];
}

export interface ProviderMatchInput {
  regionCode: string;
  flatrateProviders?: ProviderReference[];
  rentProviders?: ProviderReference[];
  buyProviders?: ProviderReference[];
  groupMemberSubscriptions: GroupMemberSubscription[];
  hostUserId?: string | null;
}

export interface ProviderMatchResult {
  regionCode: string;
  state: ProviderBadgeState;
  availableProviders: ProviderReference[];
  rentProviders: ProviderReference[];
  buyProviders: ProviderReference[];
  matchedProviderIds: number[];
  matchedMemberCount: number;
  hostHasMatch: boolean;
}

function normalizeProviders(providers: ProviderReference[] | undefined): ProviderReference[] {
  if (!providers) {
    return [];
  }

  const seen = new Map<number, ProviderReference>();

  for (const provider of providers) {
    if (!seen.has(provider.providerId)) {
      seen.set(provider.providerId, provider);
    }
  }

  return Array.from(seen.values()).sort((left, right) =>
    left.providerName.localeCompare(right.providerName)
  );
}

export function matchProviderAvailability(input: ProviderMatchInput): ProviderMatchResult {
  const availableProviders = normalizeProviders(input.flatrateProviders);
  const rentProviders = normalizeProviders(input.rentProviders);
  const buyProviders = normalizeProviders(input.buyProviders);

  if (
    availableProviders.length === 0 &&
    rentProviders.length === 0 &&
    buyProviders.length === 0
  ) {
    return {
      regionCode: input.regionCode,
      state: "unknown",
      availableProviders,
      rentProviders,
      buyProviders,
      matchedProviderIds: [],
      matchedMemberCount: 0,
      hostHasMatch: false
    };
  }

  const availableProviderIds = new Set(availableProviders.map((provider) => provider.providerId));
  const matchedMemberIds = new Set<string>();
  const matchedProviderIds = new Set<number>();
  let hostHasMatch = false;

  for (const member of input.groupMemberSubscriptions) {
    const memberMatches = member.providerIds.filter((providerId) =>
      availableProviderIds.has(providerId)
    );

    if (memberMatches.length > 0) {
      matchedMemberIds.add(member.userId);

      for (const providerId of memberMatches) {
        matchedProviderIds.add(providerId);
      }
    }

    if (input.hostUserId && input.hostUserId === member.userId && memberMatches.length > 0) {
      hostHasMatch = true;
    }
  }

  const matchedMemberCount = matchedMemberIds.size;
  const hasMatchedSubscription = matchedProviderIds.size > 0;
  let state: ProviderBadgeState;

  if (hasMatchedSubscription) {
    if (hostHasMatch) {
      state = "available_on_host_service";
    } else if (matchedMemberCount > 1) {
      state = "available_on_x_member_services";
    } else {
      state = "available_on_our_services";
    }
  } else if (rentProviders.length > 0) {
    state = "rent_only";
  } else if (buyProviders.length > 0) {
    state = "buy_only";
  } else if (availableProviders.length === 0) {
    state = "unavailable_in_region";
  } else {
    state = "unknown";
  }

  return {
    regionCode: input.regionCode,
    state,
    availableProviders,
    rentProviders,
    buyProviders,
    matchedProviderIds: Array.from(matchedProviderIds).sort((left, right) => left - right),
    matchedMemberCount,
    hostHasMatch
  };
}

