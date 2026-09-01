# src/components/ — Shared UI

This folder was empty. Every card, chip, header and search bar was written by
hand inside each screen — ~245 style keys copied across ten files. These are
the extractions. **Use them; don't write a new variant.**

## What's here

| Component | Export | Use it for |
| --- | --- | --- |
| [Screen.js](Screen.js) | default | The root of **every** screen. Handles safe areas. |
| [ScreenHeader.js](ScreenHeader.js) | default | Back arrow · title · right action |
| [IconButton.js](IconButton.js) | default | Any round icon button |
| [SearchField.js](SearchField.js) | default | Any search box |
| [FormField.js](FormField.js) | default | A labelled text input, with error + password eye |
| [PlaceCard.js](PlaceCard.js) | default | A place, in 3 shapes: `carousel`, `grid`, `row` |
| [Chip.js](Chip.js) | default | Filter pills, `flat` or `floating` |
| [AuthLayout.js](AuthLayout.js) | default | The frame for login / signup / reset |
| [Buttons.js](Buttons.js) | **named** | `PrimaryButton`, `SecondaryButton`, `PressableText`, `ButtonRow` |
| [Feedback.js](Feedback.js) | **named** | `Loading`, `EmptyState`, `SectionHeader`, `StatusBadge` |

Note the last two use **named** exports; the rest are default. Getting this
wrong gives a confusing "type is invalid" error at render time, not a build error.

## The three rules these encode

**1. `Screen`, never `SafeAreaView` from `react-native`.**
React Native's own `SafeAreaView` is defined as
`Platform.select({ ios: ..., default: View })` — it is a **plain View on
Android**. Every screen used it, so on every Android phone the headers drew
under the status bar. `Screen` wraps the one from `react-native-safe-area-context`,
which works on both.

```js
<Screen>                                          // tab screens (default edges)
<Screen edges={['top','left','right','bottom']}>  // pushed / full-page screens
<Screen edges={['bottom']}>                       // PlaceDetail: photo runs under the status bar
```

A tab screen must **not** include `'bottom'` — the tab bar already owns that
inset, and padding it twice leaves a dead strip.

**2. Tap targets are 44pt, without changing the design.**
`IconButton` makes the *pressable* an invisible 44×44 box and puts the visible
coloured circle inside it at its original 28/38/40pt. Looks identical, twice
the target.

Why not `hitSlop`? On Android, slop that reaches outside the **parent** view is
discarded. These buttons sit in tight 38pt header rows, so slop is dropped
exactly where it's needed. A real box always works. `hitSlopFor(size)` in
`theme/colors.js` is the fallback for glyph-only buttons whose parent is
already tall enough.

**3. Text in a row must be allowed to shrink.**
React Native defaults `flexShrink` to **0**, so a long French or Arabic string
does not shrink — it shoves its sibling off the screen. The pattern, baked into
these components:

```js
container: { flex: 1, minWidth: 0 }   // minWidth: 0 is the part people forget —
                                      // without it a flex child refuses to go
                                      // narrower than its own content
label:     { flexShrink: 1 }          // the side that gives way
value:     { flexShrink: 0 }          // the side that must stay readable
```
…plus `numberOfLines={1}` on the Text itself.

## Sizing

- **Never** a fixed `height` on a box containing text — use `minHeight`. The OS
  text-size setting multiplies `fontSize`, and a fixed height clips it.
- **Never** a static `lineHeight` under ~1.6× the font size. RN scales
  `fontSize` with the OS setting but leaves `lineHeight` alone, so lines collide.
- **Never** `Dimensions.get()` at module scope — it's frozen at import and never
  updates on rotation, foldables or split-screen. Use `useWindowDimensions()`.
- Prefer `aspectRatio` over a fixed image height.
- `paddingVertical: 0` on every `TextInput` — Android adds its own hidden
  padding on top of yours.

## Styling

Same factory pattern as the screens:

```js
export default function Thing({ ... }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  ...
}
const makeStyles = (colors) => StyleSheet.create({ ... });
```

Tokens only — `spacing.*`, `radius.*`, `colors.*` from
[../theme/colors.js](../theme/colors.js). See
[../theme/CLAUDE.md](../theme/CLAUDE.md) for the full palette and scale.
Ionicons only.

## Still worth extracting

`ProfileScreen`'s `Row` (settings line with icon/label/value/chevron) is
duplicated in shape by the admin dashboard's navigation rows.
