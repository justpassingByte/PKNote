---
feature: strength-aware-baseline
status: draft
---

# Feature: Strength-Aware Baseline Strategy

## Problem Statement
The current baseline strategy is uniform across all hands on all streets (preflop, flop, turn, river). Strong hands (e.g., AA preflop, or Top Set on the flop) often receive the same initial action frequencies as weak hands (e.g., 72o or Air) before strategic multipliers are applied. This leads to unrealistic solver behavior where strong hands aren't aggressive enough and weak hands stay in ranges too often.

## Goals
- Implement a strength-aware baseline for action frequencies across all streets.
- **Preflop**: Use `PreflopRangeTemplates` tiers (TIER_1 to TIER_5).
- **Postflop**: Use hand-strength heuristics (Nuts, Strong, Draw, Air) relative to the board.
- Premium/Strong hands should prefer aggressive actions (Raise).
- Weak/Trash/Air hands should prefer passive or folding actions.
- Preserve baseline differences throughout the pipeline before normalization.

## Non-Goals
- Modifying `StrategicShaper` or `ExploitAdjuster`.
- Changing the public Solver API contract.
- Introducing randomness (must remain deterministic).
- Implementing a full-blown hand evaluator (use enough resolution for categorization).

## User Stories
- As a user, I want to see a natural preflop range distribution (e.g., AA raising, 72o folding) even without exploitative adjustments.

## Success Criteria
- Action frequencies at the baseline layer show distinct "common sense" distributions (Aggressive for strong, fold/passive for weak).
- Preflop Tier 1 hands show high Raise frequencies.
- Postflop "Nuts" or "Top Pair" hands show higher aggression than "Air".
- Solver output remains deterministic and provides realistic distributions.

## Constraints
- Use existing tiers from `PreflopRangeTemplates`.
- Do not change `SolverEngine.solve` signature.
- Maintain integer-domain math where possible (though frequencies are currently percentages).
