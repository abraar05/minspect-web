# Project Status — @mInspect

## Current phase
Phase 1 (Foundation) — batches 1 and 2 complete; core operations planning next.

## Live preview
Hidden/noindex web preview: `https://abraar05.github.io/minspect-web/`
Source repo: `https://github.com/abraar05/minspect-web` (`main` source, `gh-pages` built site).
Login/Google buttons are disabled until a real backend API and OAuth credentials are configured.

## Local admin
- `DatabaseSeeder` creates the first local admin from `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` and `SEED_ADMIN_NAME`.
- A gitignored `.env` has been prepared locally with the requested admin email/password; credentials are not committed.
- `docker compose up --build -d` now runs `migrate --seed --force`, so the admin is created on first boot.

## Completed modules
- Project setup, approved architecture and policy documents.
- Laravel application bootstrap and configuration.
- PostgreSQL configuration and Docker Compose environment.
- Authentication: registration, login, logout, profile, Sanctum tokens.
- Google sign-in gated by an admin-managed email allowlist.
- Custom RBAC, permission gates and audit logging.
- Hidden web app: login gate, `noindex` meta tags and `robots.txt` disallow.
- React frontend with login/register, Google button/callback, protected dashboard, admin allowlist management and sign-out.
- Capacitor Android project with self-hosted OTA configuration via `@capgo/capacitor-updater`.
- Built installable debug APK: `minspect-debug.apk` (5.3 MB).

## Files created (batch 2 additions)
- Backend: `config/services.php`, `app/Http/Middleware/NoindexResponses.php`, `app/Models/{AllowedGoogleAccount,GoogleAccount}.php`, `app/Http/Controllers/Api/GoogleAuthController.php`, `app/Http/Controllers/Api/Admin/AllowedGoogleAccountController.php`, `public/robots.txt`, 2 migrations, `tests/Feature/GoogleAllowlistTest.php`.
- Frontend: `frontend/src/pages/{GoogleCallback,AdminAccess}.jsx`, `frontend/src/ota.js`, `frontend/capacitor.config.json`, `frontend/.env.example`, `frontend/android/`.
- Android: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`, copied to `/workspace/_maya/minspect/minspect-debug.apk`.

## Files modified
- Product name changed from “2As Super” to “@mInspect”.
- `composer.json` now requires `laravel/socialite`.
- `frontend/package.json` now uses Capacitor 6 + `@capgo/capacitor-updater` 6 and has `cap:sync`, `cap:android`, `build:apk` scripts.
- Android Gradle config pinned to AGP 8.7.2, Gradle 8.11.1, minSdk 23, compileSdk/targetSdk 35, and ARM `aapt2` override for this environment.

## Database changes
- Batch 1: `users`, `roles`, `permissions`, `role_user`, `permission_role`, `personal_access_tokens`, `password_reset_tokens`, `audit_logs`.
- Batch 2: `allowed_google_accounts`, `google_accounts`.

## Tests performed
- JSON parsed successfully with Node.
- Frontend production build passed: `npm run build` (Vite 6.4.6).
- Capacitor sync passed: `npx cap add android`.
- Android debug APK build passed: `./gradlew assembleDebug` → `BUILD SUCCESSFUL`.
- PHP source reviewed manually; PHPUnit not executed because PHP and Composer are unavailable here.

## Known issues
- Google OAuth credentials are placeholders; real Client ID/secret/redirect URI must be configured.
- `VITE_API_BASE_URL` and OTA `updateUrl` are placeholders; live backend and update manifest hosting are not deployed.
- APK is debug-signed and suitable for install/testing; Play/release distribution needs a real signing keystore.
- PHP/Composer/Docker/PostgreSQL are unavailable here, so migrations and PHPUnit remain unrun locally.
- Frontend module cards are informational only; core operations are planned for the next batch.

## Backend deployment
- `render.yaml` prepared for a free Render Docker web service + free PostgreSQL database.
- Dockerfile now runs `migrate --seed --force` before serving on Render's `PORT`.
- Render still requires an authenticated owner to connect the GitHub repo and supply `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, Google OAuth values and the final `APP_URL`.

## Exact next task
Build batch 3: migrations, models and REST endpoints for categories, brands, products, product variants, suppliers, customers, warehouses and the stock ledger, with PHPUnit feature tests.
