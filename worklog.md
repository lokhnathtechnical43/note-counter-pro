# Work Log

## 2026-03-05: Replace NoteCounterPage with Original Simple Version

### Task
Replace the entire NoteCounterPage component (4-tab redesign version) with the original simple version.

### Changes Made
- **File**: `/home/z/my-project/src/app/page.tsx`
- **Lines replaced**: 1552–2659 (old 4-tab redesign with Counter/Calc/Billing/Khata tabs)
- **New lines**: 1552–2129 (original simple single-page NoteCounterPage)

### Key Differences (Old vs New)
| Feature | Old (4-tab) | New (Simple) |
|---------|-------------|--------------|
| Layout | 4 tabs (Counter, Calc, Billing, Khata) | Single page with all features inline |
| Header | Green branded header with logo & dropdown menu | Simple white header with icon buttons |
| Calculator | Separate "Calc" tab | Inline expandable calculator panel |
| Billing | Full "Billing" tab | Removed |
| Khata (Ledger) | Full "Khata" tab | Removed |
| GST Calculator | Integrated in Calc tab | Removed |
| Bank Holidays | In dropdown menu | Removed |
| Other Amount field | Present | Removed |
| Online Amount field | Present | Removed |
| Denomination colors | Green/orange/purple/blue theme | Warm palette (orange, amber, green, teal, blue, purple, pink, indigo, gray) |
| Color strips | Had stripColor sidebar | Simple colored denomination badge |

### Verification
- TypeScript compilation: **PASS** (no errors)
- ESLint: **PASS** (no new errors in page.tsx)
- Dev server: Running successfully on port 3000
- Markers preserved: `// ============ NOTE COUNTER ============` at line 1552, `// ============ DOC SCANNER ============` at line 2130

---

## 2026-03-05: Build DLP Debug APK

### Task
Build a debug APK for the DailyLife Pro app.

### Steps Performed
1. **Next.js Build** (`npm run build`): ✅ SUCCESS
   - Prisma generate completed
   - Next.js 16.1.3 (Turbopack) compiled in 3.8s
   - 17 pages generated (1 static + 16 dynamic API routes)
   - No TypeScript or compilation errors

2. **Capacitor Sync** (`npx cap sync android`): ✅ SUCCESS
   - Web assets copied to `android/app/src/main/assets/public`
   - 1 Capacitor plugin synced: `@capacitor-community/admob@8.0.0`
   - Sync completed in 0.121s

3. **Gradle Build** (`./gradlew assembleDebug`): ✅ SUCCESS
   - **Issue encountered**: Default JAVA_HOME (`/usr/lib/jvm/java-21-openjdk-amd64`) was JRE-only (no `javac`)
   - **Fix**: Set `JAVA_HOME=/home/z/jdk/jdk-21.0.11+10` (Temurin JDK 21.0.11+10) which includes `javac`
   - Build completed in 7s with 125 tasks (123 executed, 2 up-to-date)
   - Minor warnings: deprecated SMART_BANNER in admob plugin, flatDir usage

4. **APK Copy**: ✅ SUCCESS
   - Source: `/home/z/my-project/android/app/build/outputs/apk/debug/app-debug.apk`
   - Destination: `/home/z/my-project/download/DailyLifePro-debug.apk`

### Final Output
| Item | Value |
|------|-------|
| APK Path | `/home/z/my-project/download/DailyLifePro-debug.apk` |
| APK Size | **9,634,612 bytes (~9.19 MB)** |
| Build Type | Debug |
| JAVA_HOME Used | `/home/z/jdk/jdk-21.0.11+10` |

### Note for Future Builds
The system default Java (`/usr/lib/jvm/java-21-openjdk-amd64`) is a JRE-only installation. Always set `JAVA_HOME=/home/z/jdk/jdk-21.0.11+10` when running Gradle builds to ensure the Java compiler is available.

---

## 2026-03-05: Build NCP Debug APK

### Task
Build a debug APK for the Note Counter Pro app located at `/home/z/note-counter-pro/`.

### Steps Performed
1. **Next.js Build** (`npm run build`): ✅ SUCCESS
   - Next.js 16.2.7 (Turbopack) compiled in 6.7s
   - 2 static pages generated (`/` and `/_not-found`)
   - No TypeScript or compilation errors

2. **Capacitor Sync** (`npx cap sync android`): ✅ SUCCESS
   - Web assets copied from `out/` to `android/app/src/main/assets/public`
   - 1 Capacitor plugin synced: `@capacitor-community/admob@8.0.0`
   - Sync completed in 0.08s

3. **Gradle Build** (`./gradlew assembleDebug`): ✅ SUCCESS (after JDK fix)
   - **Issue 1**: Default JAVA_HOME (`/usr/lib/jvm/java-21-openjdk-amd64`) was JRE-only (no `javac`)
   - **Fix 1**: Downloaded JDK 17 to `/home/z/.jdks/jdk-17.0.12` — but Capacitor 8 requires Java 21 (`invalid source release: 21`)
   - **Fix 2**: Downloaded JDK 21.0.6 to `/home/z/.jdks/jdk-21.0.6` — build succeeded
   - Build completed in 13s with 125 tasks (19 executed, 106 up-to-date)
   - Minor warnings: flatDir usage, unchecked operations in capacitor-android

4. **APK Copy**: ✅ SUCCESS
   - Source: `/home/z/note-counter-pro/android/app/build/outputs/apk/debug/app-debug.apk`
   - Destination: `/home/z/my-project/download/NoteCounterPro-debug.apk`

### Final Output
| Item | Value |
|------|-------|
| APK Path | `/home/z/my-project/download/NoteCounterPro-debug.apk` |
| APK Size | **9.4 MB** |
| Build Type | Debug |
| Package ID | `com.lokhnathtechnical.notecounterpro` |
| JAVA_HOME Used | `/home/z/.jdks/jdk-21.0.6` |

### Note for Future NCP Builds
The system default Java is JRE-only. Use `JAVA_HOME=/home/z/.jdks/jdk-21.0.6` when building the NCP Android project. The Capacitor config has `server.url` pointing to `https://note-counter-pro.vercel.app`, so the debug APK loads the web app from the remote server (not local assets).

---

## 2026-06-10: Fix DLP Offline Support - Bundle Web Files Locally

### Task
Fix DailyLife Pro app to work OFFLINE (without internet) by removing the `server.url` Capacitor config that loaded the web app from Vercel, and instead bundling web files locally in the APK.

### Changes Made

1. **`capacitor.config.ts`** — Removed the `server` block (url + allowNavigation)
   - Before: Had `server.url: 'https://dailylife-pro.vercel.app'` and `allowNavigation`
   - After: No server block — Capacitor loads web assets from the bundled `out/` directory

2. **`next.config.ts`** — Added `output: 'export'`
   - Enables Next.js static HTML export, generating a self-contained `out/` directory
   - Required for Capacitor to bundle web files locally in the APK

3. **`src/lib/api.ts`** — Added localStorage fallback for offline/native mode
   - Added `isNative()` detection (checks for Capacitor global)
   - Added localStorage CRUD layer (`localCrud`, `localAuth`, `getLocalData`, `setLocalData`)
   - Auth operations (login/register) now work offline via localStorage with SHA-256 password hashing
   - All data operations (expenses, receivables, payables, loans, accounts, plans, notes, documents, alarms) fall back to localStorage when API is unavailable
   - Network-first strategy: tries API fetch, falls back to localStorage on network error
   - Syncs successful GET responses to localStorage for future offline access
   - Notifications return empty in offline mode

4. **`package.json`** — Added `build:static` script
   - Temporarily moves `src/app/api/` out during static export (API routes are incompatible with `output: 'export'`)
   - Restores API routes after build
   - Original `build` script unchanged for Vercel deployments

5. **`tsconfig.json`** — Excluded `capacitor.config.ts`, `android/`, and `examples/` from TypeScript compilation
   - Prevents build errors from uninstalled type packages

6. **`.gitignore`** — Added `out/`, `*.tsbuildinfo`, `_api_backup/`, `jdk/`

### Build Process
- Static export: Moved API routes out temporarily, ran `next build`, restored API routes
- Capacitor sync: `npx cap sync android` copied `out/` to Android assets
- JDK: Downloaded Temurin JDK 21.0.11+10 to `/home/z/jdk/` (system Java was JRE-only)
- APK build: `JAVA_HOME=/home/z/jdk/jdk-21.0.11+10 ./gradlew assembleDebug`

### Final Output
| Item | Value |
|------|-------|
| APK Path | `/home/z/my-project/download/DailyLifePro-debug.apk` |
| APK Size | **~27.7 MB** |
| Build Type | Debug |
| Offline Mode | ✅ Works without internet |
| Data Storage | localStorage (offline) / API (when online) |

### Important Notes
- The web version on Vercel still uses API routes with Prisma DB — no changes to web deployment
- The native APK uses localStorage for all data when offline
- API route files remain in `src/app/api/` for Vercel deployment but are excluded from static export
- Future builds should use `npm run build:static` for APK builds

---

## 2026-06-10: Build NCP with New Features (Light Mode, Calc Dark Support, Amount Transfer)

### Task
Build Note Counter Pro APK with new changes: default light mode, calc light/dark support, counter-to-calc amount transfer.

### Steps Performed
1. **Next.js Build** (`npm run build`): ✅ SUCCESS
   - Next.js 16.2.7 (Turbopack) compiled in 5.7s
   - 2 static pages generated (`/` and `/_not-found`)
   - No TypeScript or compilation errors

2. **Capacitor Sync** (`npx cap sync android`): ✅ SUCCESS
   - Web assets copied from `out/` to `android/app/src/main/assets/public`
   - 1 Capacitor plugin synced: `@capacitor-community/admob@8.0.0`
   - Sync completed in 0.095s

3. **Gradle Build** (`./gradlew assembleDebug`): ✅ SUCCESS
   - **Issue**: `JAVA_HOME=/home/z/.jdks/jdk-21.0.6` no longer exists on disk
   - **Fix**: Used `JAVA_HOME=/home/z/jdk/jdk-21.0.11+10` (Temurin JDK 21.0.11+10) — build succeeded
   - **Issue**: Missing `local.properties` with `sdk.dir` — created it pointing to `/home/z/android-sdk`
   - Build completed in 2s with 125 tasks (27 executed, 98 up-to-date)

4. **APK Copy**: ✅ SUCCESS
   - Source: `/home/z/note-counter-pro/android/app/build/outputs/apk/debug/app-debug.apk`
   - Destination: `/home/z/my-project/download/NoteCounterPro-debug.apk`

5. **Git Commit & Push**: ✅ SUCCESS
   - Commit: `feat: default light mode, calc light/dark support, counter-to-calc amount transfer`
   - 5 files changed: CalcPage.tsx, CounterPage.tsx, i18n.ts, storage.ts, store.ts
   - Pushed to `origin/main` (`0f0f602..20c5b47`)

6. **GitHub Release Update**: ✅ SUCCESS
   - Old asset ID: 443446655 → deleted (HTTP 204)
   - New asset uploaded: ID 443470839, state=uploaded

### Final Output
| Item | Value |
|------|-------|
| APK Path | `/home/z/my-project/download/NoteCounterPro-debug.apk` |
| APK Size | **10,005,549 bytes (~9.54 MB)** |
| Build Type | Debug |
| Package ID | `com.lokhnathtechnical.notecounterpro` |
| JAVA_HOME Used | `/home/z/jdk/jdk-21.0.11+10` |
| GitHub Release | Release 336664366, Asset ID 443470839 |

### Files Changed in This Build
- `src/components/calc/CalcPage.tsx` — Light/dark mode support
- `src/components/counter/CounterPage.tsx` — Amount transfer to calc
- `src/lib/i18n.ts` — Updated translations
- `src/lib/storage.ts` — Storage updates
- `src/lib/store.ts` — Default light mode
