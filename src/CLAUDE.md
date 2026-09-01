# src/ — Code Map

15 files, ~3 660 lines. Flat structure, no component library, no tests.

```
src/
  App entry is ../App.js
  navigation/AppNavigator.js    98   stack + tabs, the only routing file
  screens/                    2378   10 full-screen components (one file each)
  data/mockData.js             709   all content — plays the role of a backend
  store.js                     140   global state via React Context
  i18n.js                      139   EN / FR / AR dictionary
  theme/colors.js              112   palettes + spacing + radius  → see theme/CLAUDE.md
```

`src/components/` **exists and is empty.** Every card, chip and header is re-implemented
inside its screen — ~245 style keys spread over ten separate `makeStyles(colors)`
factories, with zero shared view code. That's the single biggest source of duplication,
and the folder is already sitting there waiting. See
[Extracting shared components](#6-extracting-shared-components).

---

## 1. Navigation contract

Defined once in [navigation/AppNavigator.js](navigation/AppNavigator.js).
Root `Stack.Navigator`, `initialRouteName="Splash"`,
`screenOptions={{ headerShown: false, animation: 'fade' }}` — **every screen draws its own
header**.

| Route | Component | Params | Reached from |
| --- | --- | --- | --- |
| `Splash` | SplashScreen | — | app launch |
| `Onboarding1` | Onboarding1 | — | `replace` after 2200 ms |
| `Onboarding2` | Onboarding2 | — | `navigate` from Onboarding1 |
| `ChooseCity` | ChooseCity | — | `replace` from Onboarding1/2 Skip, or Onboarding2 Next; `navigate` from Profile |
| `Main` | `MainTabs` | — | `replace` from ChooseCity |
| `CategoryList` | CategoryListScreen | `{ category }` — a `categories[]` object | `navigate` from Home category circle |
| `PlaceDetail` | PlaceDetailScreen | `{ place }` — a **whole place object**, not an id | Home cards, CategoryList cards, Map bottom sheet |

`MainTabs` = `Tab.Navigator` with `Home` · `Map` · `Itinerary` · `Profile`.
Tab icons come from a literal `iconMap` in `AppNavigator.js`; labels from `t('tab.*')`.
Tab bar: `height: 64`, `paddingTop: 8`, `paddingBottom: 10`.

Cross-navigator jump (PlaceDetail → the Itinerary tab):
```js
navigation.navigate('Main', { screen: 'Itinerary' })
```

**Params carry full objects, not ids.** `mockData.js` exports `findPlaceById(id)` for the
id-based alternative, but no screen uses it yet. If you add deep links or persistence,
switch to ids and resolve via `findPlaceById`.

---

## 2. Store API — [store.js](store.js)

`StoreProvider` mounts **two** contexts: `ThemeContext` (imported from `theme/colors.js`)
and `StoreContext`. All state is plain `useState`; **nothing is persisted**.

```js
const {
  language, setLanguage, t,              // 'en' | 'fr' | 'ar'
  favorites, isFavorite, toggleFavorite, // Set<string> of place ids
  userItinerary, addToItinerary,         // seeded from mockData.itinerary
  removeFromItinerary, addBlankActivity,
} = useStore();

const t = useT();   // shortcut when you only need the translator
```

| Action | Signature | Behaviour |
| --- | --- | --- |
| `isFavorite` | `(id) => boolean` | `favorites.has(id)` |
| `toggleFavorite` | `(id) => void` | copies the `Set` so React sees a new reference |
| `addToItinerary` | `(place) => void` | dedupes on `placeId`; auto-picks a time **2 h after the last row**, capped at 22:00 |
| `removeFromItinerary` | `(id) => void` | filters by row id |
| `addBlankActivity` | `() => void` | appends "New activity" **1 h** after the last row |

Itinerary row shape:
```js
{ id, placeId?, time: 'HH:MM', title, subtitle, duration: '1h', color: '#RRGGBB' }
```

Theme lives in a separate `useMemo` so a theme flip doesn't invalidate the favorites/
itinerary object:
```js
const { colors, mode, setMode, toggle } = useTheme();
```

`useStore()` throws outside the provider; `useT()` degrades gracefully to `k => k`.

---

## 3. i18n — [i18n.js](i18n.js)

`LANGUAGES = [{ code, label, native, rtl }]` for `en` / `fr` / `ar`.
`dict` is a flat `'screen.thing'` → `{ en, fr, ar }` map — **78 keys**.
`translate(key, lang)` falls back `lang → en → the key itself`, so a missing key shows up
loudly in the UI.

Adding a string:
1. add the key to `dict` with **all three** translations,
2. use `t('your.key')` in the screen.

Dynamic keys are built by concatenation — `t('cat.' + cat.id)` in Home, `t(f.key)` in Map.
Grep for a key before deleting it; a static search will miss those.

`rtl: true` is set on Arabic but **`I18nManager.forceRTL` is never called** — Arabic
renders in an LTR layout today.

---

## 4. Screen-by-screen

| Screen | Lines | Store | i18n | Notes |
| --- | --- | --- | --- | --- |
| [SplashScreen.js](screens/SplashScreen.js) | 84 | — | — | `LinearGradient` + 2 blob circles, `setTimeout(2200)` → `replace('Onboarding1')`. Static `colors`. |
| [Onboarding1.js](screens/Onboarding1.js) | 87 | — | — | Map illustration built from `View`s. Skip → `replace('ChooseCity')`. Static `colors`. |
| [Onboarding2.js](screens/Onboarding2.js) | 86 | — | — | Person+suitcase illustration from `View`s. Next → `replace('ChooseCity')`. Static `colors`. |
| [ChooseCity.js](screens/ChooseCity.js) | 245 | — | — | 6 hardcoded cities, live `.includes()` filter, radio rows. Selection is **not saved**. |
| [HomeScreen.js](screens/HomeScreen.js) | 375 | `useT` | ✅ | City pill · search (inert) · category row · itinerary banner · Popular carousel (`slice(0,3)`) · Nearby list. |
| [CategoryListScreen.js](screens/CategoryListScreen.js) | 270 | ✅ | ✅ | `categoryData[id] \|\| featuredPlaces`. Search over `name`/`category`/`location`. Chips All/Top rated/Budget/Favorites. 2-col `FlatList`. |
| [PlaceDetailScreen.js](screens/PlaceDetailScreen.js) | 404 | ✅ | ✅ | Real `Linking` (tel:, maps:/geo:, website) + `Share`. Reviews are 2 hardcoded module-scope entries. |
| [MapScreen.js](screens/MapScreen.js) | 320 | `useT` | ✅ | `react-native-maps`, `PROVIDER_DEFAULT`, markers from `allMapPlaces`, `kind` chip filter, `animateToRegion(…, 500)`. |
| [ItineraryScreen.js](screens/ItineraryScreen.js) | 230 | ✅ | ✅ | Timeline rows, total-duration regex `/(\d+)\s*h\s*(\d+)?/`, weekday strip is decorative. |
| [ProfileScreen.js](screens/ProfileScreen.js) | 363 | ✅ | ✅ | Light/dark tiles, language `Alert` sheet, settings rows via a local `Row` sub-component. |

Rendering data: `CategoryListScreen` is the only `FlatList`; everything else is `ScrollView`.

---

## 5. Adding a new screen — checklist

1. `src/screens/MyScreen.js`, boxed `// ====` header comment explaining the screen.
2. `const { colors } = useTheme(); const styles = useMemo(() => makeStyles(colors), [colors]);`
3. Wrap in `<SafeAreaView style={styles.container}>`; horizontal padding `spacing.xl`.
4. Add every string to `i18n.js` in EN/FR/AR, render via `t()`.
5. Register in `AppNavigator.js` — root `Stack.Screen` for a pushed screen, `Tab.Screen`
   for a new tab (then add its `iconMap` entry and a `tab.*` translation key).
6. Reuse the recipes in [theme/CLAUDE.md](theme/CLAUDE.md) §7 rather than new styling.
7. Sanity-check it parses:
   ```bash
   node -e "require('@babel/core').transformSync(require('fs').readFileSync('src/screens/MyScreen.js','utf8'),{filename:'x.js',presets:['babel-preset-expo'],babelrc:false,configFile:false});console.log('ok')"
   ```

---

## 6. Extracting shared components

If you refactor, these are duplicated verbatim across screens and are the highest-value
extractions:

| Candidate | Currently duplicated in |
| --- | --- |
| `<ScreenHeader back title action />` | CategoryList, Itinerary (+ Map uses a floating variant) |
| `<SearchBar />` | Home, CategoryList, ChooseCity, Map |
| `<FilterChip />` | CategoryList, Map |
| `<PlaceCard variant="grid\|carousel\|row" />` | Home ×2, CategoryList, Map sheet |
| `<RatingTag />` / `<FavoriteButton />` | Home, CategoryList, PlaceDetail |
| `<SectionHeader title seeAll />` | Home ×2, PlaceDetail |
| `<PrimaryButton />` | Onboarding ×2, ChooseCity, PlaceDetail |
| The `Row` in [ProfileScreen.js:237](screens/ProfileScreen.js#L237) | already extracted — good model to copy |

A `src/components/` folder with those eight would cut roughly a third of the screen code.
