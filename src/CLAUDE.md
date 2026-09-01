# src/ — Code Map

~50 files. The app went from a static prototype to a full-stack local app: it
now has a SQLite database, accounts with roles, and admin moderation.

```
src/
  db/              the database layer          -> db/CLAUDE.md
  components/      shared UI                   -> components/CLAUDE.md
  theme/           colors, spacing, radius     -> theme/CLAUDE.md
  data/
    mockData.js       ONLY the seed now - no screen imports it
    assetRegistry.js  text key -> require(), and resolveImage()
  screens/         19 screens (5 of them under screens/admin/)
  navigation/AppNavigator.js
  store.js         global state, backed by the database
  i18n.js          242 keys × EN / FR / AR
```

---

## 1. Navigation

One stack, in [navigation/AppNavigator.js](navigation/AppNavigator.js).
`initialRouteName="Splash"`, `headerShown: false` everywhere — **each screen
draws its own header** (use `ScreenHeader`).

The app deliberately allows **guest browsing**, so there is no separate
"logged out" stack. `SplashScreen` waits for the database, then routes:
logged in → `Main`, otherwise → `Onboarding1`.

| Route | Params | Notes |
| --- | --- | --- |
| `Splash` | — | opens the DB, then redirects |
| `Onboarding1` / `Onboarding2` | — | Skip and Next both `replace` → `Login` |
| `ChooseCity` | `{ fromProfile? }` | `fromProfile` decides go-back vs continue |
| `Login` / `Signup` / `ForgotPassword` | — | |
| `ResetPassword` | `{ email }` | |
| `Main` | — | the bottom tabs |
| `CategoryList` | `{ category }` | a row from the `categories` table |
| `PlaceDetail` | `{ placeId }` | **an id, not the object** |
| `Favorites` `AddPlace` `MyPlaces` `MyPlans` | — | |
| `EditProfile` `ChangePassword` | — | |
| `AdminPlaces` `AdminPlans` `AdminComments` `AdminUsers` | — | admin only |

Tabs: `Home · Map · Itinerary · Profile`, plus **`Admin` only when
`isAdmin`** — the tab isn't rendered for anyone else.

Cross-navigator jump: `navigation.navigate('Main', { screen: 'Itinerary' })`.

> **Pass ids, not objects.** The old code put whole place objects in route
> params. It worked by luck (`require()` results are numbers, so they
> serialised). A deep link or notification arrives with an id and nothing else.

> **The tab bar must not set `height` or `paddingBottom`.**
> `getTabBarHeight` in `@react-navigation/bottom-tabs` returns a numeric
> `height` verbatim and **skips adding the safe-area inset**, and `tabBarStyle`
> is merged *after* the library's own `paddingBottom: insets.bottom`. Setting
> either one puts the icons inside the home indicator.

---

## 2. Store — [store.js](store.js)

Two contexts: `ThemeContext` (declared in `theme/colors.js` to avoid a circular
import) and `StoreContext`. State lives in React; every change is written
through a repository so it survives a restart.

```js
const {
  ready, user, userId, isAdmin, isLoggedIn,     // who is logged in
  signUp, logIn, logOut, refreshUser,
  language, setLanguage, t, city, setCity,      // preferences (saved to the user row)
  favorites, isFavorite, toggleFavorite,
  plan, userItinerary, addToItinerary, addBlankActivity,
  removeFromItinerary, updateItineraryItem, moveItineraryItem,
  clearItinerary, refreshPlan, openPlan,
} = useStore();

const t = useT();                                // translator only
const { isLoggedIn, isAdmin } = useAuth();       // auth only
```

`ready` is false until the database is open and the saved session restored.
`SplashScreen` waits on it.

Writes use **optimistic update**: change the screen immediately, save in the
background, roll back on failure. `toggleFavorite` is the clearest example.

`useStore()` throws outside the provider (a programming error, so it should be
loud). `useT()` degrades to returning the key.

---

## 3. i18n — [i18n.js](i18n.js)

242 keys, `'screen.thing'` → `{ en, fr, ar }`. `translate()` falls back
`lang → en → the key`, so a missing key is visible rather than blank.

Add a key to **all three** languages before using it.

Dynamic keys are built by concatenation — `t('cat.' + cat.id)`,
`t('error.' + result.error)`, `t('status.' + place.status)`. **Grep before
deleting a key**; a static search misses these.

`%s` in a message is filled with `.replace('%s', value)`.

`rtl: true` is set on Arabic but `I18nManager.forceRTL` is still never called —
Arabic renders in an LTR layout. Translation done, layout not started.

---

## 4. Screens

| Screen | Reads | Notes |
| --- | --- | --- |
| SplashScreen | store | Waits for `ready`, then routes |
| Onboarding1 / 2 | — | Illustrations sized from `useWindowDimensions` |
| ChooseCity | store | The choice now **saves** to the user row |
| **Login / Signup / ForgotPassword / ResetPassword** | userRepo | Share `AuthLayout` |
| HomeScreen | placeRepo | Search works; both "See all" links navigate |
| CategoryListScreen | placeRepo | Search + sort happen in SQL |
| PlaceDetailScreen | placeRepo, commentRepo | Real reviews; rating recalculated |
| MapScreen | placeRepo | Sheet dismissable; dark map style |
| ItineraryScreen | planRepo | Real week, editable rows, reordering |
| ProfileScreen | favoriteRepo, commentRepo | Real identity and counts |
| **FavoritesScreen** | placeRepo | Was missing entirely |
| **AddPlaceScreen** | placeRepo | Submissions go to the admin queue |
| **MyPlacesScreen** | placeRepo | Shows each submission's status |
| **MyPlansScreen** | planRepo | Multiple plans, public sharing |
| **EditProfileScreen / ChangePasswordScreen** | userRepo | |
| **screens/admin/** ×5 | all repos | Dashboard, places, plans, comments, users |

Bold = new. Every screen with a list uses `useFocusEffect` (not `useEffect`) so
it refreshes when you navigate back to it.

---

## 5. Adding a screen — checklist

1. `src/screens/MyScreen.js`, with a boxed `// ====` header comment.
2. Root element is `<Screen>` — see [components/CLAUDE.md](components/CLAUDE.md)
   for which `edges` to pass.
3. `const { colors } = useTheme(); const styles = useMemo(() => makeStyles(colors), [colors]);`
   — never a module-level `StyleSheet.create` that mentions colors.
4. Reuse the shared components. Don't restyle a card or a chip.
5. Tokens only: `spacing.xl` (24) for screen padding, `radius.*`, `colors.*`.
6. Every user-visible string via `t()`, added to EN/FR/AR first.
7. Read data through a `db/*Repo.js` function, never raw SQL.
8. `useFocusEffect(useCallback(() => { load(); }, [load]))` for lists.
9. Handle three states: `<Loading />`, `<EmptyState />`, and content.
10. Register it in `AppNavigator.js`.
11. Verify: `npx expo export --platform android` must bundle cleanly.

**Comments are part of the deliverable.** This is a PFE — the report and the
defence quote this source. Explain React Native concepts, not just business
logic, and say *why* rather than restating the code.
