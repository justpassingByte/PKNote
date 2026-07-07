---
feature: crypto-payment
status: draft
---

# Design: Crypto Payment Gateway Integration

## Architecture Changes
- **Backend Service**: `NowPaymentsService.ts` handles API calls with **exponential backoff**.
- **Payment State Machine**:
    - `waiting (pending)` → `confirming/confirmed (confirming)` → `finished (finished)`.
    - **Forward-Only**: `if (new_state <= current_state) ignore`.
    - **Only** `finished` triggers upgrade IF `is_upgraded === false`.
- **Amount Validation**:
    - **Rule**: `actually_paid_usd >= price_amount * 0.98` AND `currency == expected_currency`.
    - Mismatches/partials set to `MANUAL_REVIEW`.
- **Ownership**: `GET /api/status` MUST check `user_id` ownership.

## Data Models
### Invoice (Updated)
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key)
- `status`: Enum (PENDING, CONFIRMING, FINISHED, FAILED, EXPIRED, MANUAL_REVIEW)
- `payment_id`: String (Nullable, UNIQUE)
- `price_amount`: Decimal (The price expected in USD)
- `actually_paid`: Decimal (Total USD equivalent from NOWPayments)
- `is_upgraded`: Boolean (False by default) - Double-safety guard.
- `last_webhook_at`: Timestamp - For monitoring.
- `created_at`: Timestamp
- `updated_at`: Timestamp

### PaymentEvent
- `event_type`: Webhook, State Transition, Error.
- `payload`: Masked JSON.
- `signature_valid`, `processed`.

## API / Interfaces
### Status Mapping
- `waiting` → `PENDING`
- `confirming`, `confirmed` → `CONFIRMING`
- `finished` → `FINISHED`
- `partially_paid` → `MANUAL_REVIEW`

### Frontend Components
- `PricingSection.tsx`: 
    - Add "Pay with Crypto" button.
    - **UX Notice**: Display "Network fees may apply depending on your wallet" for crypto payments.
- `PaymentRedirect.tsx`: Shows "Redirecting to payment gateway..." then opens NOWPayments.

## Design Decisions
- **Gateway**: **NOWPayments** (Backend config used for plans).
- **Pricing Strategy**: **User pays fees**. Backend sets price in USD, NOWPayments handles crypto calculation + fees on top. 
- **Security**: Raw body signature verification + Rate limiting.
- **Resilience**: Webhook retry logic if invoice is not immediately found (race condition).

## Security & Performance Considerations
- **Signature Verification**: Mandatory for the webhook to prevent spoofing.
- **Idempotency**: Webhook logic must check if the invoice is already processed to avoid extending subscriptions multiple times.
- **External API Resilience**: Use `axios` with timeouts and retries for communicating with NOWPayments.
- **Logging**: Log all incoming webhook payloads (masked if sensitive) for debugging failed transactions.

## Open Questions
- Should we use the NOWPayments Sandbox for testing? (Yes, if available).
- Do we need to handle "partially_paid" status? (For now, only "finished" unlocks the tier).
