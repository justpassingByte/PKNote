---
feature: solver-pipeline-realism
status: draft
---

# Design: Solver Pipeline Realism

## Architecture Change: Frequency-First Results Mapping

To ensure realistic UI rendering, we are pivoting the solver's public-facing response from branch-normalized range mass to per-hand action frequencies.

### Frequency Mapping Logic

1.  **Baseline Resolution**: `GtoBaselineResolver.resolvePerHand` already produces `ActionFrequencies` (percentages summing to 100).
2.  **Strategic Shaping**: Multipliers from `StrategicLayer` are applied to these baseline percentages.
3.  **Final Normalization**: The resulting weighted actions are normalized per-hand to sum to exactly 100%. This is the "Solver Strategy".

### Scoped Premium Lock (FR4)

A specialized "Action Lock" will be injected during the frequency resolution phase:
- **Condition**: `street === 'preflop' && (spot === 'SRP_IP' || spot === 'SRP_OOP') && handTier === 1`.
- **Logic**: Force `fold_pct = 0`. Redistribute original fold mass proportionally to `raise` and `call`, or re-normalize.
- **Location**: `GtoBaselineResolver.resolvePerHandPreflop`.

## API & Data Models

### 1. Updated `SolveResponse` (FR1)

```typescript
export interface HandStrategy {
    raise_pct: number;
    call_pct: number;
    fold_pct: number;
}

export interface SolveResponse {
    /** New primary contract for UI grid */
    strategy: Record<HandClass, HandStrategy>;
    
    /** Legacy mass-based results (deprecated for grid use) */
    raise: Record<HandClass, number>;
    call: Record<HandClass, number>;
    fold: Record<HandClass, number>;
}
```

### 2. Board Context Expansion (FR3)

Update `BoardTextureBucket` and search/classification logic:
```typescript
export type Connectivity = 'DRY' | 'CONNECTED' | 'VERY_CONNECTED';

export interface BoardTextureBucket {
    // ... existing ...
    connectivity: Connectivity;
}
```

## Controller Mapping & Validation (FR2)

The `SolverController` will act as a strict gateway.

### Spot Mapping
- `3BET_IP` -> `3BP_IP`
- `3BET_OOP` -> `3BP_OOP`
- `4BET_IP` -> `4BP_IP`
- `4BET_OOP` -> `4BP_OOP`

### Stack Bucketization
- `<= 40` -> `SHORT`
- `41 - 80` -> `MEDIUM`
- `81 - 150` -> `DEEP`
- `> 150` -> `VERY_DEEP`

### Validation Policy
- Any input that doesn't match a mapping or a valid enum value will return a `400 Bad Request` with a descriptive error message.

## Implementation Details

### `SolverEngine` Refactor
`SolverEngine.solve` will now:
1.  Initialize the root node.
2.  Compute frequencies via `GtoBaselineResolver.resolvePerHand`.
3.  Apply `StrategicLayer` multipliers to these frequencies.
4.  Optionally perform the branch splitting for the legacy `raise/call/fold` mass records.
5.  Return the combined result.
