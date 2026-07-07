---
feature: landing-page
status: draft
---

# Requirement: Product Landing Page

## Problem Statement
VillainVault currently lacks a front-facing website that effectively communicates its value proposition to potential users. We need a modern, high-conversion landing page that showcases our specialized poker tools—Gemini-powered AI analysis, OCR note-taking, and GTO Lite strategies—and clearly outlines the pricing structure.

## Goals
- **Hero Section**: High-impact value proposition ("Master Your Opponents").
- **Core Features Section**:
    - **AI Analysis**: Gemini-powered playstyle classification.
    - **OCR Import**: Automatic conversion of HUD/Note screenshots into player data.
    - **GTO Lite**: Tactical strategy guides based on solver output.
- **Pricing Section**:
    - **Free Tier**: Basic player tracking, manual notes.
    - **Pro Tier (Paid)**: Unlimited AI analysis, OCR imports, GTO Lite strategies.
- **Contact Section**: Direct inquiry form for support or partnerships.
- **Dashboard Integration**: A "Premium / Feature Showcase" tab or section within the main dashboard app that allows users to view available features and upgrade paths without leaving the app.
- **Visual Style**: Maintain the premium dark-gold "Casino Royale" aesthetic of the main dashboard.
- **Conversion**: Clear "Get Started" or "Launch Dashboard" calls to action.
- **Redirection**: Root path `/` serves the Landing Page. If authenticated/selected, redirect to `/dashboard`.

## User Stories
- **New Visitor**: "As a poker player, I want to see a clear explanation of how VillainVault's AI helps me exploit my opponents so I can decide if it's worth using."
- **Premium Prospect**: "As a high-volume player, I want to see the pricing tiers and the benefits of the Pro plan (like GTO Lite) so I can upgrade my edge."
- **Mobile Visitor**: "As a user browsing on my phone, I want a responsive landing page that looks professional and allows me to contact support easily."

## Success Criteria
- Page load performance (Core Web Vitals) in the green zone.
- Mobile responsiveness (fully readable and usable on all devices).
- Clear distinction between Free and Pro features.
- Functional contact form submission (simulated or API integrated).

## Constraints
- **Framework**: Next.js (Frontend), Express (Backend if needed for contact form).
- **Styling**: Vanilla CSS or Tailwind CSS (following existing project conventions).
- **SEO**: Meta tags, semantic HTML, and fast TTFB.

## Open Questions
- What is the exact price for the "Pro" tier? (Placeholder: $19.99/mo).
- Do we need a "Login" button on the landing page that redirects to the dashboard? (Yes).
