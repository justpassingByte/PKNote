---
feature: strength-aware-baseline
status: draft
---

# Testing: Strength-Aware Baseline + Solver Pipeline Realism

## Scope
This plan validates:
- strength-aware baseline behavior
- solve API frequency contract correctness
- frontend/backend mapping and board-context completeness
- scoped premium fold lock behavior

## Unit Test Cases

### 1. Preflop Tier and Resolver Classification
- Verify `PreflopRangeTemplates.getTier('AA') === 1`.
- Verify `PreflopRangeTemplates.getTier('72o') === 6`.
- Verify representative tier boundaries (`AKs`, `88`, `44`, `T9s`).
- Verify `PostflopStrengthResolver.resolve()` remains deterministic for identical inputs.

### 2. Baseline Frequency Invariants
- For `GtoBaselineResolver.resolvePerHand(...)`, each hand sums to 100.
- For preflop SRP (`SRP_IP`, `SRP_OOP`), Tier-1 hands (`AA/KK/QQ/JJ/AKs/AKo`) enforce `fold_pct = 0`.
- Verify lock does not apply for non-SRP spots or postflop streets.

### 3. Input Mapping and Validation
- Spot alias mapping:
  - `3BET_IP -> 3BP_IP`
  - `3BET_OOP -> 3BP_OOP`
  - `4BET_IP -> 4BP_IP`
  - `4BET_OOP -> 4BP_OOP`
- Stack mapping from BB string to bucket:
  - `20 -> SHORT`, `40 -> MEDIUM`, `80 -> DEEP`, `100 -> VERY_DEEP`
- Invalid enums/values return `400` with actionable error.

## Integration Test Cases

### 1. Solve Response Contract
- `SolverEngine.solve()` response includes:
  - explicit per-hand frequencies: `frequencies[hand] = { raise_pct, call_pct, fold_pct }`
- For every hand in `frequencies`, sum equals 100.
- If legacy branch maps are temporarily present, they are treated as range-mass artifacts only.

### 2. Realism Assertions (Representative Hands)
- Preflop SRP: `AA.raise_pct > 72o.raise_pct`.
- Preflop SRP: `72o.fold_pct > AA.fold_pct`.
- Preflop SRP: Tier-1 hands have `fold_pct = 0`.

### 3. Board Connectivity Effect
- Postflop solve with identical params except `connectivity`:
  - `CONNECTED` vs `DISCONNECTED` must produce different draw-heavy frequency behavior.

## Regression Tests
- Existing strategic layer tests remain green.
- Existing baseline resolver tests remain green after contract extension.
- If dual contract mode exists, add compatibility tests for temporary legacy fields.

## Acceptance Criteria
- UI renders per-hand frequencies directly from backend contract (no frontend reconstruction from branch mass).
- No near-uniform `33/33/33` artifact for representative non-zero hands under normal settings.
