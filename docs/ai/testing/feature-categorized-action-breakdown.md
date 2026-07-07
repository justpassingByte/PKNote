---
feature: categorized-action-breakdown
status: draft
---

# Testing: Categorized Action Breakdown

## Unit Tests
- `HandCategoryResolver.test.ts`: Test classification for common board/hand combinations.
  - Ace-high board -> AA is NUTS?
  - Paired board -> Pair is STRONG?
  - Monotone board -> Suited is DRAW?

## Manual Tests
- Check UI rendering with mock data.
- Perform end-to-end solve and inspect the Action Breakdown panel.
