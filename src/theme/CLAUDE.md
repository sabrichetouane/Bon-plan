# Design System — Bon Plan Bizerte

Everything visual comes from [colors.js](colors.js). This file is the reference so new
screens look like the existing ones without re-reading every screen.

Identity: **deep blue `#1D2BEF`** (Mediterranean + tech), white surfaces, generous rounding,
hairline borders instead of heavy shadows, Ionicons throughout.

---

## 1. How to consume the theme

```js
import { useTheme, radius, spacing } from '../theme/colors';

export default function MyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <SafeAreaView style={styles.container}>...</SafeAreaView>;
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
```

`spacing` and `radius` are **static** — import them directly, they never change with theme.
`colors` is **dynamic** — it must come from the hook.

| Hook | Returns |
| --- | --- |
| `useColors()` | just the active palette |
| `useTheme()` | `{ colors, mode, setMode, toggle }` — `mode` is `'light' \| 'dark'` |

`export const colors = lightColors` is a **legacy static export**. Only `SplashScreen`,
`Onboarding1` and `Onboarding2` still use it; they will not react to dark mode.

---

## 2. Color tokens

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `primary` | `#1D2BEF` | `#6D78FF` | CTAs, active tab, links, active chips, prices |
| `primaryDark` | `#0E1BCF` | `#5461FF` | gradient stops |
| `primaryLight` | `#5461FF` | `#8A93FF` | — (available, unused) |
| `primarySoft` | `#E8EAFE` | `#1E2440` | city pill bg, category circle idle, selected row bg |
| `accent` | `#FFC542` | `#FFC542` | — (available, unused) |
| `background` | `#FFFFFF` | `#0B0C14` | screen background |
| `surface` | `#F6F7FB` | `#14161F` | search bars, icon buttons, image placeholders |
| `card` | `#FFFFFF` | `#1A1C28` | cards, tab bar, footers |
| `text` | `#0F1226` | `#F3F4F8` | titles, primary text |
| `textSecondary` | `#6B7080` | `#B5B8C7` | body, chip label idle, meta |
| `textMuted` | `#9AA0B4` | `#7A7F93` | placeholders, small labels, chevrons |
| `border` | `#EDEFF5` | `#262937` | hairline card + row borders, idle dots |
| `success` | `#22C55E` | `#34D399` | "Open now" |
| `warning` | `#F59E0B` | `#FBBF24` | — |
| `danger` | `#EF4444` | `#F87171` | filled heart, notification dot, logout |
| `star` | `#F5B93B` | `#F5B93B` | rating stars (same in both modes) |
| `overlay` | `rgba(15,18,38,0.55)` | `rgba(0,0,0,0.6)` | hero image scrim |
| `chipActive` | `#1D2BEF` | `#6D78FF` | — (screens use `primary` directly) |
| `chipIdle` | `#F1F2F7` | `#1E2030` | filter chip background |
| `mapBackdrop` | `#E8EEF4` | `#14161F` | behind the map while tiles load |

**Marker / itinerary colors** live in `mockData.js`, not here — they are per-category:
featured `#1D2BEF` · food `#F59E0B` · coffee `#8B5CF6` · nature `#22C55E` ·
activity `#06B6D4` · shopping `#EF4444`.

---

## 3. Spacing & radius

```js
spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
radius  = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 }
```

| Value | Where |
| --- | --- |
| `spacing.xl` (24) | **screen horizontal padding — always** |
| `spacing.lg` (16) | section gaps, banner inner padding |
| `spacing.md` (12) | search-bar inner padding, header bottom padding |
| `spacing.sm` (8) | small gaps |
| `radius.md` (12) | search bars, buttons, list cards, day tiles, thumbnails |
| `radius.lg` (18) | feature cards (popular / grid), banner |
| `radius.pill` (999) | city pill, filter chips |
| `28` / `19` / `20` / `14` | hand-set circles (category 56px, icon btn 38px, bell 40px, fav 28px) |

---

## 4. Type scale

| Size / weight | Color | Role |
| --- | --- | --- |
| 28 / `600` | `#fff` | Splash wordmark |
| 22 / `700` | `text` | Onboarding title |
| 20 / `700` | `text` | ChooseCity title (centered) |
| 17 / `700` | `text` | Stack screen title (CategoryList, Itinerary) |
| 16 / `700` | `text` | Section header ("Popular", "Nearby") |
| 15 / `700` | `#fff` | Banner title |
| 15 / `600` | `#fff` | Primary button label |
| 15 / `500` | `text` | List row label (city row, settings row) |
| 14 / `700` | `text` | List-card place name |
| 14 / regular | `text` | TextInput value |
| 13 / `700` | `text` | Grid / carousel card name |
| 13 / `600` | `primary` | "See all" |
| 12 / `700` | `primary` | Price |
| 12 / `600` | `textSecondary` | Filter chip label |
| 12 / `500` | `text` | Category label under the circle |
| 11 / `600` | `text` | Rating tag |
| 11 / regular | `textMuted` | Meta line (location, category · price) |
| 11 / `700`, `letterSpacing: 1` | `textMuted` | **Uppercase section label** (`POPULAR CITIES`, `APPEARANCE`, `SETTINGS`, `ABOUT`) |

Line heights are only set where text wraps: onboarding subtitle `22`, banner sub `18`,
splash title `34`.

---

## 5. Elevation

Everything **except MapScreen** is flat + hairline border, never shadowed:

```js
{ borderWidth: 1, borderColor: colors.border }
```

`MapScreen` is the exception — its controls float over the map, so they use shadow
instead of borders. The four recipes in the codebase:

```js
// Splash logo card — the only offset shadow
{ shadowColor:'#000', shadowOpacity:0.12, shadowRadius:16,
  shadowOffset:{ width:0, height:8 }, elevation:10 }

// Map floating controls (circleBtn, searchBar)
{ shadowColor:'#000', shadowOpacity:0.12, shadowRadius:6,  elevation:4 }

// Map filter chips
{ shadowColor:'#000', shadowOpacity:0.08, shadowRadius:4,  elevation:2 }

// Map bottom sheet
{ shadowColor:'#000', shadowOpacity:0.10, shadowRadius:10, elevation:8 }
```

Always set **both** `shadow*` (iOS) and `elevation` (Android).

---

## 6. Gradients

Only one, on `SplashScreen`:

```js
<LinearGradient colors={['#0E1BCF', '#1D2BEF', '#3A46FF']} style={styles.container}>
```

Top-to-bottom (default `start`/`end`). Overlaid with two `width * 1.2` circles at
`rgba(255,255,255,0.08)` and `rgba(255,255,255,0.06)`.

---

## 7. Component recipes

Copy these rather than inventing new ones.

**Screen shell**
```js
<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
```

**Header bar** (back · title · action) — `CategoryListScreen`, `ItineraryScreen`
```js
header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
          paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md },
iconBtn:{ width:38, height:38, borderRadius:19, backgroundColor: colors.surface,
          alignItems:'center', justifyContent:'center' },
title:  { fontSize:17, fontWeight:'700', color: colors.text },
```

**Search bar**
```js
{ flexDirection:'row', alignItems:'center', marginHorizontal: spacing.xl,
  backgroundColor: colors.surface, borderRadius: radius.md,
  paddingHorizontal: spacing.md, height: 46, gap: 8 }
```
Ionicons `search` (18, `textMuted`) left; `close-circle` clear button appears when non-empty.

**Filter chip**
```js
chip:       { paddingHorizontal:14, paddingVertical:8, borderRadius: radius.pill,
              backgroundColor: colors.chipIdle },
chipActive: { backgroundColor: colors.primary },
chipText:   { color: colors.textSecondary, fontSize:12, fontWeight:'600' },
chipTextActive: { color:'#fff' },
```

**Card — grid (2-col)** `radius.lg`, `borderWidth:1`, image `height:130`, body `padding:10`.
**Card — carousel** `width:170`, `radius.lg`, image `height:110`.
**Card — list row** `flexDirection:'row'`, `radius.md`, `padding:10`, thumb `78×78 / radius.md`,
`marginBottom:10`.
All three: `backgroundColor: colors.card`, `borderColor: colors.border`, `overflow:'hidden'`.

**Rating tag** (over image, top-left)
```js
{ position:'absolute', top:8, left:8, backgroundColor:'rgba(255,255,255,0.9)',
  paddingHorizontal:8, paddingVertical:3, borderRadius:12,
  flexDirection:'row', alignItems:'center', gap:4 }
```

**Favorite button** (over image, top-right) — `28×28`, `borderRadius:14`,
`backgroundColor:'rgba(0,0,0,0.4)'`, heart 16px, `#fff` idle / `colors.danger` active.

**Section header**
```js
{ flexDirection:'row', justifyContent:'space-between', alignItems:'center',
  paddingHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.md }
```
Left `16/700 text`, right "See all" `13/600 primary`.

**Uppercase group label** — `11/700`, `letterSpacing:1`, `textMuted`, `marginHorizontal: spacing.xl`.

**Primary CTA** — `backgroundColor: colors.primary`, `paddingVertical:14`,
`borderRadius: radius.md`, centered, label `15/600 #fff`.

**Sticky footer** (PlaceDetail, ChooseCity) — absolutely positioned,
`padding: spacing.xl`, `backgroundColor: colors.card`, `borderTopWidth:1`.

**Progress dots** — `8×8 / radius 4`, `colors.border`; active becomes `width:22`,
`colors.primary`. (PlaceDetail's hero dots are a smaller variant: `6×6`,
`rgba(255,255,255,0.55)`, over the image.)

**Empty state** — centered, Ionicons 34–40 in `textMuted`, label `textMuted / 500`,
`marginTop:80`.

**Map bottom sheet** — pinned to `bottom:0`, `borderTopLeftRadius/RightRadius: 22`,
`padding: spacing.lg` / `paddingTop: spacing.sm`, `backgroundColor: colors.card`, with a
`44×5 / radius 3` `colors.border` handle centered above the content. Thumb `54×54`,
`radius.md`. Right-hand "go" circle `44×44` tinted with the place's own `color`.

**Map marker** — `30×30`, `borderRadius:15`, `borderWidth:2` white, filled with the
place's category `color`, Ionicons 14px `#fff` inside. Selected marker gets
`transform:[{ scale: 1.15 }]`.

> MapScreen's chips differ from CategoryList's: they sit on `colors.card` (not `chipIdle`),
> label is `colors.text`, and they carry an icon + `gap: 6`. Keep the two variants distinct —
> one floats over a map, one sits on a page.

---

## 8. Layout conventions

- Vertical scroll: `<ScrollView showsVerticalScrollIndicator={false}>`, except
  `CategoryListScreen` which uses `FlatList` with `numColumns={2}` and `gap: 12`.
- Horizontal carousels: `<ScrollView horizontal showsHorizontalScrollIndicator={false}>`
  with `contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 14 }}`. **No snapping.**
- Images: hero `height:300`, grid `130`, carousel `110`, list thumb `78`, gallery `130×90`.
  Always give them `backgroundColor: colors.surface` as a load placeholder.
- Tab bar: `height:64`, `paddingTop:8`, `paddingBottom:10`, `backgroundColor: colors.card`.
- `StatusBar style="auto"` set once in `App.js`.

## 9. Animation

Almost none. The only motion is the map camera:

```js
mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 500);
```

Plus a static `transform: [{ scale: 1.15 }]` on the selected marker.
`react-native-reanimated` is installed but **not used** — no `Animated` imports anywhere.
