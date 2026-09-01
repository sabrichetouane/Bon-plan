// ============================================================================
// theme/colors.js - CENTRALIZED DESIGN TOKENS
// One source of truth for every color, spacing and radius in the app.
// We export TWO palettes (light and dark) and a hook so screens can read the
// current one and re-render when the user flips the switch in Profile.
// ============================================================================

import { createContext, useContext } from 'react';

// React Context is a way to share values with ANY descendant without passing
// them down as props at every level. We create the box here; StoreProvider
// (in store.js) puts the active theme inside it at app start.
export const ThemeContext = createContext(null);

// ---------------------------------------------------------------------------
// LIGHT PALETTE (default - what users see before they toggle dark mode)
// ---------------------------------------------------------------------------
export const lightColors = {
  primary:        '#1D2BEF',   // blue used for CTAs, selected tabs, links
  primaryDark:    '#0E1BCF',   // deeper blue for gradients
  primaryLight:   '#5461FF',   // slightly lighter version of primary
  primarySoft:    '#E8EAFE',   // very faint blue for backgrounds of active chips
  accent:         '#FFC542',   // yellow accent for highlights
  background:     '#FFFFFF',   // main screen background
  surface:        '#F6F7FB',   // subtle gray for inputs and grouped areas
  card:           '#FFFFFF',   // card background (usually same as background in light)
  text:           '#0F1226',   // primary text color - near-black
  textSecondary:  '#6B7080',   // grey for less important text
  textMuted:      '#9AA0B4',   // faded grey for placeholders and small labels
  border:         '#EDEFF5',   // hairline borders between rows/cards
  success:        '#22C55E',   // green - Added/Open indicators
  warning:        '#F59E0B',   // orange - caution
  danger:         '#EF4444',   // red - favorite heart, errors
  star:           '#F5B93B',   // gold for rating stars
  overlay:        'rgba(15, 18, 38, 0.55)', // dark semi-transparent for modal bgs
  chipActive:     '#1D2BEF',   // active filter chip background
  chipIdle:       '#F1F2F7',   // idle filter chip background
  mapBackdrop:    '#E8EEF4',   // color behind map while tiles load
};

// ---------------------------------------------------------------------------
// DARK PALETTE - mirror of light, but inverted brightness
// When user picks "Dark" in Profile, useTheme() returns these instead.
// ---------------------------------------------------------------------------
export const darkColors = {
  primary:        '#6D78FF',   // brighter blue - stands out on dark bg
  primaryDark:    '#5461FF',
  primaryLight:   '#8A93FF',
  primarySoft:    '#1E2440',   // dark blue-grey for selected chip bg
  accent:         '#FFC542',
  background:     '#0B0C14',   // near-black main background
  surface:        '#14161F',   // slightly lighter dark grey
  card:           '#1A1C28',   // card surfaces pop against background
  text:           '#F3F4F8',   // near-white main text
  textSecondary:  '#B5B8C7',
  textMuted:      '#7A7F93',
  border:         '#262937',
  success:        '#34D399',
  warning:        '#FBBF24',
  danger:         '#F87171',
  star:           '#F5B93B',
  overlay:        'rgba(0, 0, 0, 0.6)',
  chipActive:     '#6D78FF',
  chipIdle:       '#1E2030',
  mapBackdrop:    '#14161F',
};

// Backwards-compatible static export - some older files still do
// `import { colors } from '../theme/colors'`. They will always see LIGHT.
// New code should always call useColors() or useTheme() instead.
export const colors = lightColors;

// Spacing system - use these constants everywhere instead of magic numbers.
// Keeps the whole app consistent; change one value here to adjust globally.
export const spacing = {
  xs: 4,   // tiny gaps
  sm: 8,   // small padding
  md: 12,  // default inner spacing
  lg: 16,  // section spacing
  xl: 24,  // screen edge padding
  xxl: 32, // big section gaps
};

// Border radius tokens - ditto. Pill = fully rounded (hero buttons, chips).
export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

// ---------------------------------------------------------------------------
// TOUCH TARGETS
//
// Apple asks for at least 44x44 points and Google for 48x48 density-pixels
// before a button is comfortable to tap. Small icon buttons in this app were
// 28-40pt, which looks fine but is genuinely hard to hit one-handed.
//
// The RIGHT fix is to make the pressable area itself 44pt while keeping the
// visible circle small - that is what components/IconButton.js does.
//
// hitSlopFor() is a fallback for text-only buttons. It returns the invisible
// extra margin that catches taps just outside the element.
// WARNING: on Android, hitSlop that reaches outside the PARENT view is
// ignored, so it only helps when the parent row is already tall enough.
// ---------------------------------------------------------------------------
export const MIN_TAP = 44;

// hitSlopFor(38) -> 3 on every side, which grows a 38pt button to 44pt.
// `max` caps the padding when a neighbouring button is close and the two
// slop areas would otherwise overlap.
export function hitSlopFor(size, max = Infinity) {
  const pad = Math.min(max, Math.max(0, Math.ceil((MIN_TAP - size) / 2)));
  return { top: pad, bottom: pad, left: pad, right: pad };
}

// ---------------------------------------------------------------------------
// HOOKS - read them inside any function component to get the current palette.
// ---------------------------------------------------------------------------

// Returns only the colors object. Good for screens that just need colors.
export function useColors() {
  const ctx = useContext(ThemeContext);      // read whatever ThemeProvider put in the context
  return ctx?.colors || lightColors;         // fallback = light (so code never crashes on null)
}

// Returns colors + mode + setters. Use this in Profile where user toggles theme.
export function useTheme() {
  const ctx = useContext(ThemeContext);
  return {
    colors: ctx?.colors || lightColors,
    mode:   ctx?.mode   || 'light',
    setMode: ctx?.setMode || (() => {}),     // noop if Provider missing
    toggle:  ctx?.toggle  || (() => {}),
  };
}
