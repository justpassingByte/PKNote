---
feature: ui-responsiveness
status: completed
---

# Plan: UI Responsiveness & Mobile Optimization

## Task Breakdown

### Phase 1: Core Layout & Navigation
Target: `RootLayout`, `Header`, `Sidebar`.
- [x] Update `RootLayout.tsx` for mobile viewports.
- [x] Add mobile navigation (Hamburger menu/Slide-over) to `Header.tsx`.
- [x] Ensure the background image and overlay scale correctly without affecting accessibility.

### Phase 2: Player Dashboard (Mobile-First)
Target: `PlayerListClient`, `MetricsBar`, `DashboardToolbar`, `PlayerHUD`.
- [x] Refactor `PlayerListClient.tsx` with responsive padding and max-widths.
- [x] Update `MetricsBar.tsx` to stack vertically or use a horizontal scroll view on mobile.
- [x] Adjust `DashboardToolbar.tsx` with responsive grid/flex (1 or 2 columns on mobile).
- [x] Implement responsive grid for `PlayerHUD` cards (1 col mobile, 4+ col desktop).

### Phase 3: Solver UI (Matrix & Forms)
Target: `HandMatrix`, `HandCell`, `SolveFormFilter`.
- [x] Update `HandMatrix.tsx` to use dynamic sizing (`w-full`) instead of fixed `max-w-3xl`.
- [x] Refactor `HandCell.tsx` with responsive text sizes (`text-[10px] sm:text-xs`).
- [x] Update `SolveFormFilter.tsx` to handle vertical stacking and better spacing on small screens.

### Phase 4: Modal & Form Optimization
Target: `Modal`, `AddPlayerForm`, `AddNoteForm`.
- [x] Ensure `Modal.tsx` is full-width or slide-up on mobile.
- [x] Optimize all forms for mobile input (correct keyboard types, reachable buttons).

## Dependencies
- **Tailwind CSS**: Primary utility for all responsive changes.
- **Lucide React**: For mobile menu icons.

## Risk Assessment
- **Hand Matrix Density**: A 13x13 grid on a 320px screen results in cells < 25px wide. Hand labels (e.g., `JTo`) might become unreadable.
    - *Mitigation*: Dynamically adjust font sizes and possibly hide labels on extreme small screens, relying on tap details.
- **Layout Cumulative Shift (CLS)**: Dynamic scaling might cause shifts as fonts or images load.
    - *Mitigation*: Use strict aspect-ratio containers and skeleton loaders.

## Implementation Order
1. **Layout & Header** (Foundation)
2. **Dashboard Components** (Most used view)
3. **Solver Components** (Complex view)
4. **Modals & Forms** (Interaction polish)
