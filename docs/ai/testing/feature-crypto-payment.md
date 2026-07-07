---
feature: crypto-payment
status: draft
---

# Testing: Crypto Payment Gateway Integration

## Test Cases

### 1. Invoice Creation & Security
- [ ] User creates invoice with invalid plan tier (Error).
- [ ] Backend fetched plan pricing (Verify vs static frontend values).
- [ ] Rate limit check on redundant creation requests.

### 2. Webhook Security (Critical)
- [ ] **Raw Body Signature Test**: Send modified JSON payload vs original raw bytes (Expected: Reject).
- [ ] Webhook IP block verification (optional check).

### 3. State Machine & Validation
- [ ] **Valid Payment**: `Confirming → Finished`. Verify User upgrade.
- [ ] **Amount Mismatch**: User pays less than `price_amount`. Verify status becomes `MANUAL_REVIEW`, no upgrade.
- [ ] **Overpayment**: User pays more. Verify status becomes `FINISHED`, upgrade granted.
- [ ] **Currency Mismatch**: Webhook reports ETH instead of requested USDT. Verify rejection/manual status.

### 4. Idempotency & Race Conditions
- [ ] **Double Webhook**: Send same `payment_id` payload twice. Verify single upgrade.
- [ ] **Race Condition Simulation**: Trigger webhook while the DB record for the invoice is locked/delayed. 
- [ ] Verify exponential backoff in `NowPaymentsService` during API downtime.

### 5. Status Endpoint
- [ ] `GET /api/status` returns correct state during polling (Pending → Finished).
