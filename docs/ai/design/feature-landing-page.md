---
feature: landing-page
status: draft
---

# Design: Product Landing Page

## Architecture Changes
- **New Route**: `/` hosts the Landing Page. `/dashboard` hosts the main application.
- **Redirection Logic**: Middleware or client-side check to redirect logged-in users to `/dashboard` if they land on `/` (optional).
- **Layouts**: 
    - `LandingLayout`: Minimalist, scroll-focused, high visibility for marketing.
    - `DashboardLayout`: Data-rich, utility-focused, sidebar-driven.
- **Integrated Sections**: Create a `FeaturePromo` component that can be used both as a landing page section and as a "What's New / Pro" tab within the `/dashboard` app.

## UI Design Decisions

### 1. Aesthetic Direction
- Heavy use of **glassmorphism**, **gradients (Gold/Black)**, and **subtle glows**.
- Typography: Inter or Outfit for modern readability.
- Animations: Framer Motion for scroll-reveals and hover effects.

### 2. OCR Feature Visualization
- Use a split-screen or overlay animation showing a screenshot of a poker table being "read" and converted into the VillainVault UI.

### 3. Pricing Tier Logic
| Feature | Basic (Free) | Pro (Premium) |
|---------|--------------|---------------|
| Manual Notes | Unlimited | Unlimited |
| Playstyle Tags | Manual Only | AI Automated |
| Stats Tracking | Basic | Advanced |
| AI Analysis | Limited (3/day) | Unlimited |
| OCR Import | No | Yes |
| GTO Lite | No | Yes |

## Components & Interfaces

### `LandingPage.tsx`
The main entry point using a vertical scroll structure:
1. `Navbar` (Sticky, transparent to solid on scroll)
2. `Hero` (CTA + Image)
3. `TrustBar` (Platforms supported)
4. `Features` (OCR / AI / GTO)
5. `Pricing` (Tier comparison)
6. `Contact` (Simple form)
7. `Footer`

### API Endpoint (Backend)
`POST /api/contact`
- Body: `{ name, email, subject, message }`
- Logic: Log to DB or send via email service.

## Performance Considerations
- **Image Optimization**: Use Next.js `next/image` for all assets.
- **Bundle Size**: Lazy load the GTO Lite visualizer or complex animations.
- **Font-Display**: Use `swap` to prevent invisible text during load.
