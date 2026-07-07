---
feature: landing-page
status: draft
---

# Plan: Product Landing Page

## Task Breakdown

### Phase 1: Setup & Navigation
- [ ] Create `LandingLayout` and refactor current `RootLayout` if necessary to separate landing from app.
- [ ] Implement `LandingHeader` with navigation links (Features, Pricing, Contact).
- [ ] Set up the home route `/` for the landing page.

### Phase 2: Content Sections
- [ ] Build the `Hero` section with distinctive "VillainVault" branding.
- [ ] Develop `FeatureSection` (Shared components for AI, OCR, and GTO).
- [ ] Create `PricingSection` with interactive tier comparison.
- [ ] **Dashboard Integration**: Add a "Pro Features" or "Membership" tab in the dashboard that displays the specific Feature/Pricing sections for easier upgrading.

### Phase 3: Conversions & Contact
- [ ] Build the `ContactSection` with form validation.
- [ ] Implement Backend `POST /api/contact` endpoint.
- [ ] Add "Get Started" buttons that link to the main app dashboard.

### Phase 4: Polish & SEO
- [ ] Add animations using Framer Motion (fade-ins, hover effects).
- [ ] Implement SEO metadata (Title, Description, OpenGraph images).
- [ ] Final responsive audit (Mobile/Tablet/Desktop).

## Effort Estimates
- Phase 1: 2h
- Phase 2: 4h
- Phase 3: 2h
- Phase 4: 1h

## Risks
- **Asset Creation**: High-quality imagery for OCR/AI might be hard to generate without specific assets.
    - *Mitigation*: Use stylized abstract graphics or SVG illustrations.
- **Route Conflict**: Ensuring the dashboard `/` doesn't conflict with the landing page `/`.
    - *Plan*: Move dashboard to `/dashboard` or use middleware to handle authentication-based redirection.

## Implementation Order
1. Landing Structure (`/`)
2. Visual Sections (Hero, Features)
3. Pricing & Contact
4. Routing / Redirection Logic
