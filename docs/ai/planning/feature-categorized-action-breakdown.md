---
feature: categorized-action-breakdown
status: draft
---

# Planning: Categorized Action Breakdown

## Task Breakdown
### Phase 1: Logic Implementation
- [x] Create `frontend/src/lib/analysis/HandCategoryResolver.ts` with basic heuristics.
- [x] Implement `classify(hand: string, board: BoardTextureBucket): HandCategory`.

### Phase 2: Post-processing Integration
- [x] Update `PlayerProfileClient.tsx` `handleSolve` method.
- [x] Group `SolveResponse` hands into categories.
- [x] Calculate aggregated percentages for each category.

### Phase 3: UI Updates
- [x] Update `StrategyGuide.tsx` props to handle `Record<HandCategory, ActionFreqs>`.
- [x] Update JSX to render the categorized list.
- [x] Repurpose pie chart for Range Composition by Category.

## Implementation Order
1. `HandCategoryResolver.ts`
2. `PlayerProfileClient.tsx`
3. `StrategyGuide.tsx`

## Risks
- Heuristics might be too simple and misclassify hands (e.g. 72o on 772 board).
- UI might get crowded if all 5 categories are always shown.

## Effort Estimate
- Logic: 2 hours
- Integration: 1 hour
- UI: 1 hour
- Total: 4 hours
