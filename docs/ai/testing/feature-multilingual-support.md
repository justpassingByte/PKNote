---
title: Multilingual Support Testing
status: draft
feature: multilingual-support
---

# Feature: Multilingual Support - Testing

## Test Scenarios

### T1: Select language (Guest)
- Pre-condition: User unauthenticated.
- Steps: Access settings, switch to Vietnamese. Context checks `localStorage`.
- Expected: UI directly renders in Vietnamese. Reloading page retains `.vi` language.

### T2: Select language (Authenticated)
- Pre-condition: User logs in, English active.
- Steps: Go to Settings -> switch to Vietnamese.
- Expected: Network call sent (`PATCH /user/settings`, `{"language":"vi"}`). User reloads browser -> backend returns profile preference -> UI continues rendering `.vi`.

### T3: Run AI Hand Check (English vs Vietnamese)
- Pre-condition: Provide a test hand history image or text.
- Steps:
    1. With English selected, request analysis. Output MUST be English.
    2. With Vietnamese selected, request analysis. Output MUST be Vietnamese.
- Expected: Translations perfectly match localized request inputs via prompted injection.

### T4: Fallbacks
- Pre-condition: Have a missing translation key in Vietnamese.
- Steps: Render the corresponding UI view.
- Expected: Standard english string provided instead of a blank span or `[missing.key]`.

### Regression
- Verify Poker terminology is strictly upheld within AI prompts; verify that `AQo`, `XR` and table positions don't become warped inside vietnamese phrasing by the LLM. 
