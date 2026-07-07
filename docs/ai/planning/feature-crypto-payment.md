---
feature: crypto-payment
status: draft
---

# Plan: Crypto Payment Gateway Integration

## Task Breakdown

### Phase 1: Backend Infrastructure & Security
- [x] Implement `RawBodyMiddleware.ts` (Capture `req.rawBody` for hmac).
- [x] Update Prisma schema:
    - `Invoice`: Add `payment_id` (unique), `is_upgraded` (bool), `last_webhook_at`.
    - `PaymentEvent`: Full fields.
- [x] Create `NowPaymentsService.ts` with exponential backoff API client.
- [x] Implement **Rate Limiting**: `/webhook` (10/s), `/create-invoice` (5/min/user).

### Phase 2: Webhook & State Machine
- [x] Implement **Forward-Only State Logic**: `if transition is backward → ignore`.
- [x] **Strict USD Validation**: Compare `actually_paid_usd` (from IPN) vs `price_amount * 0.98`.
- [x] **Upgrade Guard**: Execute upgrade ONLY if `status === FINISHED` AND `is_upgraded === false`.
- [x] **Race Condition Retry**: Implement 3-retry lookup (500ms, 1s, 2s).
- [x] Map NOWPayments statuses: `waiting`, `confirming`, `confirmed`, `finished`, `partially_paid`.
- [x] Setup background task (pseudo-cron or worker) to mark invoices as `EXPIRED` after 60m.

### Phase 3: Status API & Frontend
- [x] Implement `GET /api/payments/:id/status` with **User ID Ownership check**.
- [x] Update UI: Show "Waiting blockchain confirmations" during `CONFIRMING` state.

### Phase 4: Integration Testing & Audit
- [x] Test with **raw body signature verification** using `curl --raw`.
- [x] Simulated race condition test (Webhook arriving before DB commit).
- [x] Final security audit: check logs for sensitive data masking.

## Effort Estimates
- Phase 1: 2h
- Phase 2: 2h
- Phase 3: 2h
- Phase 4: 1h

## Risks
- **API Connectivity**: Network issues or API downtime.
    - *Mitigation*: Implement retries and decent timeouts for the client.
- **Webhook Spoofing**: Attackers trying to upgrade accounts.
    - *Mitigation*: Mandatory signature verification and idempotency checks.
- **Price Mismatch**: User pays less than required.
    - *Plan*: NOWPayments handles this with `partially_paid`, we should decide if we grant access only on `finished`.

## Implementation Order
1. Backend Service (`NowPaymentsService`)
2. `create-invoice` controller call
3. Webhook handler with signature verification
4. Frontend "Pay with Crypto" button and redirect
5. E2E Testing
