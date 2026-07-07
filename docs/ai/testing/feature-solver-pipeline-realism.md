---
feature: solver-pipeline-realism
status: draft
---

# Testing: Solver Pipeline Realism

## New Contract & Mapping (FR1 & FR2)
- [ ] **Contract Test**: `SolverContract.test.ts` - `SolveResponse` contains `strategy` field with `{ raise_pct, call_pct, fold_pct }`. Sum must be exactly 100 for all 169 hands.
- [ ] **Spot Mapping Test**: `3BET_IP` (Frontend) maps to `3BP_IP` (Backend) logic.
- [ ] **Stack Bucketization Test**: Numeric strings like `"40"` map correctly to `SHORT`.
- [ ] **Validation Guard Test**: Invalid input strings (e.g., `"10BB"`, `"5BET"`) return `400 Bad Request`.

## Realistic Distributions (FR1 & FR4)
- [ ] **Premium Lock Test**: Verify AA/KK show `fold_pct: 0` in SRP preflop.
- [ ] **Frequency Distribution Test**: Verify non-uniform realistic frequencies for `AKs` (High aggression) and `72o` (High fold) in preflop SRP.
- [ ] **Branch Mass Consistency**: Verify legacy fields (`raise`, `call`, `fold` records) still reflect the proportional range mass correctly.

## Board Connectivity (FR3)
- [ ] **Connectivity Filter Test**: Verify `CONNECTED` boards show higher Draw-category frequencies.
- [ ] **Connectivity Mapping Test**: Verify `DRY`, `CONNECTED`, `VERY_CONNECTED` strings are parsed correctly.

## Verification Scenarios
- Preflop BTN vs BB (SRP): BTN/BB AA/KK show `fold_pct: 0`.
- Postflop (Flop, 3BP): Connected board shows significant Draw-category action.
- Stack depth changes (100bb vs 40bb) affect Preflop templates correctly.
