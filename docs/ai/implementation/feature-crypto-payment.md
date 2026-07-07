---
feature: crypto-payment
status: draft
---

# Implementation: Crypto Payment Gateway Integration

## Implementation Log

### [2026-03-22] - Initial Requirements & Design
- Created Requirements/Design/Planning docs for the Crypto Payment Gateway feature.
- Analyzed existing `PaymentController.ts` and identified the missing NOWPayments integration points.
- Planned `NowPaymentsService.ts` for encapsulation.

### [2026-03-22] - Backend & Frontend Implementation
- Implemented `RawBodyMiddleware.ts` for capturing raw bytes for signature verification.
- Created `NowPaymentsService.ts` with exponential backoff API client.
- Implemented `PaymentService.ts` with forward-only state machine, amount validation, and idempotency guards.
- Rewrote `PaymentController.ts` to coordinate between services and handle ownership checks.
- Set up `InvoiceExpiryWorker.ts` for background stale invoice cleanup.
- Refactored `paymentRoutes.ts` with per-user rate limiting and webhook security.
- Updated Prisma schema and synchronized database via `db push`.
- Built real-time Status Page in Frontend with auto-polling.
- Verified everything with comprehensive unit tests for signature logic and state machine.

