---
feature: ui-responsiveness
status: draft
---

# Testing Plan: UI Responsiveness & Mobile Optimization

## Responsive Breakpoints
- **Mobile (Small)**: 320px (iPhone SE)
- **Mobile (Large)**: 414px (iPhone 13 Pro Max)
- **Tablet**: 768px (iPad Mini)
- **Laptop**: 1024px
- **Desktop**: 1280px+

## Test Cases

### 1. Dashboard Responsiveness
- [ ] **Player Grid**: Verify 1 column on mobile, 4 columns on desktop.
- [ ] **Metrics Bar**: Ensure no horizontal overflow; verify stacking or wrapping.
- [ ] **Toolbar**: Check that search input and filters remain usable on small screens.

### 2. Solver Responsiveness
- [ ] **Hand Matrix**: Verify it scales down to fits the screen width on 320px. Check text legibility of labels.
- [ ] **Solve Form**: Check vertical stacking of select inputs. Ensure "Run Solve" button is easily clickable.

### 3. Navigation & Modals
- [ ] **Header**: Verify mobile menu/hamburger appearance and functionality.
- [ ] **Modals**: Ensure modals are usable and don't overflow the viewport on small screens.

## Visual Regression Check
- Compare layouts across Chrome DevTools responsive presets (Mobile S, Mobile M, Mobile L, Tablet).
- Check for Cumulative Layout Shift (CLS) on resize.
