# Test Report — @mInspect

## Live deployment
- GitHub repo created: `https://github.com/abraar05/minspect-web`
- GitHub Pages status: `built`
- Live hidden/noindex preview: `https://abraar05.github.io/minspect-web/`
- Verified HTTP 200 for `/`, `/assets/index-DBUDqy5l.js`, `/assets/index-CZQ21YuD.css`, `/404.html`.
- Verified `/login` serves the SPA fallback (`404.html`) with `<div id="root"></div>`.

## Environment limitation
This workspace has Node.js, npm, Java 17 and Android SDK tools, but no PHP, Composer, Docker or PostgreSQL. PHPUnit and Docker-based verification cannot be executed here. No PHP-side test result is claimed.

## Checks actually performed

### Batch 1
- `composer.json` and `frontend/package.json` parsed successfully with Node.
- Laravel migration and PHP source files reviewed for structural consistency.
- Frontend entry point bundled successfully with esbuild 0.24.0:
  `npx --yes esbuild@0.24.0 src/main.jsx --bundle --outfile=/tmp/opencode/minspect-main.js --loader:.jsx=jsx --external:react --external:react-dom --external:react-router-dom`
  Output: `minspect-main.js` 16.2 kB, `minspect-main.css` 5.4 kB, no errors.

### Batch 2
- `npm install --no-audit --no-fund` succeeded.
- `npm run build` succeeded:
  - `dist/index.html` 0.60 kB
  - `dist/assets/index-tkfqKlMC.css` 5.21 kB
  - `dist/assets/index-DP0-z_wi.js` 187.67 kB
  - OTA chunks `esm-BCsNUjZ7.js` 4.37 kB and `web-DS4I5B0W.js` 5.40 kB
- `npx cap add android` succeeded with `@capgo/capacitor-updater@6.53.0`.
- Android build succeeded:
  `ANDROID_HOME=/workspace/.android-sdk ANDROID_SDK_ROOT=/workspace/.android-sdk ./gradlew assembleDebug --no-daemon`
  Result: `BUILD SUCCESSFUL`.
- APK produced at:
  `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
  and copied to `/workspace/_maya/minspect/minspect-debug.apk` (5.3 MB).

## Build fixes applied
- Switched from Capacitor 8/7 to Capacitor 6 because Java 21 cannot start in this PRoot environment.
- Raised AGP to 8.7.2, Gradle wrapper to 8.11.1, minSdk to 23, compileSdk/targetSdk to 35.
- Set `android.aapt2FromMavenOverride` to the ARM aapt2 binary at `/workspace/.android-sdk/sdk-tools-arm64/build-tools/aapt2`.

## Tests written but not yet executed
- `tests/Feature/AuthTest.php`
  - registration creates user, staff role, token and audit entry
  - registration validation errors
  - login, profile fetch and audit entry
  - invalid credentials rejected
  - logout deletes the token
- `tests/Feature/GoogleAllowlistTest.php`
  - admin can add, list, disable and remove approved Google accounts
  - non-admin cannot manage the allowlist

## Commands to run in a Docker-capable environment
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
# set APP_KEY, DB_PASSWORD, Google OAuth values, VITE_API_BASE_URL and VITE_UPDATE_URL
docker compose up --build -d
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
docker compose exec app php artisan test
cd frontend && npm install && npm run build
```

Expected result after batch 2: seven feature tests pass, frontend builds, and the APK can be rebuilt. Update this report only with actual output.
