# Implementation Roadmap — @mInspect

## Phase 1 — Foundation and core operations
- [x] Batch 1: setup, PostgreSQL migrations, auth, RBAC, audit foundation, React auth shell.
- [x] Batch 2: admin-managed Google allowlist, hidden/noindex web app, Android APK with OTA config.
- [ ] Batch 3: catalogue, partners, warehouses, stock ledger, migrations and REST endpoints.
- [ ] Batch 4: purchases, sales, returns, transaction services and audit coverage.
- [ ] Batch 5: accounting foundations and dashboard/report endpoints.
- [ ] Batch 6: Phase 1 verification with PHPUnit and frontend build.

## Phase 2 — Intelligence and automation
- [ ] Business intelligence aggregates and sales forecasts.
- [ ] Optional Ollama adapter for summaries and recommendations; deterministic fallback when unavailable.
- [ ] Rule-based alerts for low stock, slow movers and receivables.

## Phase 3 — Production readiness
- [ ] Security hardening, rate limits and permission matrix tests.
- [ ] Playwright end-to-end tests.
- [ ] Docker Compose production profile, backups and deployment verification.
- [ ] Final TEST_REPORT.md with actual commands and results.

Phase 1 MVP target: create users, manage products/variants, track stock, record purchases and sales, manage customers/suppliers, process returns and adjustments, view dashboards, and retain transaction/activity records.
