# Fleetcast — ML Demand Forecasting

A clickable, front-end-only prototype of an enterprise demand-forecasting platform for
**Green Capital Transport** (Green Bus / Chaiyaphat, northern Thailand).

It answers the questions the business case asks: how many passengers will each route and
departure carry over the next month to a year, which departures will run full, and where
buses should be added or withdrawn.

```bash
npm install
npm run dev      # http://localhost:5173
```

---

## What makes it different from a mock-up

**Nothing on the dashboard is a hard-coded number.** A seeded generator builds a synthetic
warehouse, a small but genuine forecasting model is fitted to it in the browser, and every
KPI, chart, status and recommendation is derived from that fit.

```
data/generateDataset.ts      11,680 departure records  (8 routes × 4 slots × 365 days)
        ↓
services/forecastEngine.ts   seasonal indices → damped trend → prediction intervals
        ↓                    32 fitted series (route × slot), 365 days ahead
        ↓                    + a 7-day hold-out backtest  → MAPE, accuracy
services/analytics.ts        KPIs · heatmap · route ranking · capacity bands · summary
services/recommendations.ts  rule engine over the horizon → ranked, costed actions
        ↓
services/repository.ts       fake async repository (simulated latency, filter scoping)
        ↓
hooks/useDashboard.ts        → one page of components
```

### The model

Deliberately small enough to read in one sitting, but a real forecast rather than a curve
drawn to look convincing:

1. **Pooled day-of-week seasonal indices** (ratio-to-series-mean), with known holiday
   effects divided out first so they are not double counted.
2. **Damped linear trend** on the deseasonalised level, fitted per route × departure slot
   by OLS. Damping (φ = 0.94) stops a year-long extrapolation running away — the geometric
   sum converges, so the trend term flattens out instead of growing without bound.
3. **Holiday multipliers** from a Thai public-holiday calendar — the late-July
   King's-Birthday / Asalha Bucha / Khao Phansa block drives the forecast peak.
4. **80% prediction intervals** from residual sigma, widening with √horizon.
5. **A hold-out backtest**: refit on all but the last 7 observed days, score the rest.
   That is where _Forecast Accuracy_ (~93%, i.e. MAPE ≈ 6.8%) comes from.

Because the generator applies a network-wide daily shock that does not cancel when routes
are summed, the measured error lands in a realistic 6–9% band rather than an implausible 1%.

### Why the numbers move when you filter

Three controls — horizon (1 month / 1 quarter / 1 year), region, and route — re-query the
repository, and every downstream figure is recomputed against that slice: passenger totals,
load factors, route counts, recommendations and the narrative summary all change together.

The route list is scoped by the selected region, and both the option list and the query read
it from the same `routesInRegion()` helper, so what a planner can pick can never drift from
what the query returns. Changing region resets route back to _all_ in the same state update,
so it still costs exactly one refetch. Pick a single route and the card copy follows the
scope — "ทั้งเครือข่าย" becomes that route, because calling one route's numbers
network-wide would be a lie.

---

## Data model

Grain matches the operator's real GIS export (_report 03 — revenue by departure_): one row
per departure per travel date, not one row per passenger.

| Field                                                | Notes                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `routeId` · `routeName` · `departureTime`            | 8 routes × 4 slots (07:00 / 11:00 / 16:30 / 22:00)                                   |
| `busClass` · `seatCapacity`                          | Gold (21) · V (32) · X (40) · A (46) — real Green Bus classes                        |
| `ticketCount` · `loadFactor` · `revenue`             | load factor = seats sold ÷ seats offered                                             |
| `travelDate` · `bookingDate` · `advancePurchaseDays` | lead time varies by channel                                                          |
| `bookingChannel`                                     | mix reproduces the observed May-2026 split (B2B 48% / B2C 19% / agent 16% / 12Go 6%) |
| `isHoliday` · `holidayName` · `dayOfWeek`            | drives the seasonal terms                                                            |

Route 166 (Chiang Mai – Chiang Rai) sustains 90–98% load and 152 (Mae Hong Son) runs half
empty — both reproduced from the source analysis, so the recommendations land on the routes
you would expect.

That analysis lives in [`docs/`](docs/): the [data inventory and ETL
notes](docs/data-sources.md) behind the grain and the constants, and the [use-case
survey](docs/use-cases.md) that places this prototype among the other things the dump
supports. Read it before touching the generator or the domain model.

---

## Design system

Tokens live in [`src/styles/globals.css`](src/styles/globals.css) in two layers: raw ramps
and surfaces on `:root` / `.dark`, then semantic aliases exposed to Tailwind through
`@theme inline`. Components never reference a raw hex.

**The chart palette is validated, not eyeballed.** Categorical slots run in a fixed order
(blue → orange → aqua → yellow) and are assigned by entity, never by rank or cycled. The
donut caps at three named slices plus a neutral "Other", because only the first three slots
clear the all-pairs colour-separation gate that a pie is read under. Dark mode is a
_selected_ set of steps for the dark surface, not an automatic inversion.

Other rules held throughout:

- No dual-axis charts anywhere.
- Status colour (good / warning / serious / critical) is reserved for state and always ships
  with an icon and a label — never colour alone.
- The heatmap prints its value in every cell, so the sequential ramp is never the only
  encoding, and it carries a scale legend.
- Every chart has a **table view** twin, toggled from the card header.
- One filter row scopes the whole page; no per-card filters.
- On refetch the previous render dims rather than collapsing back to skeletons.

---

## Stack

React 19 · Vite 8 · TypeScript 6 (strict, plus `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes`) · Tailwind CSS 4 · shadcn-style Radix primitives · Recharts ·
Lucide.

No backend, no database, no API, no auth, no router, no data-fetching or state library —
everything runs in the browser from the generated dataset.

```bash
npm run dev           # dev server
npm run build         # typecheck + production build
npm run verify        # typecheck + eslint + prettier check
npm run lint:fix      # autofix
npm run format        # write formatting
```

---

## Layout

```
src/
├── components/
│   ├── ui/           Radix-based primitives (button, card, badge, tabs, select, …)
│   ├── layout/       Sidebar · Header · DashboardLayout
│   ├── common/       SectionTitle · ThemeToggle · Sparkline · EmptyState · skeletons
│   ├── charts/       ChartCard · ForecastChart · DemandHeatmap · ChannelDonut · theme
│   └── dashboard/    FilterBar · KpiGrid · MetricCard · RouteRanking · RouteStatusBoard ·
│                     CapacityUtilization · RecommendationPanel · RecommendationCard
├── data/             constants (routes, holidays, thresholds) · dataset generator
├── services/         forecastEngine · analytics · recommendations · repository
├── hooks/            useDashboard · useTheme
├── lib/              utils · date · format · seeded rng
├── types/            domain model
└── pages/            DashboardPage

docs/                 source data analysis (Thai) — inventory · ETL notes · use cases
CLAUDE.md             working rules for Claude Code
```

## Known limits

- It is a prototype: navigation beyond _Demand Overview_ and the account menu are
  presentational, and marked as such in the UI.
- "Now" is pinned to **22 Jul 2026** (`SIMULATED_NOW`) so timestamps and relative labels read
  identically on any machine at any time. History runs back to 22 Jul 2025 and the forecast
  out to 21 Jul 2027.
- The forecast chart draws at most **120 days** of history behind the horizon
  (`MAX_CHART_HISTORY_DAYS`). A year of actuals against a year of forecast is 730 points on
  one line — legible as a table, not as a chart. The snapshot reports the window it drew.
- Recharts dominates the bundle (~816 kB raw / ~245 kB gzipped). Fine for a demo; a
  production build would code-split the chart layer.
