---
feature: strength-aware-baseline
status: draft
---

# Plan: Strength-Aware Baseline + Solver Pipeline Realism

## Objective
Align solve output with true per-hand action frequencies and fix contract mismatches that distort the strategy grid.

## Phases

### Phase 1: Solve Contract Refactor
- [ ] Add explicit per-hand frequency response field from solve pipeline:
  - `frequencies[hand] = { raise_pct, call_pct, fold_pct }`.
- [ ] Preserve/label existing `raise/call/fold` maps as branch range-mass artifacts if temporarily retained.
- [ ] Update solve API types and response documentation.

### Phase 2: Request Canonicalization and Validation
- [ ] Implement controller-level spot alias mapping (`3BET/4BET` -> `3BP/4BP`).
- [ ] Implement numeric BB stack bucketization to canonical `StackDepthBucket`.
- [ ] Enforce strict validation for spot/stack/board enums with `400` on invalid values.

### Phase 3: Board Connectivity Integration
- [ ] Extend frontend solve form payload to include `connectivity` for postflop.
- [ ] Ensure backend validates and passes `connectivity` through to baseline logic.

### Phase 4: Scoped Premium Fold Lock
- [ ] In preflop SRP baseline frequency generation, enforce Tier-1 `fold_pct = 0`.
- [ ] Deterministically renormalize raise/call to preserve sum=100.
- [ ] Ensure lock does not apply in non-SRP or postflop contexts.

### Phase 5: Frontend Consumption Migration
- [ ] Switch grid rendering to backend `frequencies` contract.
- [ ] Remove frontend per-hand reconstruction from branch mass for action display.
- [ ] Keep compatibility fallback only during migration window (if needed).

### Phase 6: Testing and Regression
- [ ] Add unit tests for mapping, validation, and premium-lock scope.
- [ ] Add integration tests for solve response contract and realism assertions.
- [ ] Add connectivity effect tests.
- [ ] Keep strategic layer/regression suites green.

## Execution Order
1. Backend solve response contract and mapping/validation.
2. Premium lock + backend tests.
3. Frontend payload (`connectivity`) and rendering migration to `frequencies`.
4. Full regression run and cleanup of any temporary compatibility paths.

## Risks and Mitigations
- Risk: Dual-contract transition creates frontend confusion.
- Mitigation: Explicit response semantics and short-lived compatibility window.

- Risk: Over-scoped premium lock reduces realism.
- Mitigation: Hard-scope lock to preflop SRP Tier-1 only with dedicated tests.

- Risk: Strict validation increases 400 responses initially.
- Mitigation: Provide clear error messages and frontend-side canonical values.
