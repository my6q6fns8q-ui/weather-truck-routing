# Frontend architecture

React + TypeScript, Vite, Leaflet. No state-management or i18n dependency: the
store and the message catalogue are ~120 lines of local code
(`src/lib/store.ts`, `src/i18n/`). `@/` resolves to `src/`.

## Layers

Imports only ever point **down** this list:

| Layer          | Folder                                    | Knows about                       | Never imports                   |
| -------------- | ----------------------------------------- | --------------------------------- | ------------------------------- |
| App shell      | `src/app`                                 | features, i18n, store             | —                               |
| Features (UI)  | `src/features/{trip,routes,forecast,map}` | store, domain, i18n, lib          | other features                  |
| Store          | `src/store`                               | services, domain, i18n types, lib | React components                |
| Services (I/O) | `src/services`                            | domain, lib                       | store, React                    |
| Domain         | `src/domain`                              | lib                               | everything above                |
| Primitives     | `src/lib`, `src/i18n`                     | —                                 | app state (except `i18n/hooks`) |

- **`domain/`** — API shapes (`types.ts`), the risk scale, the trip model with
  its validation (`trip.ts`), and pure selectors over a plan (`plan.ts`). No
  React, no `fetch`, no app state. This is where rules go so tests can reach
  them cheaply.
- **`services/`** — the only place that knows `fetch` and the wire format.
  `http.ts` turns failures into `ApiError{code}`; `planning.ts` and `places.ts`
  are one function per endpoint.
- **`store/`** — a single `appStore` holding the trip draft, the plan, map view
  state and the locale (`state.ts`). Components read with hooks (`hooks.ts`) and
  write with actions (`*.actions.ts`); async actions own their `AbortController`
  and drop superseded responses. Nothing else mutates state.
- **`features/`** — one connected component per area (`TripPanel`, `RouteList`,
  `ForecastBar`, `RouteMap`) plus presentational children. Transient UI state
  (dropdown open, debounce, play/pause) stays local — only shared state is
  stored.

Swapping the hand-rolled store for Zustand would touch `lib/store.ts` and
`store/appStore.ts` only; every hook and action keeps its signature.

## Trip flow

The form and the map edit the same `draft`, so either can set an endpoint:

1. `picking` starts as `"origin"`, so the first map click sets the start, then
   the flow advances to `"destination"`. `PickBanner` narrates the two steps;
   Escape or the pin button cancels. Choosing from search advances the same way.
2. A click drops the coordinate immediately and asks `/api/geocode/reverse/` for
   a name; the label upgrades when it answers, and is left alone if the user has
   moved that endpoint meanwhile. Pins stay draggable afterwards.
3. `submitPlan` validates the draft in the domain layer, calls the API, then
   selects the recommended route, closes the form and requests a map fit.
4. Map framing is a request, not an imperative call: actions bump
   `fit = {target, nonce}` and `FitController` reframes once per nonce.

## i18n

`i18n/messages/en.ts` is the source of truth for keys; every other locale is
typed `Messages`, so a missing key fails `tsc` (and `dictionary.test.ts` checks
for empty strings). Components call `useTranslate()` for text and
`useFormatter()` for numbers, dates and quantities — both bound to the active
locale, which also goes to the geocoder as `lang` and onto `<html lang>`. Risk
labels are rendered from the numeric `level`; the API's English labels stay as
lookup keys for `summary.miles_by_level`. Errors we author are stored as message
keys and translated at render time; wording that came from the API is shown as
received.

## Backend

Django stays layered as it was: `views` (HTTP + serializer validation) →
`planner`/`risk`/`storm` (rules) → `providers/*` (OSRM, Open-Meteo, Photon, each
cached and retried behind `providers/http.py`), with `errors.py` mapping domain
failures to status codes.
