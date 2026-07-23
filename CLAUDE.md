# Fleetcast

Front-end-only prototype: ML demand forecasting for Green Capital Transport (Green Bus,
northern Thailand). No backend, DB, API, auth, router, or state library — do not add one.

## Commands

```bash
npm run dev       # vite, :5173
npm run verify    # typecheck + eslint + prettier check — MUST pass before a task is done
npm run lint:fix  # autofix
npm run format    # write formatting
```

## Data flow — one direction, never short-circuit

```
data/generateDataset  →  services/forecastEngine  →  services/analytics
                                                     services/recommendations
                                                          ↓
                      pages/DashboardPage  ←  hooks/useDashboard  ←  services/repository
```

Components read from the snapshot they are handed. They never import the generator, the
engine, or the analytics modules directly.

## Non-negotiables

- **No hard-coded numbers in the UI.** Every KPI, label, band and recommendation is derived
  from the generated dataset + fitted model. A number typed into a component is a bug.
- **Time is pinned.** `TODAY` / `SIMULATED_NOW` in `data/constants.ts` = 2026-07-22. Never
  call `new Date()` for "now"; never use `Math.random()` — use `lib/rng.ts` (seeded).
- **No raw hex in components.** Tokens live in `styles/globals.css` (raw ramps on
  `:root`/`.dark`, semantic aliases via `@theme inline`).
- **Chart palette is validated, not a preference.** Fixed slot order blue → orange → aqua →
  yellow, assigned by entity (never by rank, never cycled). Donut caps at 3 named slices +
  neutral "Other". Dark mode uses selected steps, not an inversion.
- No dual-axis charts. Status colour always ships with an icon + text label. Heatmap prints
  its value in every cell. Every chart has a table-view twin. One filter row scopes the page.
- On refetch the previous render dims — it does not collapse back to skeletons.

## TypeScript

Strict, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`,
`noUnusedLocals/Parameters`, `erasableSyntaxOnly`.

- Type-only imports need `import type`.
- `arr[i]` is `T | undefined` — narrow it, don't `!`.
- Optional props reject an explicit `undefined`; omit the key instead (conditional spread).
- No enums / parameter properties (erasable syntax only).
- Path alias `@/*` → `src/*`.

## Conventions

- UI copy is **Thai**. Code, identifiers, comments, commit messages are **English**.
- `components/ui/` = shadcn-style Radix primitives; extend, don't rewrite.
- Comments explain _why_, at the top of a module or a non-obvious block — match the existing
  density, don't narrate lines.

## Domain

Grain = one row per departure per travel date (mirrors GIS export "report 03"), not per
passenger. LF = load factor = seats sold ÷ seats offered. Bus classes Gold 21 / V 32 / X 40 /
A 46. Route 166 (เชียงใหม่–เชียงราย) is the strongest performer (LF 90–98%), 152
(แม่ฮ่องสอน) the weakest — recommendations are expected to land there. Channel mix
reproduces observed May 2026: B2B 48% / B2C 19% / agent 16% / 12Go 6%.

## Source data

`docs/` — the business data analysis this prototype is modelled on (data inventory, ETL
gotchas, ML/dashboard use cases). Read it before changing the generator or the domain model.

If work ever moves to the real dumps: they carry full PII (names, national ID, passport,
phone, email, address). Mask or hash before anything touches a warehouse or a screen.

## Out of scope

Navigation beyond Demand Overview and the account menu are presentational and labelled as
such in the UI. Don't build them out unless asked.
