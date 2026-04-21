# Product Spec

## Summary

Movie Night Planner helps small groups move from "what should we watch?" to a clear shortlist with less friction. The current product combines group planning, movie-night scheduling, TMDb-backed movie suggestions, ranked voting, and region-aware streaming availability.

## Primary Users

* couples
* roommates
* recurring friend groups

## MVP Goals

* authenticate users
* manage user profile and streaming subscriptions
* create groups and invite members
* create movie nights
* search TMDb and submit suggestions
* support ranked votes with 3 points for 1st, 2 for 2nd, and 1 for 3rd
* show region-aware provider availability during movie search
* keep dashboard and group views focused on upcoming movie nights and current leaders

## Out Of Scope

* native mobile app
* social feed
* AI recommendations
* monetization
* heavy analytics
* full chat product

## Deferred Work

* explicit winner selection and movie-night lock flow
* subscription-aware provider matching surfaced in the movie-night leaderboard
* comments and realtime updates

## Core Workflow

1. User joins or creates a group.
2. Owner or admin creates a movie night.
3. Members add movie suggestions from TMDb.
4. Members open the vote modal and rank up to 3 movie picks in order.
5. The movie list is shown as a leaderboard using 3-2-1 scoring.
6. Group and dashboard views surface the current top-voted movie and upcoming schedule.

## Key Screens

* landing page
* login and signup
* invite acceptance page
* top-nav dashboard with `Groups`, `Movie nights`, and `Upcoming`
* create group
* join group
* group detail
* movie night detail
* add movie search
* profile and settings

## UX Principles

* keep the active group or movie-night context obvious
* make upcoming schedule and current vote leader legible at a glance
* keep voting in a focused modal rather than inlining ranking controls across the movie list
* use a clean tokenized layout with one dominant content surface per page
* avoid burying permission rules inside presentation components
