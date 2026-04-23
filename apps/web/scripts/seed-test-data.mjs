#!/usr/bin/env node
// Seeds the local Supabase stack with a handful of test users, groups, and
// movie nights. Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// in .env.local (populated by `corepack pnpm setup:local-env`).

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../../..");

const TEST_EMAIL_DOMAIN = "test.movienight.local";
const TEST_PASSWORD = "password123";

function loadEnvFile(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return {};
  }

  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

function resolveEnv() {
  const fileEnv = {
    ...loadEnvFile(resolve(repoRoot, "apps/web/.env.local")),
    ...loadEnvFile(resolve(repoRoot, ".env.local"))
  };

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Start the local stack with 'corepack pnpm local:up' and run 'corepack pnpm setup:local-env'."
    );
  }

  return { supabaseUrl, serviceRoleKey };
}

const testUserSpecs = [
  { key: "alice", displayName: "Alice Carter", countryCode: "US" },
  { key: "bob", displayName: "Bob Lee", countryCode: "US" },
  { key: "carol", displayName: "Carol Diaz", countryCode: "GB" },
  { key: "dave", displayName: "Dave Okonkwo", countryCode: "CA" },
  { key: "erin", displayName: "Erin Park", countryCode: "NO" }
];

const testMovies = {
  inception: {
    tmdbId: 27205,
    title: "Inception",
    posterPath: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    releaseDate: "2010-07-16"
  },
  matrix: {
    tmdbId: 603,
    title: "The Matrix",
    posterPath: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    releaseDate: "1999-03-31"
  },
  interstellar: {
    tmdbId: 157336,
    title: "Interstellar",
    posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    releaseDate: "2014-11-05"
  },
  fightClub: {
    tmdbId: 550,
    title: "Fight Club",
    posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    releaseDate: "1999-10-15"
  },
  pulpFiction: {
    tmdbId: 680,
    title: "Pulp Fiction",
    posterPath: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    releaseDate: "1994-09-10"
  },
  darkKnight: {
    tmdbId: 155,
    title: "The Dark Knight",
    posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    releaseDate: "2008-07-16"
  },
  forrestGump: {
    tmdbId: 13,
    title: "Forrest Gump",
    posterPath: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    releaseDate: "1994-06-23"
  },
  godfather: {
    tmdbId: 238,
    title: "The Godfather",
    posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    releaseDate: "1972-03-14"
  }
};

function daysFromNow(days) {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + days);
  return now.toISOString();
}

async function wipeExistingTestData(admin) {
  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    perPage: 1000
  });

  if (listError) {
    throw new Error(`Could not list users for cleanup: ${listError.message}`);
  }

  const testUserIds = list.users
    .filter((user) => user.email?.endsWith(`@${TEST_EMAIL_DOMAIN}`))
    .map((user) => user.id);

  if (testUserIds.length === 0) return;

  const { data: ownedGroups, error: groupsError } = await admin
    .from("groups")
    .select("id")
    .in("owner_user_id", testUserIds);

  if (groupsError) {
    throw new Error(`Could not find test groups: ${groupsError.message}`);
  }

  if (ownedGroups && ownedGroups.length > 0) {
    const { error: deleteGroupsError } = await admin
      .from("groups")
      .delete()
      .in(
        "id",
        ownedGroups.map((g) => g.id)
      );

    if (deleteGroupsError) {
      throw new Error(`Could not delete test groups: ${deleteGroupsError.message}`);
    }
  }

  for (const userId of testUserIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      console.warn(`  could not delete user ${userId}: ${error.message}`);
    }
  }
}

async function createTestUser(admin, spec) {
  const email = `${spec.key}@${TEST_EMAIL_DOMAIN}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: spec.displayName,
      country_code: spec.countryCode
    }
  });

  if (error) {
    throw new Error(`Could not create user ${spec.key}: ${error.message}`);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      display_name: spec.displayName,
      email,
      country_code: spec.countryCode
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw new Error(`Could not upsert profile for ${spec.key}: ${profileError.message}`);
  }

  return { ...spec, id: data.user.id, email };
}

async function seedMovieCache(admin) {
  const rows = Object.values(testMovies).map((movie) => ({
    tmdb_movie_id: movie.tmdbId,
    title: movie.title,
    poster_path: movie.posterPath,
    release_date: movie.releaseDate
  }));

  const { error } = await admin
    .from("movie_cache")
    .upsert(rows, { onConflict: "tmdb_movie_id" });

  if (error) {
    throw new Error(`Could not seed movie_cache: ${error.message}`);
  }
}

async function createGroup(admin, owner, input) {
  const { data: group, error } = await admin
    .from("groups")
    .insert({
      name: input.name,
      country_code: input.countryCode ?? owner.countryCode,
      owner_user_id: owner.id,
      invite_code: input.inviteCode
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Could not create group ${input.name}: ${error.message}`);
  }

  const memberships = [
    { group_id: group.id, user_id: owner.id, role: "owner" },
    ...input.members.map((member) => ({
      group_id: group.id,
      user_id: member.user.id,
      role: member.role
    }))
  ];

  const { error: memberError } = await admin
    .from("group_members")
    .insert(memberships);

  if (memberError) {
    throw new Error(
      `Could not add members to group ${input.name}: ${memberError.message}`
    );
  }

  return group.id;
}

async function createEvent(admin, groupId, creator, input) {
  const { data: event, error: eventError } = await admin
    .from("movie_night_events")
    .insert({
      group_id: groupId,
      title: input.title,
      description: input.description ?? null,
      scheduled_for: input.scheduledFor ?? null,
      status: input.status,
      region_code: input.regionCode ?? "US",
      created_by_user_id: creator.id
    })
    .select("id")
    .single();

  if (eventError) {
    throw new Error(`Could not create event ${input.title}: ${eventError.message}`);
  }

  if (!input.suggestions?.length) return event.id;

  const suggestionRows = input.suggestions.map((suggestion) => ({
    event_id: event.id,
    suggested_by_user_id: suggestion.suggestedBy.id,
    tmdb_movie_id: suggestion.movie.tmdbId,
    note: suggestion.note ?? null
  }));

  const { data: suggestions, error: sugError } = await admin
    .from("movie_suggestions")
    .insert(suggestionRows)
    .select("id, tmdb_movie_id");

  if (sugError) {
    throw new Error(`Could not create suggestions for ${input.title}: ${sugError.message}`);
  }

  if (!input.votes?.length) return event.id;

  const suggestionIdByMovieId = new Map(
    suggestions.map((row) => [row.tmdb_movie_id, row.id])
  );

  const voteRows = [];
  for (const voteSet of input.votes) {
    voteSet.picks.forEach((movie, index) => {
      const suggestionId = suggestionIdByMovieId.get(movie.tmdbId);
      if (!suggestionId) return;
      voteRows.push({
        event_id: event.id,
        suggestion_id: suggestionId,
        user_id: voteSet.user.id,
        choice_rank: index + 1
      });
    });
  }

  if (voteRows.length > 0) {
    const { error: voteError } = await admin.from("votes").insert(voteRows);
    if (voteError) {
      throw new Error(`Could not create votes for ${input.title}: ${voteError.message}`);
    }
  }

  return event.id;
}

async function main() {
  const { supabaseUrl, serviceRoleKey } = resolveEnv();
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log("Removing previous test data...");
  await wipeExistingTestData(admin);

  console.log("Creating test users...");
  const users = {};
  for (const spec of testUserSpecs) {
    users[spec.key] = await createTestUser(admin, spec);
    console.log(`  ${users[spec.key].email}`);
  }

  console.log("Seeding movie cache...");
  await seedMovieCache(admin);

  console.log("Creating groups and movie nights...");
  const friendsGroupId = await createGroup(admin, users.alice, {
    name: "Friday Night Crew",
    countryCode: "US",
    inviteCode: "TESTFRI",
    members: [
      { user: users.bob, role: "admin" },
      { user: users.carol, role: "member" },
      { user: users.dave, role: "member" }
    ]
  });

  const familyGroupId = await createGroup(admin, users.carol, {
    name: "Carter Family",
    countryCode: "GB",
    inviteCode: "TESTFAM",
    members: [
      { user: users.alice, role: "member" },
      { user: users.erin, role: "admin" }
    ]
  });

  const smallGroupId = await createGroup(admin, users.erin, {
    name: "Just Us Two",
    countryCode: "NO",
    inviteCode: "TESTTWO",
    members: [{ user: users.dave, role: "member" }]
  });

  await createEvent(admin, friendsGroupId, users.alice, {
    title: "Inception rewatch",
    scheduledFor: daysFromNow(4),
    status: "open",
    regionCode: "US",
    suggestions: [
      { suggestedBy: users.alice, movie: testMovies.inception },
      { suggestedBy: users.bob, movie: testMovies.matrix },
      { suggestedBy: users.carol, movie: testMovies.interstellar }
    ],
    votes: [
      {
        user: users.alice,
        picks: [testMovies.inception, testMovies.interstellar, testMovies.matrix]
      },
      {
        user: users.bob,
        picks: [testMovies.inception, testMovies.matrix, testMovies.interstellar]
      },
      {
        user: users.carol,
        picks: [testMovies.interstellar, testMovies.inception, testMovies.matrix]
      },
      { user: users.dave, picks: [testMovies.inception, testMovies.interstellar] }
    ]
  });

  await createEvent(admin, friendsGroupId, users.bob, {
    title: "Last Friday's pick",
    scheduledFor: daysFromNow(-8),
    status: "completed",
    regionCode: "US",
    suggestions: [
      { suggestedBy: users.bob, movie: testMovies.fightClub },
      { suggestedBy: users.alice, movie: testMovies.pulpFiction }
    ],
    votes: [
      { user: users.alice, picks: [testMovies.fightClub] },
      { user: users.bob, picks: [testMovies.fightClub] },
      { user: users.carol, picks: [testMovies.pulpFiction, testMovies.fightClub] }
    ]
  });

  await createEvent(admin, familyGroupId, users.carol, {
    title: "Sunday cosy",
    scheduledFor: daysFromNow(10),
    status: "open",
    regionCode: "GB",
    suggestions: [
      { suggestedBy: users.carol, movie: testMovies.darkKnight },
      { suggestedBy: users.alice, movie: testMovies.forrestGump },
      { suggestedBy: users.erin, movie: testMovies.godfather }
    ],
    votes: [
      {
        user: users.carol,
        picks: [testMovies.forrestGump, testMovies.darkKnight, testMovies.godfather]
      },
      { user: users.alice, picks: [testMovies.forrestGump, testMovies.godfather] },
      { user: users.erin, picks: [testMovies.godfather, testMovies.forrestGump] }
    ]
  });

  await createEvent(admin, familyGroupId, users.erin, {
    title: "Picks still brewing",
    scheduledFor: null,
    status: "draft",
    regionCode: "GB"
  });

  await createEvent(admin, smallGroupId, users.erin, {
    title: "Something cosy",
    scheduledFor: daysFromNow(2),
    status: "open",
    regionCode: "NO",
    suggestions: [
      { suggestedBy: users.erin, movie: testMovies.forrestGump },
      { suggestedBy: users.dave, movie: testMovies.interstellar }
    ],
    votes: [
      { user: users.erin, picks: [testMovies.forrestGump, testMovies.interstellar] }
    ]
  });

  console.log("\nTest data ready. Sign in with password 'password123':");
  for (const user of Object.values(users)) {
    console.log(`  ${user.email}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
