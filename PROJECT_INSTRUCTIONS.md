# Project Instructions — @mInspect

@mInspect is a business intelligence and growth platform for Craft Kicks. It is a real application, not a demo.

## Non-negotiable rules
- No mandatory paid APIs, credit cards or subscriptions.
- Prefer free and open-source dependencies.
- Local AI through Ollama is optional; core operations work without it.
- No paid service may be introduced without explicit approval.
- The project is not associated with AMAYA Industries.
- Use migrations for all database structure changes.
- Validate input on the server, use transactions for inventory and money operations, and write audit logs.
- Do not leave non-functional buttons or mock data in place of real operations.
- Do not claim deployment or tests that were not actually performed.

## Approved architecture
- Backend: Laravel 12 (PHP 8.3)
- Frontend: React 18 + Vite
- Database: PostgreSQL 16
- API: REST with Laravel Sanctum tokens
- Structure: modular monolith
- Deployment: Docker Compose
- Tests: PHPUnit (backend) and Playwright (frontend, later batch)

## Naming
- Product: @mInspect
- Organisation/brand using the app: Craft Kicks
- Repository/package: `craftkicks/minspect`

## Local setup
1. Copy `.env.example` to `.env`.
2. Set `DB_PASSWORD`, `APP_KEY`, and, optionally, `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
3. Run `docker compose up --build`.
4. API: `http://localhost:8000`, frontend: `http://localhost:5173`.
5. Optional AI: `docker compose --profile ai up ollama`.

Details and current status live in `PROJECT_STATUS.md`.
