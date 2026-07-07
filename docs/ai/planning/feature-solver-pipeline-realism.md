---
feature: solver-pipeline-realism
status: completed
---

# Plan: Solver Pipeline Realism

## Phase 1: Infrastructure & Mapping (FR2, FR3)

### Task 1.1: `BoardTextureBucket` Expansion
- [x] Update `backend/src/services/analysis/context/types.ts` to include `connectivity`.
- [x] Add `connectivity` to `BoardBucketParser`.
- [x] Update `GtoBaselineResolver.applyBoardModifier` to utilize `connectivity`.

### Task 1.2: Controller Mapping Layer
- [x] Implement `SpotMapper` and `StackMapper` utilities in `backend/src/controllers/utils/`.
- [x] Add `3BET -> 3BP`, `4BET -> 4BP` mapping.
- [x] Add numeric-to-bucket mapping for `stack`.
- [x] Add validation to `SolverController` (Return 400 for unknown strings).

## Phase 2: Per-Hand Frequency Refactor (FR1)

### Task 2.1: Contract Update
- [x] Update `backend/src/core/solver/strategic/types.ts` to include `HandStrategy` and the updated `SolveResponse`.

### Task 2.2: `SolverEngine.solve()` Refactor
- [x] Refactor `SolverEngine.solve` to return the new `strategy` Record.
- [x] Use `GtoBaselineResolver.resolvePerHand` and apply `StrategicLayer` multipliers to those frequencies.
- [x] Ensure per-hand normalization.

## Phase 3: Premium Action Lock (FR4)

### Task 3.1: Scoped Premium Locking
- [x] Implement `ActionLock` logic in `GtoBaselineResolver.resolvePerHandPreflop`.
- [x] Scope to: `street = preflop`, `spot = SRP_IP|SRP_OOP`, `HandTier = 1`.
- [x] Force `fold_pct = 0` and re-normalize.

## Phase 4: Frontend Alignment

### Task 4.1: `SolverService` Migration
- [x] Update `frontend/src/services/SolverService.ts` to expect the new `SolveResponse`.
- [x] Map frontend inputs to match backend's numeric stack/bet expectations if needed.

### Task 4.2: UI Rendering (FR1)
- [x] Update `HandCell` to consume `HandStrategy` directly from the `strategy` Map.
- [x] Update `HandMatrix` to handle the new Record structure.
- [x] Add `connectivity` field to `SolveFormFilter`.

## Phase 5: Testing & Verification

### Task 5.1: Backend Tests
- [x] Add `SolverContract.test.ts` for FR1 and FR2.
- [x] Update `GtoBaselineResolver.test.ts` to check premium fold lock (FR4).
- [x] Verify `connectivity` impact on frequencies (FR3).

### Task 5.2: Frontend Verification
- [x] Verify grid displays correct frequencies for AA/AK/72o.
- [x] Verify 3-bet/4-bet pots use correct baselines.
