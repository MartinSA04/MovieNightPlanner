# ADR 0003: Shared Token And Layout System

## Status

Accepted

## Context

The repo had drifted toward one-off page styling and inconsistent layout structure. The project
needed a single visual system that could be applied across public pages, the authenticated shell,
and detail screens without page-specific gradients or bespoke component styling.

## Decision

Adopt a shared semantic token and layout system for:

* semantic color tokens such as `background`, `card`, `secondary`, `primary`, and `accent`
* a top-header authenticated shell with dashboard-level navigation
* simple card-based surfaces and attached section navigation
* shared button, input, panel, and heading primitives in `packages/ui`

The app should prefer token-driven styling over custom page-level color recipes or glassmorphism.

## Consequences

Positive:

* pages share one readable visual language
* layout decisions are easier to reuse and document
* future UI work can be done by extending primitives instead of inventing new surfaces

Tradeoffs:

* local visual deviations need to be intentional and documented
* some previously custom page treatments were removed to preserve consistency
