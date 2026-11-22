# Architecture — @mInspect

## Shape
Modular monolith. Laravel owns all business rules, persistence, permissions and auditing. React is a thin REST client.

## Layers
- `routes/api.php` — REST entry points.
- `app/Http/Requests` — server-side validation.
- `app/Http/Controllers/Api` — orchestration and HTTP responses.
- `app/Models` — Eloquent entities and relationships.
- `app/Services` (later batches) — inventory, pricing and accounting domain logic.
- `database/migrations` — all schema changes.
- `frontend/src` — React SPA with token-based auth, Google callback and noindex gating.
- `frontend/android` — Capacitor Android shell with self-hosted OTA updates.

## Modules (current and planned)
1. Identity and access (current): users, roles, permissions, Google allowlist, audit logs.
2. Catalogue: categories, brands, products, variants.
3. Partners: customers, suppliers.
4. Operations: warehouses, purchases, sales, returns, stock ledger.
5. Accounting foundations: receivables, payables, journals.
6. BI and AI: dashboards, forecasts, Ollama adapter (optional, offline-safe).
7. Automation: rules and alerts.

## Cross-cutting rules
- `auth:sanctum` protects all business endpoints.
- Role checks use `hasRole` / gates; permissions are data-driven.
- Inventory and financial writes run inside `DB::transaction`.
- Every meaningful write creates an `audit_logs` row.
- AI is an optional adapter behind an interface; no core operation depends on it.
- Google sign-in is restricted to an admin-managed email allowlist; `noindex` and `robots.txt` hide the web app from crawlers but are not access control.
- The APK loads the same REST API via `VITE_API_BASE_URL`; OTA bundles come from a configurable self-hosted update endpoint.
