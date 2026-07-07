---
feature: categorized-action-breakdown
status: draft
---

# Feature: Categorized Action Breakdown

## Problem Statement
The current Action Breakdown panel aggregates total raise/call/fold percentages across the entire 169-hand range. This is often uninformative because it obscures how the solver handles different hand strengths (e.g., value vs. bluffs).

## Goals
- Modify the Action Breakdown logic to aggregate actions by hand strength category.
- Provide a more granular view of strategy based on hand strength.
- Implement a lightweight `HandCategoryResolver` for hand classification.

## Non-Goals
- Modifying the core solver engine or `StrategicLayer`.
- Adding new UI components (modifying existing ones is allowed).
- Implementing complex hand evaluation logic (use simple heuristics).

## User Stories
- As a player, I want to see how the solver typically plays "Strong hands" versus "Draws" on a specific board so I can understand the strategic composition of each action.

## Success Criteria
- The Action Breakdown panel shows aggregated frequencies for NUTS, STRONG, TOP_PAIR, DRAW, and AIR categories.
- Hands are correctly classified according to the board texture.
- Frequencies are normalized within each category across actions (raise/call/fold).

## UI & Visualization
- **Range Composition Chart**: The pie chart should represent **Range Composition by Category** (e.g., NUTS: 8%, STRONG: 20%, etc.) instead of global action distribution. This helps users understand the structural makeup of the solver's range.
- **Categorized Breakdown**: Display normalized raise/call/fold percentages for each category.

## Constraints
- Must be a post-processing step on the `SolveResponse`.
- Must use `pairedStatus`, `suitedness`, and `highCardTier` from `BoardTextureBucket`.
- **Exclusivity**: Resolver must always return exactly one category per hand (priority: `NUTS` > `STRONG` > `TOP_PAIR` > `DRAW` > `AIR`).
- **Fallback**: Default to `AIR`.

### Zero Representation Categories

- Categories that have no hand representation for a given board MUST still be rendered.

Example:
If a board texture produces no DRAW hands, the UI should display:

DRAW
Raise: 0%
Call: 0%
Fold: 0%

Rationale:
- Maintains deterministic UI structure
- Prevents layout shifting
- Keeps category ordering consistent
- Simplifies rendering logic