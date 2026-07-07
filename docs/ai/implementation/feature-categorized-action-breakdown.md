---
feature: categorized-action-breakdown
status: draft
---

# Implementation: Categorized Action Breakdown

## Changeset
- `frontend/src/lib/HandCategoryResolver.ts`: (New file)
- `frontend/src/components/dashboard/PlayerProfileClient.tsx`: Modify `handleSolve`.
- `frontend/src/components/dashboard/StrategyGuide.tsx`: Modify props and rendering.

## Verification Plan
1. Run a solve on an Ace-high board.
2. Verify that `AA` and `AK` appear in NUTS/STRONG.
3. Verify that `72o` appears in AIR.
4. Check that percentages sum to 100% within each category.
