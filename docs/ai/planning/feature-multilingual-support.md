---
title: Multilingual Support Planning
status: draft
feature: multilingual-support
---

# Feature: Multilingual Support - Planning

## Tasks Breakdown

### Phase 1: Backend Data & API
- [x] **Task 1: Extend User Schema**: Add an Enum or String field `language` (default: "en") to the User model in Prisma/DB and generate the migration.
- [x] **Task 2: Settings API Endpoint**: Update or create `PATCH /api/users/profile` route to persist the language choice. Include validation for `en` and `vi`.
- [x] **Task 3: AI Injection Middleware**: Ensure that OCR/Strategy analysis APIs accept a `language` parameter and correctly route it to the external AI client (e.g., adding "Respond strictly in {language}, keep poker terms in English").

### Phase 2: Frontend Localization Foundation
- [x] **Task 4: i18n Initialization**: Set up a lightweight React Context system using `en.json` and `vi.json` files for translation dictionaries.
- [x] **Task 5: Language Preference Hook**: Build a hook that checks `localStorage` first, overrides with fetched profile data on login, and provides the current language and a setter to the app.

### Phase 3: Frontend Feature Delivery
- [x] **Task 6: UI Component (Language Selector)**: Build or update the language dropdown in the Settings panel (showing flags + languages).
- [x] **Task 7: Translate Platform Elements**: Implement the custom `t('key')` wrapper across major UI text nodes: Navigation, Buttons, Hand History labels. Map backend error codes to localized strings.
- [x] **Task 8: Handle AI Responses**: Confirm that AI results correctly handle Vietnamese characters and retain English poker terminologies.

### Phase 4: Validation & Edge Cases
- [ ] **Task 9: Final Testing**: Complete end-to-end user flows for language changes via Settings and login. Test AI prompting accuracy.

## Dependencies & sequence
- **Phase 1** does not block **Phase 2**, so backend APIs and frontend setup can be executed mostly in parallel.
- **Phase 3** depends entirely on the translations setup from **Phase 2**.
- **Phase 4** is the final check and depends on all upstream phases executing cleanly.

## Estimate & Effort
- Backend + Provider: High confidence, relatively small logic shift. Data schema requires care. (~ 1-2 hours)
- Frontend i18n Integration: Labor intensive due to string externalization across many source files. (~ 3-5 hours depending on app size)
- Total Effort Estimate: ~1 day.
