---
description: Detailed Testing Strategy for AI Poker Notes & Hand Analyzer
---

# Feature Testing: AI Poker Notes & Hand Analyzer

## 1. Unit Testing (Backend Logic)

### Hand Deduplication
*   **Test**: Input same action history with different names/times.
*   **Expect**: `generateHandHash()` returns SAME hash.
*   **Test**: Input two hands with different chips/bets.
*   **Expect**: `generateHandHash()` returns DIFFERENT hashes.

### Session Enforcement
*   **Test**: User has 2 sessions already. Try to login from 3rd device.
*   **Expect**: Return 403 Forbidden with prompt to logout others.
*   **Test**: User calls `logout-all`.
*   **Expect**: All sessions for that `userId` are deleted from DB.

### Usage Quotas
*   **Test**: `FREE` user makes 3rd AI Analyze call.
*   **Expect**: Error 429 Too Many Requests. Reset date should be in response.

## 2. Integration Testing (API & Workflows)

### OCR to Analysis Flow
*   **Test**: Mock `HandOcrService` to return valid Hand JSON.
*   **Expect**: API `/api/analysis/hand` saves Hand record, returns AI insights, and increments `UserUsage`.

### NOWPayments Webhook (Critical)
*   **Test**: Send valid webhook with `status: finished`.
*   **Expect**: `User.premium_tier` becomes `PRO` (or requested tier).
*   **Test**: Send SAME valid webhook again.
*   **Expect**: No duplicate credits/days added (Idempotency check).
*   **Test**: Send invalid signature.
*   **Expect**: Return 401 Unauthorized.

## 3. Frontend Testing (UI/UX)

### Hand Analyzer UI
*   **Test**: Paste hand text into `UploadZone`.
*   **Expect**: Immediate visual preview of hand actions.
*   **Test**: Click "Deep Analyze" on Pro+ account.
*   **Expect**: High-quality insights (Mocked) showing Villain mistakes.
*   **Test**: Click "Save Note" on Villain mistake.
*   **Expect**: New Note appears in `PlayerDetails` view without page refresh.

### Payment Display
*   **Test**: Login as Free user.
*   **Expect**: Pricing page shows "Current" on Free tier.
*   **Test**: Login as Pro user.
*   **Expect**: Pricing page shows "Current" on Pro, "Upgrade" on Pro+.

## 4. Manual Verification List
- [ ] OCR Name Extraction accurately identifies name in screenshot.
- [ ] OCR Hand Extraction correctly maps folds, calls, raises.
- [ ] AI Insights correctly identify a blatant "mistake" (e.g., folding nuts).
- [ ] Force Logout clears session from local storage and backend.
- [ ] Same-hand upload returns response in < 500ms (Cache hit).
