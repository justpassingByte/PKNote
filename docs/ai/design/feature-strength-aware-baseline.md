---
feature: strength-aware-baseline
status: draft
---

# Design: Strength-Aware Baseline + Realistic Solve Contract

## Context
The codebase already includes strength-aware baseline infrastructure:
- `GtoBaselineResolver.resolvePerHand()` delegates by street.
- Preflop strength comes from `PreflopRangeTemplates.getTier(hand)`.
- Postflop strength comes from `PostflopStrengthResolver.resolve(hand, board)`.

The remaining realism gap is primarily pipeline contract and mapping integration, not missing baseline scaffolding.

## Design Objectives
- Preserve existing deterministic strength-aware baseline behavior.
- Expose correct per-hand action frequencies to UI directly.
- Eliminate frontend reconstruction of frequencies from branch mass.
- Enforce strict input mapping/validation for spot/stack/board buckets.
- Add scoped premium fold lock for preflop SRP baseline only.

## Current vs Target Data Flow

### Current (Problematic for grid frequencies)
1. `GtoBaselineResolver.resolvePerHand()` computes per-hand action frequencies.
2. `RangeMath.splitRawPerHand()` applies those frequencies to range mass.
3. Strategic multipliers are applied per branch.
4. Each branch is normalized independently.
5. API returns branch range mass maps (`raise/call/fold`).
6. Frontend normalizes branch masses per hand to infer frequencies.

Issue: step 6 is not equivalent to true action-frequency semantics for display.

### Target
1. Keep existing split + strategic flow for branch ranges.
2. Compute and return explicit per-hand action frequencies for UI grid.
3. Treat branch ranges as separate artifacts (internal or explicitly labeled if exposed).
4. Frontend renders frequencies directly; no per-hand reconstruction from branch mass.

## Components and Changes

### 1. Solver API Contract Layer
- Add a frequency payload field in solve response:
  - `frequencies[hand] = { raise_pct, call_pct, fold_pct }`
- Keep backward compatibility only if needed for migration window.
- Document semantics clearly:
  - `frequencies`: action probabilities per hand.
  - `raise/call/fold`: branch range mass maps (if retained).

### 2. Controller Mapping/Validation
- Introduce canonical request normalization in `SolverController` (or dedicated mapper):
  - Spot alias normalization (`3BET_*`, `4BET_*` -> `3BP_*`, `4BP_*`).
  - Numeric stack BB -> `StackDepthBucket` bucketization.
  - Postflop board validation requiring canonical enums, including `connectivity`.
- Invalid values return `400` with explicit field-level error.

### 3. Baseline Frequency Guard (Scoped Action Lock)
- Hook into preflop per-hand baseline resolution:
  - Condition: `street = preflop` and `spot_template in {SRP_IP, SRP_OOP}` and `tier = 1`.
  - Force `fold_pct = 0`.
  - Renormalize raise/call deterministically to keep sum 100.
- Do not apply outside preflop SRP.

### 4. Board Connectivity Integration
- Extend frontend solve form payload to include `connectivity` for postflop.
- Ensure backend baseline uses the supplied connectivity consistently.

## Determinism and Precision
- Keep deterministic, no-random policy.
- Preserve existing integer-domain precision and normalization rules.
- Any frequency-level renormalization must maintain exact sum invariants.

## Edge Cases
- Zero-weight hand classes in branch ranges remain valid and may display as `fold=100` or hidden by UI policy.
- Unknown enum inputs are rejected at API boundary (no silent downgrade in user-facing endpoint).
- Preflop requests must not require board fields.

## Testing Plan

### Unit
- Mapping utilities:
  - spot alias normalization
  - stack BB bucketization
  - board enum validation (including connectivity)
- Premium lock logic:
  - applies in preflop SRP Tier-1
  - does not apply elsewhere

### Integration
- `SolverEngine.solve()` response includes frequency map with per-hand sums = 100.
- Representative realism assertions:
  - preflop SRP: `AA` raise > `72o` raise
  - preflop SRP: Tier-1 fold = 0
  - postflop connectivity changes draw-heavy frequencies

### Regression
- Existing strategic layer tests remain green.
- Legacy response compatibility tests (only if dual contract is temporarily supported).

## Rollout
- Preferred: frontend and backend updated in same PR.
- If phased rollout:
  - backend supports both old and new response fields temporarily,
  - frontend switches to `frequencies`,
  - remove deprecated fields after migration window.
