# Shipora — production readiness pass

Everything that worked before still works the same way. Routes, pages, styling and database
tables are unchanged, except where something was broken. Review all changes with `git diff`.

## How it was verified

- **Backend:** 35 end-to-end API tests run against a real PostgreSQL 16 and Redis 7, with
  Paystack and QoreID mocked. They cover sign-up, email verification, login, refresh, logout,
  KYC for all three roles, admin approvals, top-ups, wallet payment, the whole delivery
  lifecycle, ratings, notifications, cancellation refunds, disputes (both entry points),
  invitations, customer checkout, withdrawals, transfer webhooks, the auto-release sweep,
  concurrent withdrawals, Redis outage, rate limiting and readiness checks.
- **Upgrade path:** the new startup was run on a database created by the old code. It upgraded
  it cleanly. Two workers starting at the same time on a fresh database also both came up fine.
- **Frontend:** `eslint .` passes with 0 errors (it had 40 problems before, including 4
  syntax errors). The whole app bundles with 0 errors. A 19-step browser test (Chromium)
  passed against the real backend, with no page errors:
  sign-up → resend verification → verify email → login → vendor KYC → wallet → silent
  token refresh → logout → admin KYC → admin disputes → password reset → payment result.
- **Not verified here:** `vite build` itself. The package registry is blocked in this
  environment, so I couldn't install Vite's Linux build tool. Run `npm ci && npm run build`
  once on your machine.

## Critical bugs fixed

| Area | Bug | Fix |
|---|---|---|
| Auth | After verifying their email, users were still rejected with "account not verified" on every protected endpoint, including role verification. | The check now accepts `account_verified` (email) or `verified` (admin/Google). |
| Admin | The admin has no phone number, so `/auth/current_user`, every admin endpoint and `/profile/me` crashed with 500. | `phone` is optional in the response schemas. |
| Vendor KYC | `date_of_birth` was sent as text to a DATE column, so the request failed with 500. | Converted to a date. |
| Dispatcher KYC | Choosing "No" to driving still demanded a licence. The missing `service_area` caused a NOT NULL failure, and blank licences/CACs clashed on unique indexes. | `is_driver` is parsed properly, `service_area` defaults to the city, blanks are stored as NULL. |
| Both-roles KYC | Booleans went into text columns, a CAC lookup crashed, and the frontend posted to `/both/verify` (404). | Fixed. `/both` is kept as an alias of `/bothroles`. |
| Database session | `expire_on_commit=True` caused "MissingGreenlet" 500s right after saving (mark notification read, accept application, admin actions…). | `expire_on_commit=False`. |
| Top-up | The frontend sent kobo and the API multiplied by 100 again, so ₦1,000 was charged as ₦100,000. | The frontend sends naira. |
| Top-up return | Paystack sent users to `/wallet`, which doesn't exist, and the payment-result page always showed "success" without checking. | Users now return to `/payment-result`, which verifies the payment. New endpoint: `GET /wallet/topup/verify/{reference}`. |
| Refunds | Cancelling or refunding called Paystack's refund API for wallet-paid shipments. Paystack never processed that money, so it failed with 500, and card payments would have been refunded twice. | Refunds go back to the Shipora wallet, as the ledger design intended. |
| Customer checkout | The page was a mock and confirmation was never wired up. Retrying after abandoning checkout was blocked forever. Vendors were debited for money their customer paid. | The page is wired to the API, webhook and verify endpoint confirm payment, there's a new reference per attempt, and a `customer_payment` credit offsets the hold. |
| Disputes | The dispute service compared user IDs with profile IDs, so nobody could open a dispute, names were blank and "my disputes" was empty. Disputes raised from the shipment page never reached the admin screen. | Fixed. Both entry points create a dispute record, and admin resolution keeps them in sync. |
| Dispatcher applications | The page called 3 endpoints that didn't exist, through a broken fetch helper. | Added `GET /shipments/applications/mine`, `POST …/accept-invitation` and `POST …/decline-invitation`. |
| Production URLs | Verify pages, admin disputes, tracking and disputes used `VITE_API_BASE_URL`, which falls back to localhost or `/api/v1` in production. Email links pointed to `localhost:5173` and `127.0.0.1:8000`. | One `src/config.js` for the frontend. All links use `PUBLIC_BASE_URL`. |
| Logout | There was no logout endpoint, and the frontend can't clear httpOnly cookies, so "Log out" didn't sign you out. | `POST /auth/logout`, wired into Settings. |
| Token refresh | The refresh logic skipped 401s and the other interceptor redirected first, so everyone was kicked out after 1 hour. | One interceptor handles refresh and retry for axios and `fetch`, then redirects only if refresh fails. |
| Google login | Supabase OAuth never created a backend session, and the backend callback crashed creating the user. | The buttons use the backend OAuth flow, which is fixed. |
| Password reset | The reset page was a mock, tokens never expired and could be reused. | The page is wired up. Links expire after 60 minutes, work once, and sign out other sessions. |
| Shipment links | `/shipment/:id` didn't exist. | Added a route: a UUID shows shipment details, a public token shows checkout. |
| Startup schema sync | One failing statement aborted every statement after it. On a fresh database, nothing was applied. | Tables are created first, each statement gets its own savepoint, and an advisory lock covers multi-worker starts. |
| Auto-release | Released at most one shipment every 15 minutes, and every instance ran the sweep. | Locks each row and releases all due shipments, with one runner across instances. |

## Production hardening (redundancy)

- **Database:** configurable pool with pre-ping and recycle, SQL echo off. Row locks on every
  shipment state change and per-user wallet locks, so there's no double-accept, double-release
  or overdraw. Withdrawals reserve the money before calling Paystack.
- **Redis:** `REDIS_URL` support for managed/TLS Redis, timeouts and retries. If Redis is down,
  users stay signed in from the signed JWT (`REDIS_FAIL_OPEN=true`).
- **Paystack:** errors become a clean 502 with Paystack's message, and read-only calls are
  retried. The bank list is cached for 24 hours. Webhooks handle top-ups, customer payments and
  transfer success/failed/reversed, are idempotent, and never trigger retry storms.
- **Email:** retries, never crashes a request, escapes user-supplied names, and the subject no
  longer says "Housify".
- **Security:** QoreID secrets removed from source code. Rate limits on login, admin login,
  sign-up, password reset and resend. Constant-time admin credential check. Unverified emails
  can't sign in, with a "resend" link on the login page. Case-insensitive email login. No
  account probing on reset or resend. Token contents are no longer leaked in error messages.
- **Errors:** every error is JSON with a `detail` and carries CORS headers, so the browser
  shows the real error instead of a "CORS error". IntegrityError → 409, database down → 503.
  Logs go to stdout.
- **Health:** `/health` (liveness) and `/health/ready` (checks the database and Redis).
- **Uploads:** R2 calls no longer block the event loop, filenames are sanitized, and shipment
  photos/videos upload to R2 instead of being stored as base64 in the database (falls back if
  R2 isn't set up).
- **Requirements:** pinned to the versions you develop with. `Procfile` added. `vercel.json`
  added so deep links, email links and Paystack redirects don't return 404 on Vercel.

## Deploy checklist

**Backend (Render):**

1. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips="*" --workers 2`
2. Set `PUBLIC_BASE_URL=https://shipora-one.vercel.app` (your frontend URL).
3. **Set `KYC_CLIENT_ID` and `KYC_CLIENT_SECRET`.** These were hard-coded and committed to git,
   so rotate them in the QoreID dashboard. Without them, KYC goes to admin review instead of
   auto-verifying.
4. If your Redis needs a password or TLS, set `REDIS_URL`.
5. Paystack dashboard → Webhook URL: `https://<api>/api/v1.0/shipments/paystack/webhook`
6. Google Cloud Console → Authorized redirect URI: `https://<api>/api/v1.0/auth/google`
   (or set `GOOGLE_REDIRECT_URI`).
7. Health check path: `/health/ready`

**Frontend (Vercel):**

1. `VITE_API_URL=https://<api>/api/v1.0`
2. Optional, recommended for iPhone users: Safari blocks cross-site cookies, which breaks login
   when the frontend and API are on different domains. To make cookies first-party, add this
   rewrite to `vercel.json` and set `VITE_API_URL=/api/v1.0` and
   `GOOGLE_REDIRECT_URI=https://shipora-one.vercel.app/api/v1.0/auth/google`:

   ```json
   { "source": "/api/v1.0/:path*", "destination": "https://<api>/api/v1.0/:path*" }
   ```

   Put it before the catch-all rewrite.

## Notes

- Refunds (cancellations and disputes) credit the vendor's Shipora wallet, and the vendor can
  withdraw to their bank. For customer-paid shipments, the vendor settles with their customer.
- One active session per account is unchanged: signing in on a second device signs out the first.
- The Alembic migration history was already inconsistent (two migrations make the same change),
  so the schema is managed by the startup sync. I left the Alembic files untouched.
- `__pycache__` files and `shipora-backend/.env` / `errors.log` aren't in this package. Keep your
  own `.env`. The `__pycache__` files were tracked in git, so they'll show as deleted in
  `git status`, which is fine.
