# Phase Progress

## Phase 1 - Critical Security

Status: completed

- Fixed metrics IP whitelist comparison and `x-forwarded-for` parsing.
- Removed the global API key from error webhook payloads.
- Stopped returning the raw Facebook user token from `/verify-creds`.
- Added secure password hashing for new users with legacy plain-text password migration on successful login.
- Added production startup validation for insecure API keys.
- Hardened the auth cookie with `sameSite: 'lax'` and an explicit root path.
- Added focused `UserService` tests for password hashing, login, migration, and validation.

Verification:

- `npx tsc --noEmit`
- `npm run lint:check`
- `npm test`

## Phase 2 - Multi-Tenant Data Isolation

Status: completed

- Fixed lead routes/controllers to use the Prisma instance `id` attached by the instance guard.
- Added a contact ownership check before creating leads, preventing cross-instance contact references.
- Added defensive order status validation in the service layer.
- Tightened the order status route schema to the known enum values.
- Added focused `LeadService` and `OrderService` tests for instance-scoped reads/writes and invalid statuses.

Verification:

- `npx tsc --noEmit`
- `npm run lint:check`
- `npm test`

## Phase 3 - Database Provider Consistency

Status: completed

- Documented that PostgreSQL is the supported provider for the full application surface.
- Documented that MySQL is currently partial and lacks users, store, leads, products, orders, and related enums.
- Added a Prisma provider preflight guard in `runWithProvider.js` to block MySQL `generate`, `migrate`, and `studio` commands unless explicitly bypassed for schema maintenance.
- Added a provider support test that verifies PostgreSQL contains the full app schema and records MySQL's current partial status.

Verification:

- `npx tsc --noEmit`
- `npm run lint:check`
- `npm test`

## Phase 4 - API Validation And Error Flow

Status: completed

- Removed `LeadRouter` try/catch blocks that converted every exception into an ad hoc 400 response.
- Let `express-async-errors` and the global exception middleware format lead route errors consistently.
- Tightened lead schemas with minimum string lengths, non-negative numeric values, and `additionalProperties: false`.
- Added `RouterBroker` tests for body validation, executor inputs, instance-create normalization, and invalid lead payloads.

Verification:

- `npx tsc --noEmit`
- `npm run lint:check`
- `npm test`

## Phase 5 - Operational Hardening

Status: completed

- Moved CORS origin decisions into a tested helper.
- Disallowed wildcard CORS origins in production unless an origin is explicitly configured.
- Kept local development origins convenient outside production.
- Made JSON and URL-encoded request body limits configurable while preserving the previous `136mb` default.
- Added a `/health` endpoint that reports version, database provider, uptime, and security status without exposing secrets.
- Added focused tests for CORS, body limits, and health payload construction.

Verification:

- `npx tsc --noEmit`
- `npm run lint:check`
- `npm test`

## Phase 6 - Observability And Metrics Hardening

Status: completed

- Extracted Prometheus rendering, label escaping, metrics IP parsing, IP allow checks, and Basic Auth verification into `src/utils/metrics.ts`.
- Reduced metrics route code to middleware wiring and response rendering.
- Added timing-safe credential comparison for metrics Basic Auth.
- Added tests for IP normalization, IP allow decisions, Basic Auth failures, label escaping, and rendered Prometheus output.

Verification:

- `npx tsc --noEmit`
- `npm run lint:check`
- `npm test`

## Next Phase - Type Safety And DTO Cleanup

Status: pending

- Reduce `any` in newly touched controllers/services.
- Add focused request/user typing where it removes repeated casts.
- Keep TypeScript strictness improvements incremental.
