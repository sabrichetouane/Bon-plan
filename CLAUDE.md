# Bon Plan Bizerte — Project Guide

Expo / React Native tourism-guide app for the city of **Bizerte, Tunisia**.
Academic context: **PFE (Projet de Fin d'Études), BTS Informatique de Gestion**, host company **Info Plus**.

> **Read this file first.** Deeper references live in nested `CLAUDE.md` files —
> see [Index](#index) below.

---

## 1. Run it

```bash
npm install
npx expo start        # then press a (Android), i (iOS), or scan the QR in Expo Go
```

| Script | Command |
| --- | --- |
| `npm start` | `expo start` |
| `npm run android` | `expo start --android` |
| `npm run ios` | `expo start --ios` |
| `npm run web` | `expo start --web` |

**Stack:** Expo SDK 54 · React 19.1.0 · React Native 0.81.5 · React Navigation 7
(native-stack + bottom-tabs) · `react-native-maps` 1.20.1 · `expo-linear-gradient` ·
`@expo/vector-icons` (Ionicons only).

**Entry point:** `node_modules/expo/AppEntry.js` → [App.js](App.js). Plain JavaScript —
`tsconfig.json` exists but **no `.ts`/`.tsx` files are used**. Don't introduce TypeScript
without asking.

**MapScreen needs a native build or Expo Go on a device** — `react-native-maps` does not
render on `expo start --web`.

---

## 2. What the app does today

Boot flow (linear, one-way):

```
Splash (2.2 s auto) → Onboarding1 → Onboarding2 → ChooseCity → Main (bottom tabs)
                          └── "Skip" ──────────────┘
```

`Main` is a 4-tab bar: **Home · Map · Itinerary · Profile**. Two screens push on top of
the tabs from the root stack: **CategoryList** and **PlaceDetail**.

Working features:

- Browse 6 categories → grid of places, with live search + `All / Top rated / Budget / Favorites` chips.
- Place detail with hero photo, gallery, stats, **real** Share / Call / Website / Directions
  (opens Apple/Google Maps via `Linking`).
- Favorites (heart) shared across Category list, Detail, and the Profile counter.
- Day-plan itinerary: add from a place, add blank row, remove, live total-duration sum.
- Real map with one colored marker per place, category chips filtering markers, tap-to-focus,
  bottom card that opens PlaceDetail, recenter FAB.
- Live **light/dark theme** toggle and live **EN / FR / AR** language switch from Profile.

Content is **100 % local mock data** — there is no backend, no API, no auth, no database.
See [src/data/CLAUDE.md](src/data/CLAUDE.md).

---

## 3. Architecture in one screen

```
App.js
└── SafeAreaProvider
    └── StoreProvider                 src/store.js — ThemeContext + StoreContext
        └── AppNavigator              src/navigation/AppNavigator.js
            ├── Stack  Splash · Onboarding1 · Onboarding2 · ChooseCity
            ├── Stack  Main  →  Tab  Home · Map · Itinerary · Profile
            └── Stack  CategoryList · PlaceDetail       (pushed over the tabs)
```

Three shared modules every screen leans on:

| Module | Provides | Hook |
| --- | --- | --- |
| `src/theme/colors.js` | light/dark palettes, `spacing`, `radius` | `useTheme()`, `useColors()` |
| `src/store.js` | favorites, itinerary, language, theme mode | `useStore()`, `useT()` |
| `src/i18n.js` | EN/FR/AR dictionary | `translate()` (via `useT()`) |

`ThemeContext` is declared in `theme/colors.js` but **populated by `StoreProvider`** —
that indirection exists to avoid a circular import between the two files. Keep it.

---

## 4. House conventions — follow these

**1. Comments are part of the deliverable.** Every file opens with a boxed
`// ====` header explaining what it is, and inline comments explain *React/RN concepts*,
not just the code. This is deliberate: the report and the jury defence quote this source.
Match the density and the tone when you add code.

**2. Theme-aware styles via a factory.** Never a module-level `StyleSheet.create` that
references colors:

```js
export default function MyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  ...
}
const makeStyles = (colors) => StyleSheet.create({ ... });
```

`SplashScreen`, `Onboarding1`, `Onboarding2` still use the legacy static
`import { colors }` (light-only). Migrate them if you touch them.

**3. No magic numbers.** Use `spacing.*` and `radius.*` from `theme/colors.js`.
Screen edge padding is always `spacing.xl` (24).

**4. Every user-visible string goes through `t('key')`.** Add the key to all three
languages in `src/i18n.js` first. Onboarding + ChooseCity are the current exceptions
(hardcoded English) — see [Known gaps](#6-known-gaps).

**5. Images can be either form.** `mockData` mixes `require(...)` and URL strings, so
always render with:
```js
source={typeof p.image === 'string' ? { uri: p.image } : p.image}
```

**6. Icons: Ionicons only.** Don't mix in another `@expo/vector-icons` family.

---

## 5. Index

| File | Covers |
| --- | --- |
| [src/CLAUDE.md](src/CLAUDE.md) | Screen-by-screen map, navigation contract, store & i18n API, how to add a screen |
| [src/theme/CLAUDE.md](src/theme/CLAUDE.md) | Full design system: colors, type scale, spacing, radii, shadows, component recipes |
| [src/data/CLAUDE.md](src/data/CLAUDE.md) | Data dictionary, the 30 places, image assets, how to add content |
| [docs/CLAUDE.md](docs/CLAUDE.md) | PFE deliverables: MCD, use-case & class diagrams, .docx/.pptx generators |

---

## 6. Known gaps

State of play, verified against the source. Nothing here is broken-by-accident — it's
prototype scope.

**No persistence.** Favorites, itinerary, theme and language all live in `useState` and
reset on every reload. `AsyncStorage` is not installed.

**Dead controls** (render fine, do nothing on press):

| Where | Control |
| --- | --- |
| [HomeScreen.js:48](src/screens/HomeScreen.js#L48) | Notification bell |
| [HomeScreen.js:55-63](src/screens/HomeScreen.js#L55-L63) | Search bar — no `value` / `onChangeText` |
| [HomeScreen.js:117](src/screens/HomeScreen.js#L117), [:152](src/screens/HomeScreen.js#L152) | Both "See all" links |
| [MapScreen.js:128-134](src/screens/MapScreen.js#L128-L134) | Search bar — inert |
| [ItineraryScreen.js:69](src/screens/ItineraryScreen.js#L69) | Weekday tabs — no `onPress`, active day hardcoded to index 2 |
| [ItineraryScreen.js:51](src/screens/ItineraryScreen.js#L51) | "Share" option → `onPress: () => null` |
| [ItineraryScreen.js:86](src/screens/ItineraryScreen.js#L86) | "Wednesday, April 12" hardcoded |
| [PlaceDetailScreen.js:238](src/screens/PlaceDetailScreen.js#L238) | Reviews "See all" |
| [ProfileScreen.js:77](src/screens/ProfileScreen.js#L77) | "Edit profile" |
| [ProfileScreen.js:216-222](src/screens/ProfileScreen.js#L216-L222) | "Log out" confirm → no handler |

**Placeholder content.** `PlaceDetailScreen` reviews are two hardcoded entries shown on
*every* place. The profile identity (`explorer@bonplan.tn`, avatar "B") is fixed.
Hero dots on PlaceDetail are decorative — always 3, never wired to the gallery.

**Navigation quirks.**
- **Onboarding1 stays on the stack under the app.** Everything `replace`s except
  [Onboarding1.js:63](src/screens/Onboarding1.js#L63), which `navigate`s. Trace it:
  `[Onboarding1] → [Onboarding1, Onboarding2] → replace → [Onboarding1, ChooseCity] →
  replace → [Onboarding1, Main]`. An iOS swipe-back from the Home tab pops the user into
  onboarding. (Tapping "Skip" avoids it — that path `replace`s.) Fix with
  `navigation.reset({ index: 0, routes: [{ name: 'Main' }] })` from ChooseCity.
- Profile → City → `navigate('ChooseCity')`, then "Follow up" does `replace('Main')` —
  the stack becomes `[Main, Main]`. Should be `goBack()`.
- `MapScreen` and `ItineraryScreen` draw a back chevron, but they are root tabs with
  nothing to go back to — `goBack()` resolves against the TabRouter and jumps to Home.
- The city picked in `ChooseCity` is never stored — `HomeScreen` hardcodes `Bizerte`.

**Data.**
- The `beach` category has no dedicated list; `CategoryListScreen` falls back to
  `featuredPlaces`.
- **Three** pairs of records sit at byte-identical coordinates: `1`/`a4` (Old Port),
  `2`/`n4` (Cap Blanc), `3`/`n3` (Ichkeul). Their map markers are perfectly coincident, so
  one of each pair is permanently unclickable.
- Itinerary row ids use `'user-' + Date.now()`; two adds in the same millisecond collide.

**i18n.** `itin.newActivity` and `itin.tapEdit` are translated but never used —
[store.js:91-92](src/store.js#L91-L92) hardcodes the English strings instead.

**Unused deps.** `docx` and `pptxgenjs` are in `package.json` for the `docs/` report
generators only — they belong in `devDependencies`. `react-native-gesture-handler` and
`react-native-reanimated` are installed but not imported anywhere in `src/`.

---

## 7. Confirmed bugs

Distinct from the dead controls above — these are things that render as if they work.

| File:line | Bug |
| --- | --- |
| [CategoryListScreen.js:67-68](src/screens/CategoryListScreen.js#L67-L68) | Guard is `query.trim()` but the needle is `query.toLowerCase()` — **not trimmed**. Searching `"pizza "` matches nothing. One-word fix. |
| [CategoryListScreen.js:72](src/screens/CategoryListScreen.js#L72) | `p.category.toLowerCase()` unguarded (`p.location` right below has `\|\| ''`). A place without `category` crashes search. |
| [MapScreen.js:93](src/screens/MapScreen.js#L93) | `tracksViewChanges={false}` is a static `false`, so the marker bitmap freezes on first snapshot and the `scale: 1.15` selected-state at :100 **never renders**. |
| [MapScreen.js:45](src/screens/MapScreen.js#L45) | `selected` starts as `allMapPlaces[0]` and is never cleared (`MapView` has no `onPress`). The bottom card can't be dismissed, and changing the chip filter doesn't reconcile it — pick "Shopping" and the Old Port card stays up while its marker is hidden. |
| [PlaceDetailScreen.js:73-77](src/screens/PlaceDetailScreen.js#L73-L77) | `Platform.select` has only `ios`/`android`. On web `url` is `undefined`, so `Linking.openURL(undefined)` throws *before* the `.catch` fallback on :78 can fire. Needs a `default:`. |
| [PlaceDetailScreen.js:95,107](src/screens/PlaceDetailScreen.js#L95) | `tel:` and website `openURL` have no `.catch` — unhandled rejection on a device with no dialer. The directions call three lines up does it correctly. |
| [PlaceDetailScreen.js:324](src/screens/PlaceDetailScreen.js#L324) | `body` has `marginTop: -20`, painting over the hero's bottom 20 px — where the pagination dots sit at `bottom: 14`. They're invisible. |
| [ItineraryScreen.js:33](src/screens/ItineraryScreen.js#L33) | Total-duration regex `/(\d+)\s*h\s*(\d+)?/` requires an `h`, so a `'45m'` duration is silently dropped from the day total. |
| [ItineraryScreen.js:52](src/screens/ItineraryScreen.js#L52) | "Clear all" is `userItinerary.forEach(i => removeFromItinerary(i.id))` — N state updates over a stale closure. Needs a `clearItinerary()` action. |
| [store.js:25](src/store.js#L25) | `useState(seedItinerary)` initialises state with the **exact module array** exported from `mockData.js`. Safe only because every action spreads; one in-place mutation corrupts the seed. Use `useState(() => [...seedItinerary])`. |
| [store.js:64,89](src/store.js#L64) | Both mint ids as `'user-' + Date.now()`. A double-tap collides → duplicate React keys, and `removeFromItinerary`'s filter then deletes **both** rows. |
| [CategoryListScreen.js:137-191](src/screens/CategoryListScreen.js#L137-L191) | `numColumns={2}` with `card: { flex: 1 }` and no odd-item spacer — `foodPlaces` has 7, so the last card stretches full width. |
| [babel.config.js:5](babel.config.js#L5) | Requires `react-native-worklets/plugin`, but `react-native-worklets` is **not in `package.json`** — it resolves only via Reanimated's transitive hoist. A resolver change breaks the Babel config. |
| [app.json](app.json) | No `android.config.googleMaps.apiKey` (grey map on an EAS Android build) and no location permission strings, yet [MapScreen.js:85](src/screens/MapScreen.js#L85) sets `showsUserLocation`. Works in Expo Go only because Expo Go carries its own entitlements. |
| [app.json](app.json) | `assetBundlePatterns: ["**/*"]` bundles the 22 orphan images (~3.5 MB) into every binary. |

Also: **the project root is not under version control.** A correct `.gitignore` exists but
is inert — the only `.git` in the tree belongs to the unrelated `TravelApp/bonplan`
scaffold. `git init` at the root before building more.

---

## 8. Directories to ignore

**The live app is `App.js` + `src/` + `assets/` + `docs/` — 29 MB.** Everything else is
~1.6 GB of dead weight. Never edit these, never import from them, and exclude them from
any recursive grep or watcher (they hold ~88 000 extra files and two stale `node_modules`).

| Path | What | Size |
| --- | --- | --- |
| `TravelApp/bonplan/` | `create-expo-app` SDK 54 template, **never edited** — single "Initial commit", clean tree, stock React logos. Has its own nested `.git`. | 358 MB |
| `TravelApp/TravelApp/` | A third, older non-router Expo app. Contains a folder literally named `{screens,components,constants,data}` — a shell brace-expansion accident. | 250 MB |
| `pfeee/` | PFE diagram PNGs + a static HTML prototype + a **full stale backup of this project** (which itself re-nests copies of both trees above) | 998 MB |

The root is **not** a git repository — only `TravelApp/bonplan` is, so a parent-level
`git status` shows nothing.

**Nothing needs recovering from the backup.** Its `src/` is strictly behind live: all 12
shared files are older, and `store.js`, `i18n.js` and `ProfileScreen.js` don't exist there
at all. The three diagram PNGs in `pfeee/` are byte-identical to the ones already in
`docs/`.

**Two ideas worth salvaging** from `pfeee/Nouveau dossier (2)/` — the pre-React HTML
prototype, which shipped concepts the app never got:

- `places.html` → **audience-first browsing**: "Who are you going with?" branching into
  Friends / Couple / Family, each with its own curated category sections. The RN app
  browses by category only.
- `game.html` → **"Discover Your Next Spot"**, a working surprise-me randomizer.

`crk.html` is also a finished, real place page for Crock'in with four on-site photos and a
live phone number (`+216 20 535 705`) — useful reference for enriching `mockData`.

> Paths there contain spaces, parentheses and accents (`Nouveau dossier (2)`,
> `digrame de cas d'uitllsation.png`). Always quote them — the apostrophe breaks
> unquoted shell commands.

## 9. If you're building next

Ordered by leverage, from an architecture pass over the whole tree.

**Do these first — they're cheap now and expensive later:**

1. **`git init` at the root.** Nothing is under version control today.
2. **Persistence.** Install `@react-native-async-storage/async-storage`; hydrate the four
   `useState` cells in `StoreProvider` on mount, write back on change, gate first render on
   a `hydrated` flag. Every feature from here inherits this. ~1 hour now, a migration later.
3. **Pass `placeId`, not the whole `place` object.** `navigation.navigate('PlaceDetail', { place: p })`
   works only because `require()` ids happen to serialise. Deep links, notifications and
   persisted state all arrive with an id and no object. `findPlaceById(id)` already exists
   at [mockData.js:707](src/data/mockData.js#L707) with **zero callers**.
4. **A data seam.** `src/data/repository.js` exporting `async getPlaces()` /
   `getPlacesByCategory(id)` / `getPlaceById(id)` resolved from `mockData`. Costs almost
   nothing today; it's the entire backend migration later. Right now nothing is awaited, so
   no screen has a loading or error path.
5. **Fill `src/components/`.** Start with `PlaceCard` (written 4× — Home carousel, Home row,
   CategoryList grid, Map sheet), `SearchBar` (4×), `ScreenHeader` + `iconBtn` (3×), `Chip` (2×).
   Plus `src/theme/common.js` with `makeCommonStyles(colors)` for the identical `container`
   and card-surface blocks.

**Data model fixes that unblock features:**

- Put `kind` and `color` on the **source** records in `mockData.js` instead of only on
  `allMapPlaces`. Today a place opened from CategoryList has no `color`, so
  [store.js:70](src/store.js#L70) falls back to `#1D2BEF` — the same place gets a different
  timeline color depending on which screen added it.
- Add a numeric `priceTier: 0|1|2|3`. The Budget sort uses `price?.length`, so `'Free'` (4)
  and `'5 TND'` (5) sort as *more expensive* than `'$$$'` (3).
- Move `categoryData` out of [CategoryListScreen.js:34-40](src/screens/CategoryListScreen.js#L34-L40)
  into the data layer so it can't drift from `categories` — that drift is why `beach`
  silently falls back to `featuredPlaces`.
- Three coincident-coordinate duplicate pairs, not two: `1`/`a4` (Old Port), `2`/`n4`
  (Cap Blanc), `3`/`n3` (Ichkeul). On the map one of each pair is permanently unclickable.

**Feature gaps, most central first** (see [docs/CLAUDE.md](docs/CLAUDE.md) for the full
diagram-vs-code table):

1. **Accounts / auth** — the MCD hangs `FAVORI`, `AVIS` and `ITINERAIRE_ITEM` off `id_user`.
   Nearly every other gap depends on this. Even without a backend, put a `user` object in
   the store now and read Profile's fields from it.
2. **User-authored reviews** — `reviews` is only an integer count; the two cards are
   module-level demos shown on all 30 places.
3. **Multi-day itinerary** — the store holds one flat undated array, but the Mon–Sun strip
   with hardcoded dates 10–16 and `const active = i === 2` promises otherwise. The most
   misleading control in the app.
4. **Global search** — works only inside one category. Two of the three search bars are inert.
5. **Multi-city** — `ChooseCity` looks complete but throws the selection away; there's no
   `city` field in the store and all 30 places are Bizerte.
6. **A favorites screen** — favorites are writable from two places and readable from none.
7. **Beach category data** — cheapest visible gap. The content exists but is misfiled:
   Corniche (`4`), Rimel (`n1`), La Grotte (`n2`).
8. **Editing an itinerary row** — `addBlankActivity` creates "Tap to edit" rows with no
   `onPress`. Nothing to tap.
9. **Reordering** — `react-native-gesture-handler` and `reanimated` are already installed
   and unused, so the machinery is paid for.
10. **Opening hours** — no `hours` field anywhere, yet PlaceDetail shows a green "Open now"
    on every place at every hour.
11. **Geolocation** — "Nearby" is just `featuredPlaces.map` with no distance math, and the
    locate FAB recenters on `CITY_CENTER`, not the user. `expo-location` isn't installed.
12. **RTL for Arabic** — all 78 keys are translated and `rtl: true` is set, but nothing reads
    the flag. No `I18nManager`, no `forceRTL`. Translation done, layout not started.
13. **Gallery lightbox** — gallery images aren't touchable; the hero's 3 dots imply a
    swipeable carousel that doesn't exist.

**Also worth knowing:** [MapScreen.js:41](src/screens/MapScreen.js#L41) destructures `mode`
and never uses it — which is why the map tiles stay light in dark mode while all the chrome
around them goes dark. There's no `customMapStyle`.

---
