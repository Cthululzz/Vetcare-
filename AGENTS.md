# AGENTS.md

VetCare+ is a **frontend-only** veterinary clinic manager (React 19 + TypeScript + Vite 8 + Tailwind 4). All data lives in browser `localStorage`; there is no backend, API, database, or real auth yet.

## Commands

- `npm run dev` — Vite dev server.
- `npm run build` — runs `tsc -b` first; this is the typecheck gate. The Vite build does not run if types fail.
- `npm run lint` — ESLint flat config (`eslint.config.js`).
- No test script or test framework exists. Do not invent `npm test`; verify with `npm run build` / `npm run lint` plus manual browser checks.

`npm run build` currently passes. `npm run lint` still fails on 12 pre-existing errors (React `set-state-in-effect` in `GreetingBanner`, `PatientConditionsCard`, `AppointmentForm`, `ConsultationModal`; unused `_` in `useAuth`; `any` in `Schedule/types.ts`; `prefer-const` in `dateUtils.ts`) plus 1 warning. Don't chase unrelated pre-existing lint failures; just don't add new ones.

## Toolchain constraints

- `verbatimModuleSyntax` + `erasableSyntaxOnly` are enabled: use `import type` for types; TS `enum`, namespaces, and constructor parameter properties are rejected.
- `noUnusedLocals` / `noUnusedParameters` are on and fail the build — remove unused imports and variables.
- No path aliases; use relative imports (`tsconfig.json` is only project references).
- Tailwind v4 via `@tailwindcss/vite`; `src/index.css` is just `@import "tailwindcss";`. There is no `tailwind.config.js` — don't create one.
- UI uses Tailwind utilities on a dark slate theme with accent `#ece883`. `src/App.css`, `src/assets/react.svg`, and `src/assets/vite.svg` are unused Vite-template leftovers — don't import them.

## Architecture

- Entry: `src/main.tsx` (`BrowserRouter`) → `src/App.tsx` (all routes). Authenticated pages render inside `src/components/common/AppLayout.tsx` (Sidebar + `<Outlet />` + global inventory reminder).
- Pages in `src/pages/`; feature components in `src/components/<feature>/`; hooks in `src/hooks/`; domain types in `src/types/`; shared roles/branches/doctors/enums in `src/constants/appConstants.ts`.
- `src/pages/Schedule.tsx` is a re-export barrel; the real page is `src/pages/Schedule/Schedule.tsx` (route `/agenda`).
- All persistence goes through `src/hooks/useLocalStorage.ts` (module-level cache + `useSyncExternalStore` + cross-tab `storage` sync). Feature hooks (`usePatients`, `useAppointments`, `useInventory`, ...) wrap it with `vet_*` keys. Add data via a feature hook, never direct `localStorage`.
- Auth is mocked in `src/hooks/useAuth.ts` (e.g. `admin@vetcare.com` / `admin123`, `vet@vetcare.com` / `vet123`). The committed `.env` sets `VITE_BYPASS_AUTH=true` and `VITE_DEFAULT_USER_EMAIL`, so dev auto-logs in as admin. Don't add secrets to `.env` (it is tracked).
- `README.md` is the untouched Vite template, and `Docs/` + `Roadmap/` are planning notes (MySQL multi-branch is planned, not implemented) — not current implementation docs.

## Domain conventions

- Data shapes mix Spanish and English field names — preserve them (`fecha`, `hora`, `status`, `tipo`, `sucursalId` vs `name`, `species`, `gender`, `history`). Entities reference each other by ID, not duplicated nested objects.
- Dates are ISO `yyyy-mm-dd` strings; times are 24h `HH:MM`. Format only for display via `src/utils/dateUtils.ts` and `src/utils/formatters.tsx` (es-ES / es-CL, CLP currency).
- Saving an appointment (`src/pages/Schedule/useScheduleActions.ts`) finds/creates the owner by phone, then the patient by name + owner. Finishing a consultation writes a `MedicalRecord` and sets `finalizada`; hospitalizing keeps the appointment `en_consulta`.
- UI copy and comments are Spanish (Chile); keep new user-facing text in Spanish.
- Role/permission definitions live in `src/constants/appConstants.ts` and `src/utils/permissions.ts`; roles are `ADMIN`, `VET`, `RECEPTIONIST`, `INVENTORY`.
