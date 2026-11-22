# API Documentation — @mInspect

Base URL: `/api` (override in the APK with `VITE_API_BASE_URL`).

## Public

### POST /register
Body: `name`, `email`, `password`, `password_confirmation`, `phone?`.
Returns `201` with `user` (including roles/permissions) and `token`.

### POST /login
Body: `email`, `password`.
Returns `200` with `user` and `token`; `401` for invalid credentials; `403` for inactive accounts.

### GET /auth/google/redirect
Redirects the browser to Google's OAuth consent screen.

### GET /auth/google/callback
Handles Google's callback. Only emails present and active in `allowed_google_accounts` are accepted.
On success, creates/links the user, issues a Sanctum token and redirects to `${FRONTEND_URL}/auth/google/callback?token=...`.
On failure, redirects to `${FRONTEND_URL}/login?error=...`. The token is never logged.

## Authenticated (header `Authorization: Bearer <token>`)

### GET /me
Returns the current user with roles and permissions.

### POST /logout
Deletes the current token. Returns `200`.

### Admin — Google allowlist
Requires the `admin` role.

- `GET /admin/allowed-google-accounts` — list approved accounts.
- `POST /admin/allowed-google-accounts` — body `email`, `name?`; creates an active allowlist entry.
- `PATCH /admin/allowed-google-accounts/{id}` — body `name?`, `active?`; updates an entry.
- `DELETE /admin/allowed-google-accounts/{id}` — removes an entry.

All allowlist writes create an `audit_logs` row.

## Web hiding
- All web responses send `X-Robots-Tag: noindex, nofollow, noarchive`.
- `index.html` sends `<meta name="robots" content="noindex, nofollow, noarchive">`.
- `GET /robots.txt` disallows all crawlers.
- The SPA is still gated behind login; hiding is not a security boundary.

## Error format
Validation: `{ "message": "...", "errors": { "field": ["message"] } }` with status `422`.
Authentication/authorization failure: `{ "message": "..." }` with `401` or `403`.

## Planned endpoints
`/products`, `/variants`, `/customers`, `/suppliers`, `/purchases`, `/sales`, `/returns`, `/stock/movements`, `/stock/adjustments`, `/reports/*`. All will be REST, validated, audited and permission-guarded.
