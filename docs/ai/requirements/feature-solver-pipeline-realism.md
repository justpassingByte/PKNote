---
feature: solver-pipeline-realism
status: draft
---

# Feature: Solver Pipeline Realism

## Problem Statement
The current solver pipeline has contract and mapping issues that make the UI output look non-GTO-like even when baseline heuristics are reasonable:

1. **Wrong Solve Contract for Grid Rendering**
   - `SolverEngine.solve()` currently returns per-branch **range mass** maps (`raise`, `call`, `fold`).
   - The UI reconstructs per-hand frequencies from these masses by normalizing per hand.
   - This is mathematically invalid for action-frequency display and can flatten many hands toward near-uniform mixes.

2. **Frontend/Backend Enum Mismatches**
   - Spot values differ (`3BET_IP`/`4BET_IP` in frontend vs `3BP_IP`/`4BP_IP` in backend).
   - Stack is sent as numeric BB string (e.g., `"100"`) while backend logic expects `StackDepthBucket` (`SHORT|MEDIUM|DEEP|VERY_DEEP|UNKNOWN`).

3. **Incomplete Board Context**
   - Frontend solve payload omits `connectivity`, so connectivity-dependent postflop logic is never activated.

4. **Premium Fold Realism Gap (Scoped)**
   - In preflop SRP baseline behavior, Tier-1 premiums should not get non-zero fold in displayed action frequencies.
   - Any lock must be narrowly scoped to avoid unrealistic global constraints across all streets/spots.

## Goals
- Return true **per-hand action frequencies** from solver API for grid consumption.
- Keep branch range-mass outputs available only where explicitly needed (internal or separate contract), not as the grid frequency source.
- Unify frontend/backend contracts via a strict controller-level mapping and validation layer.
- Include `connectivity` in solve board payloads.
- Add scoped premium action lock: **preflop + SRP only**, baseline frequency stage.
- Preserve deterministic behavior and integer-domain precision conventions.

## Non-Goals
- Building a full equilibrium solver.
- Reworking strategic layer philosophy (`StrategicShaper`, `ExploitAdjuster`) beyond contract-safe integration changes.
- Adding stochastic randomness.

## User Stories
- As a user, I want each hand cell to show realistic raise/call/fold frequencies, not reconstructed artifacts.
- As a user, when I choose 3-bet/4-bet spots and stack depth, the solver should use the intended templates.
- As a user, connected boards should visibly affect draw-heavy behavior.

## Success Criteria
- Solve response for UI includes per-hand action frequencies directly (no frontend reconstruction required).
- Spot and stack mapping are deterministic and validated; invalid inputs fail fast with 4xx errors.
- Postflop payload includes `connectivity`, and connectivity logic is exercised by tests.
- In preflop SRP baseline frequencies, Tier-1 premiums have `fold_pct = 0`.
- Existing deterministic guarantees and normalization invariants remain intact.

## Functional Requirements

### FR1: Solve API Frequency Contract
- Add/return an explicit per-hand frequency map:
  - `Record<HandClass, { raise_pct: number; call_pct: number; fold_pct: number }>`
- If legacy fields (`raise/call/fold` mass maps) are kept temporarily, they must be documented as range mass and not used by the grid.

### FR2: Contract Mapping and Validation Layer
- Implement controller-level mapping:
  - Spot aliases: `3BET_* -> 3BP_*`, `4BET_* -> 4BP_*`
  - Numeric stack BB to `StackDepthBucket`
- Enforce strict validation:
  - Unknown spot/stack/board enums return `400` with actionable error message.
  - Do not silently coerce to `UNKNOWN` for user-facing solve endpoint.

### FR3: Board Connectivity
- Frontend solve form must send `connectivity` for postflop streets.
- Backend must validate and pass through `connectivity` to baseline/postflop resolvers.

### FR4: Scoped Premium Fold Lock
- Apply only when all are true:
  - `street = preflop`
  - `spot_template` is `SRP_IP` or `SRP_OOP`
  - hand tier is Tier-1
- Enforce `fold_pct = 0`, then deterministically renormalize raise/call to sum 100.
- Must not apply on non-SRP or postflop streets.

## Test Requirements
- API tests for new frequency contract shape and sum invariants.
- Input mapping tests (spot aliases, numeric stack bucketization, invalid values -> 400).
- Integration test proving non-uniform realistic frequencies for representative hands (`AA`, `AKs`, `72o`) in preflop SRP.
- Postflop tests verifying `connectivity` changes classification/frequencies.
- Scoped lock tests ensuring Tier-1 fold lock activates only in preflop SRP.

## Constraints
- Deterministic outputs only.
- Maintain precision-safe math and exact normalization invariants.
- Keep public behavior migration explicit and test-backed.

## Migration Notes
- Preferred: single-step frontend+backend rollout in one PR.
- If phased rollout is necessary, backend must support both contracts temporarily with clear deprecation note and test coverage.
