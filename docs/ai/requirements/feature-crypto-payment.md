---
feature: crypto-payment
status: draft
---

# Requirement: Crypto Payment Gateway Integration

## Problem Statement
Currently, VillainVault's payment system is a placeholder with "NOWPayments integration pending". Users cannot actually pay for premium subscriptions using cryptocurrency. We need to fully integrate a reliable crypto payment gateway (NOWPayments) to allow users to upgrade to PRO, PRO_PLUS, and ENTERPRISE tiers.

## Goals
- **Full NOWPayments Integration**: Complete the `createInvoice` logic using backend-validated plans.
- **Payment State Machine**: Implement a robust state machine: `pending → confirming → finished → failed → expired`.
- **Secure Webhook Handling**: 
    - Verify signature using **raw request body** and HMAC SHA-512.
    - **Idempotency & State Guards**: 
        - Use **forward-only state transitions** (`new_state > current_state`). 
        - Duplicate webhooks with the same status are ignored.
        - Add `is_upgraded` flag to prevent double-subscription extend.
    - **Strict Validation**: `actually_paid_usd >= price_amount * 0.98` and `currency == expected_currency`.
    - **Race Condition Handling**: Retry lookup 3 times (500ms, 1s, 2s). Return 200 OK even if exhausted.
- **Status Mapping** (NOWPayments → VillainVault):
    - `waiting` → `pending`
    - `confirming`, `confirmed` → `confirming`
    - `finished` → `finished`
    - `partially_paid` → `manual_review`
- **Plan Resilience**: Calculate subscription expiry: `max(current_expiry, now) + duration`.
- **Ownership & Security**: Status endpoint (`GET /api/payments/:id/status`) **must** verify `invoice.user_id == current_user.id`.
- **Rate Limiting**: `/webhook` (10 req/s), `/create-invoice` (5 req/min/user).
- **UX Clarity**: Display a notice: "Network fees may apply depending on your wallet" to prevent user drop-off due to price differences.
- **Frontend Integration**: Display a "Pay with Crypto" option and provide a real-time status check endpoint (`GET /api/payments/:id/status`).
- **Transaction Logging**: Maintain a detailed `payment_events` log including `signature_valid`, `event_type`, and `processed` flags.

## User Stories
- **Premium Prospect**: "As a poker player who values privacy, I want to pay for a VillainVault subscription using BTC or USDT so I don't have to share my credit card details."
- **Upgrading User**: "As a free user, I want to click 'Upgrade', select a plan, and be immediately presented with a crypto payment address or link."
- **Admin**: "As an admin, I want to see which users have paid via crypto and the status of their invoices in the admin dashboard."

## Success Criteria
- User can select a plan and receives a valid NOWPayments invoice URL.
- User account is upgraded **only** when status is `finished` and amount is validated.
- Webhook handle race conditions (retry if invoice not found).
- Partial payments do not trigger upgrades and are marked for manual review.
- Overpayments are accepted but excess is noted/ignored.

## Constraints
- **Gateway**: NOWPayments API.
- **Backend**: Node.js / Express / Prisma.
- **Security**: Must verify `x-nowpayments-sig` using HMAC SHA-512.
- **Idempotency**: Webhook must handle duplicate notifications safely.

## Open Questions
- Do we need to support multiple currencies on our side, or does NOWPayments handle the conversion from USD? (NOWPayments handles conversion if we specify price in USD).
- Should we provide a "Payment Pending" UI state while waiting for blockchain confirmations?
- What happens if a user pays a different amount than requested? (NOWPayments usually handles this with partial payments or overpayments, we need to decide how to handle their status).
