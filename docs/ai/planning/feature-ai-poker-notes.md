---
description: Detailed Implementation Planning for AI Poker Notes & Hand Analyzer
---

# Feature Planning: AI Poker Notes & Hand Analyzer

## 1. Task Breakdown (Detailed)

### Phase 1: Authentication & Account Management
- [x] **Task 1 - DB Updates**: Migration for `User`, `Session`, `UserUsage`, `Invoice`, `Hand`, `Note`. ✅ Done
- [x] **Task 2 - Session Logic**: ✅ Done
    * `SessionRepository.ts`: CRUD for sessions (upsert, deleteOldest, findByUserId).
    * `SessionService.ts`: 2-device limit enforcement, force-logout flow.
    * `SessionController.ts`: register, force-logout, logout-all, get-sessions.
    * `sessionRoutes.ts`: Wired into `/api/sessions`.
- [x] **Task 3 - Usage Tracker**: ✅ Done
    * `UsageService.ts`: Tier-based limits (daily for Free, monthly for Paid), Enterprise soft-cap.
    * `usageMiddleware.ts`: Reusable quota-checking middleware factory.

### Phase 2: Hand Processing Core (OCR & Parsing)
- [x] **Task 4 - Canonical Hashing**: ✅ Done
    * `handHasher.ts`: Normalize + SHA-256 hash for cache deduplication.
- [x] **Task 5 - Hand OCR (Server-side)**: ✅ Done (Stub)
    * `promptManager.ts`: Vietnamese keyword mapping, Vision/Analysis/Profile prompts.
    * `hand.schema.ts`: Zod schemas for ParsedHand and HandAnalysis.
    * API integration pending (requires OPENAI_API_KEY / ANTHROPIC_API_KEY).
- [x] **Task 6 - Hand Management**: ✅ Done
    * `HandRepository.ts`: Hash-based lookup, paginated history, tag filtering.
    * `HandService.ts`: Full pipeline (hash → cache → OCR → LLM → save).
    * `HandController.ts`: analyze, history, getById endpoints.
    * `handRoutes.ts`: Wired with `checkUsageQuota('AI_ANALYZE')` middleware.

### Phase 3: AI Intelligence & Model Routing
- [x] **Task 7 - LLM Service**: ✅ Done (Stub)
    * `promptManager.ts`: System prompts for hand analysis + player profiling.
- [x] **Task 8 - Model Router**: ✅ Done
    * `promptManager.ts` → `getModelForTier()`: FREE/PRO → gpt-4o-mini, PRO+ → gpt-4o, Enterprise → claude-3-5-sonnet.
- [x] **Task 9 - Player Profile Aggregation**: ✅ Done (Stub)
    * `profileService.ts`: Map-Reduce summarization for large note sets (>50 notes chunked).

### Phase 4: Frontend Implementation (Components)
- [x] Task 10: Build Hand Analyzer Workspace UI (`HandAnalyzer.tsx`)
- [x] Task 11: Implement Result View & Auto-Note Logic (Integrated into Workspace)
- [x] Task 12: Implement Hand History list & Search UI (`HandHistoryList.tsx`)
- [x] Task 13: Implement Pricing & Payments UI (`/pricing/page.tsx`)
- [x] Task 14: Final Backend Refinements & Mocking
- [ ] Task 15: Post-Launch: Replace Mocks with Real API Keys

### Phase 5: NOWPayments Webhook & Monetization
- [x] **Task 14 - Webhook Worker**: ✅ Done
    * `PaymentController.ts`: HMAC SHA-512 verification, idempotent tier upgrade via $transaction.
    * `paymentRoutes.ts`: `/api/payments/create-invoice` + `/api/payments/webhook`.

## 2. Dependencies
*   Existing solver logic (internal context usage).
*   NEXT_PUBLIC_APP_URL for NOWPayments webhooks.
*   API Keys: OpenAI/Claude (Vision), NOWPayments (Secret).

## 3. Implementation Order (Recommended)
1.  ~~**Auth/Sessions/Usage** (Foundation).~~ ✅
2.  ~~**Hand Parsing/OCR/Cache** (Core Tool).~~ ✅
3.  ~~**Analysis/Routing** (Intelligence).~~ ✅
4.  **UI Analyzer/History** (UX). ← NEXT
5.  ~~**Payments/Tiers** (Monetization).~~ ✅

## 4. Risks & Mitigations
*   **High Token Costs**: Mitigation: STRICT hashing/caching. ✅ Implemented.
*   **OCR Accuracy**: Mitigation: User-editable preview before analysis.
*   **Webhook Spoofing**: Mitigation: Strict HMAC verification. ✅ Implemented.
