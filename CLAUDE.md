# Bon Plan Bizerte — Project Guide

Expo / React Native tourism-guide app for **Bizerte, Tunisia**, with a local
SQLite backend, user accounts and admin moderation.

Academic context: **PFE (Projet de Fin d'Études), BTS Informatique de Gestion**,
host company **Info Plus**. Repo: `sabrichetouane/Bon-plan`, branch `main`.

> **Read this first.** Deeper references live in nested `CLAUDE.md` files —
> see [Index](#4-index).

---

## 1. Run it

```bash
npm install
npx expo start        # press a (Android), i (iOS), or scan the QR with Expo Go
```

**Demo admin account:** `admin@bonplan.tn` / `admin123`

**Stack:** Expo SDK 54 · React 19.1.0 · React Native 0.81.5 ·
React Navigation 7 · `expo-sqlite` 16 · `expo-crypto` 15 ·
`react-native-maps` 1.20 · `expo-linear-gradient` · Ionicons.

Plain JavaScript. `tsconfig.json` exists but there are no `.ts` files — don't
introduce TypeScript without asking.

**MapScreen needs a device or Expo Go** — maps don't render in a web browser.

**Verify a change actually builds** — this catches broken imports and
unbundleable assets, which parsing alone will not:
```bash
npx expo export --platform android --output-dir .export-check && rm -rf .export-check
```

---

## 2. What the app does

```
Splash → Onboarding ×2 → Login ──┬─→ Main (tabs)
                                 └─→ "Browse without an account" (guest)
```

Tabs: **Home · Map · Itinerary · Profile**, plus **Admin** for admin accounts only.

**Anyone can:** browse 6 categories, search, open a place, see photos and
reviews, get directions, call, share.

**A logged-in user can:** favorite places (and see them in one list), write and
edit reviews, build multi-day plans with editable and reorderable activities,
submit new places, share a plan publicly, change theme / language / city —
**all of it saved** and restored on next launch.

**An admin can:** everything a user can, plus approve, hide or delete submitted
places, moderate shared plans and reviews, and promote or delete users.

**Moderation model:** a user's submission is `pending` and invisible until an
admin approves it. An admin's own submission is `approved` immediately. Hiding
keeps the row; deleting removes it.

---

## 3. Architecture

```
App.js
└── SafeAreaProvider                     device insets
    └── StoreProvider                    opens SQLite, restores the session
        └── AppNavigator
            ├── Splash · Onboarding · ChooseCity
            ├── Login · Signup · ForgotPassword · ResetPassword
            ├── Main → Tabs (Home · Map · Itinerary · Profile [· Admin])
            └── CategoryList · PlaceDetail · Favorites · AddPlace ·
                MyPlaces · MyPlans · EditProfile · ChangePassword · Admin×4

screens  ──calls──>  src/db/*Repo.js  ──SQL──>  SQLite file on the phone
```

**Screens never write SQL.** They call a repository. Swapping SQLite for a real
API would change only `src/db/`.

`src/data/mockData.js` is now **only the seed** — nothing imports it except
`db/seed.js`.

---

## 4. Index

| File | Covers |
| --- | --- |
| [src/CLAUDE.md](src/CLAUDE.md) | Routes, store API, i18n, screen map, add-a-screen checklist |
| [src/db/CLAUDE.md](src/db/CLAUDE.md) | Tables, moderation model, SQLite gotchas, how to test the SQL |
| [src/components/CLAUDE.md](src/components/CLAUDE.md) | The shared UI kit and the three rules it encodes |
| [src/theme/CLAUDE.md](src/theme/CLAUDE.md) | Colors, type scale, spacing, shadows, component recipes |
| [src/data/CLAUDE.md](src/data/CLAUDE.md) | The seed data and the asset registry |
| [docs/CLAUDE.md](docs/CLAUDE.md) | PFE deliverables: MCD, use-case & class diagrams, report generators |

---

## 5. House conventions

**1. Comments are part of the deliverable.** Every file opens with a boxed
`// ====` header. Explain *React Native concepts*, not just business logic —
the report and the jury defence quote this source. Say **why**, never restate
the code.

**2. Theme-aware styles via a factory.**
```js
const { colors } = useTheme();
const styles = useMemo(() => makeStyles(colors), [colors]);
...
const makeStyles = (colors) => StyleSheet.create({ ... });
```
Never a module-level `StyleSheet.create` that mentions colors. (`SplashScreen`
is the one exception — it is always blue and never reads the theme.)

**3. Tokens, not magic numbers.** `spacing.*` and `radius.*`. Screen edge
padding is always `spacing.xl` (24).

**4. Every user-visible string through `t()`**, added to EN/FR/AR first.

**5. Use the shared components.** `src/components/` exists now. Don't hand-roll
another card, chip, header or search bar.

**6. Ionicons only.**

**7. Images are text keys.** The DB stores `'real/oldport-1'`;
`resolveImage()` from `data/assetRegistry.js` turns it into an `<Image>` source.

---

## 6. Traps worth knowing

These caused real bugs here. The details are in the nested docs.

- **`SafeAreaView` from `react-native` is a no-op on Android.** Use `<Screen>`.
- **The tab bar must not set `height` or `paddingBottom`** — either one
  disables the library's safe-area handling.
- **`flexShrink` defaults to 0**, so long FR/AR text pushes siblings off screen
  instead of shrinking. Needs `flex: 1` + `minWidth: 0` + `numberOfLines`.
- **Fixed `height` clips text** when the OS text-size setting is raised. Use
  `minHeight`. Same for static `lineHeight`.
- **`Dimensions.get()` at module scope is frozen** at import. Use
  `useWindowDimensions()`.
- **SQLite ignores foreign keys** unless `PRAGMA foreign_keys = ON`.
- **`require()` returns a number** Metro assigns at build time — it cannot be
  stored in a database or rebuilt from a string.
- **Metro cannot bundle `.jfif`**, and it rejects a file whose contents aren't
  really an image (two such files exist in `assets/home/` — see
  [src/db/CLAUDE.md](src/db/CLAUDE.md)).
- **`useFocusEffect`, not `useEffect`**, for anything a list should re-read when
  you navigate back to it.

---

## 7. Still open

- **RTL layout for Arabic.** All 242 keys are translated and `rtl: true` is set,
  but nothing reads that flag — no `I18nManager.forceRTL`. Arabic renders LTR.
- **Place content is English only.** `name`, `subtitle` and `description` have no
  per-language variants, so switching language translates the chrome but not the
  places.
- **Geolocation.** "Nearby" doesn't compute distance and the map's locate button
  recenters on the city, not the user. `expo-location` isn't installed.
- **Opening hours.** No `hours` column, yet PlaceDetail shows "Open now" always.
- **Photo upload.** `AddPlaceScreen` picks from bundled photos; a real picker
  needs `expo-image-picker`. The DB column already accepts a `file://` URI.
- **Notifications.** No `expo-notifications`; the Profile row is informational.
- **Before an EAS build:** `app.json` has no
  `android.config.googleMaps.apiKey` (grey map on Android) and no location
  permission strings, and `babel.config.js` requires `react-native-worklets/plugin`
  which is not declared in `package.json` (it resolves only through Reanimated).
- `assetBundlePatterns: ["**/*"]` still bundles ~22 unused images (~4 MB).

---

## 8. Directories to ignore

The live app is `App.js` + `src/` + `assets/` + `docs/` (~20 MB, all committed).
`TravelApp/` and `pfeee/` are ~1.6 GB of abandoned scaffolds and an old backup —
**gitignored**, never edit, never import. Nothing in them is recoverable; the
backup predates `store.js`, `i18n.js` and `ProfileScreen.js`.

Two ideas from the old HTML prototype in `pfeee/` were never built and are still
worth considering: **audience-first browsing** ("Who are you going with?" →
Friends / Couple / Family) and a **"Discover Your Next Spot" randomizer**.

> Paths there contain spaces, parentheses and accents. Always quote them.
