---
feature: solver-pipeline-realism
status: draft
---

# Implementation: Solver Pipeline Realism

## Summary
Refactoring the solver from branch-normalized range mass to per-hand action frequencies, providing realistic output in the UI.

## Progress (Phase-based)

### Phase 1: Infrastructure & Mapping
- [ ] Task 1.1: `BoardTextureBucket` with `connectivity`. (FR3)
- [ ] Task 1.2: Controller-level mapping (`3BET -> 3BP`, numeric stacks). (FR2)
- [ ] Task 1.2.1: `SolverController` validation policy. (FR2)

### Phase 2: Per-Hand Frequency Refactor
- [ ] Task 2.1: `SolveResponse` type (`Record<Hand, Frequencies>`). (FR1)
- [ ] Task 2.2: `SolverEngine.solve` implementation of frequency-first mapping. (FR1)

### Phase 3: Premium Action Lock
- [ ] Task 3.1: `GtoBaselineResolver.resolvePerHandPreflop` scoped premium lock. (FR4)

### Phase 4: Frontend Alignment
- [ ] Task 4.1: `SolverService` response update.
- [ ] Task 4.2: `HandCell` rendering frequencies directly.
- [ ] Task 4.3: `SolveFormFilter` connectivity and spot mapping.

## Decisions & Notes
- We transition from `Record<Hand, number>` (per-branch) to `Record<Hand, HandStrategy>`.
- `GtoBaselineResolver.resolvePerHand` is already frequency-oriented; the major refactor is to keep it that way through `StrategicLayer`.
- Action Locking is **strictly scoped** to preflop SRP to avoid over-constraining the solver.
