# Product Spec

## Summary

Movie Night Planner helps small groups move from "what should we watch?" to a clear winner with less friction. The MVP combines group planning, movie suggestions, voting, and region-aware streaming availability.

## Primary Users

* couples
* roommates
* recurring friend groups

## MVP Goals

* authenticate users
* manage user profile and streaming subscriptions
* create groups and invite members
* create movie night events
* search TMDb and submit suggestions
* support one vote per user per event
* show provider badges based on group subscriptions and region
* select an event winner

## Out Of Scope

* native mobile app
* social feed
* AI recommendations
* monetization
* heavy analytics
* full chat product

## Core Workflow

1. User joins or creates a group.
2. Owner or admin creates a movie night event.
3. Members add movie suggestions from TMDb.
4. Members cast or change a single vote while the event is open.
5. The UI shows provider badges using event region plus group subscriptions.
6. The event is locked and a winner is selected.

## Key Screens

* landing page
* login and signup
* invite acceptance page
* dashboard
* groups list
* group detail
* event detail
* profile and settings
* streaming services settings

## UX Principles

* keep the group context obvious
* make voting state legible at a glance
* separate subscription availability from rent/buy availability
* avoid burying permission rules inside presentation components

