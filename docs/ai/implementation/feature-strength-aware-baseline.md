---
feature: strength-aware-baseline
status: draft
---

# Implementation: Strength-Aware Baseline + Solver Pipeline Realism

## Implementation Status
- Solve API frequency contract: [Pending]
- Controller mapping and validation: [Pending]
- Board connectivity integration: [Pending]
- Scoped premium fold lock (preflop SRP Tier-1): [Pending]
- Frontend migration to `frequencies`: [Pending]
- Test suite updates: [Pending]

## Work Log

### Step 1: Solve API Contract
- Target files:
  - `backend/src/core/solver/strategic/types.ts`
  - `backend/src/core/solver/SolverEngine.ts`
  - `backend/src/controllers/SolverController.ts`
- Deliverable:
  - `frequencies[hand] = { raise_pct, call_pct, fold_pct }` returned for UI consumption.

### Step 2: Canonical Mapping and Validation
- Target files:
  - `backend/src/controllers/SolverController.ts`
  - optional mapper utility under `backend/src/services/...` or `backend/src/utils/...`
- Deliverable:
  - Alias mapping for spot values and stack bucketization.
  - Strict 400 validation for invalid enums/values.

### Step 3: Connectivity in Solve Payload
- Target files:
  - `frontend/src/components/SolveFormFilter.tsx`
  - `frontend/src/lib/solverAPI.ts`
- Deliverable:
  - Postflop solve requests include validated `connectivity`.

### Step 4: Scoped Premium Fold Lock
- Target files:
  - `backend/src/services/analysis/GtoBaselineResolver.ts`
- Deliverable:
  - Tier-1 fold lock in preflop SRP baseline only, with deterministic renormalization.

### Step 5: Frontend Grid Consumption Switch
- Target files:
  - `frontend/src/components/dashboard/StrategyGuide.tsx`
  - `frontend/src/components/dashboard/PlayerProfileClient.tsx`
- Deliverable:
  - Grid reads `frequencies` directly; remove reconstruction from branch mass.

### Step 6: Tests
- Target files:
  - resolver tests in `backend/src/services/analysis/__tests__/...`
  - solver API tests in `backend/src/core/solver/strategic/__tests__/...`
  - controller validation tests (new or existing suite)
- Deliverable:
  - Contract, mapping, connectivity, lock-scope, and realism assertions covered.

## Exit Criteria
- UI grid no longer depends on per-hand reconstruction from branch mass.
- Representative realism checks pass (`AA > 72o` raise behavior; Tier-1 fold lock in preflop SRP).
- New and existing tests pass with deterministic outputs.
