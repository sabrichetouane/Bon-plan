// ============================================================================
// components/Chip.js - THE PILL-SHAPED FILTER BUTTON
//
// Two screens used these with slightly different looks:
//   Category list - flat grey pill on the page
//   Map           - white pill with a shadow, floating over the map, with an icon
// Both are here, chosen with the `variant` prop.
//
// A NOTE ON THE OLD BUG: the chips stored their identity as an English word
// ('All', 'Top rated'). The LABEL was translated but the VALUE was not, so the
// code compared a translated label against an English constant. This component
// keeps `id` (never shown, never translated) separate from `label` (shown and
// translated), which is what stops that class of bug.
// ============================================================================

import React, { useMemo } from 'react';
// TouchableOpacity is a wrapper that dims slightly while pressed - the cheapest
// way to give a custom-drawn control the feedback a real button has.
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
// The single icon set used across the whole app (house rule: Ionicons only).
import { Ionicons } from '@expo/vector-icons';
// MIN_TAP is the 44pt minimum touch target from the accessibility guidelines.
import { useTheme, radius, MIN_TAP } from '../theme/colors';
// Mirrors row direction and text alignment when the language is Arabic.
import { useRTL } from '../theme/rtl';

// ---------------------------------------------------------------------------
// Props:
//   label     the visible, translated text
//   icon      optional Ionicons name shown before the label
//   active    true -> filled blue with white text
//   onPress   what happens when tapped
//   variant   'flat' (on a page) | 'floating' (over the map, with shadow)
// ---------------------------------------------------------------------------
export default function Chip({
  label,                 // the text drawn inside the pill (already translated)
  icon,                  // optional Ionicons name, drawn before the label
  active = false,        // defaults to off, so callers only pass the selected one
  onPress,               // tap handler; without it the chip is decorative
  variant = 'flat',      // 'flat' on a page, 'floating' over the map
  style,                 // caller's extra styling, merged last so it wins
}) {
  const { colors } = useTheme();               // active palette (light or dark)
  const rtl = useRTL();                        // null-valued in EN/FR, so free there
  const styles = useMemo(() => makeStyles(colors), [colors]);  // rebuild only on theme change

  return (
    <TouchableOpacity
      onPress={onPress}
      // An ARRAY of styles, applied left to right - later entries overwrite
      // earlier ones. This is how the variants layer on top of the base shape.
      style={[
        styles.chip,                                                    // shared shape and padding
        variant === 'floating' ? styles.chipFloating : styles.chipFlat, // background + shadow
        active && styles.chipActive,                                    // `false && x` is false, which RN ignores
        rtl.row,                                                        // flips icon/label order in Arabic
        style,                                                          // caller's override, last
      ]}
      // Tells assistive technology this is a button, not plain text.
      accessibilityRole="button"
      // Tells a screen reader "this filter is currently on".
      accessibilityState={{ selected: active }}
    >
      {/* `icon ? (...) : null` renders the icon only when one was passed.
          React draws nothing for null, so the gap simply is not there. */}
      {icon ? (
        // White on the blue active pill, normal text colour otherwise.
        <Ionicons name={icon} size={14} color={active ? '#fff' : colors.text} />
      ) : null}
      {/* numberOfLines={1} keeps the pill one line tall: a long French or
          Arabic label is truncated with an ellipsis rather than wrapping and
          making one chip in the row taller than its neighbours. */}
      <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Style factory - takes the palette, returns the stylesheet. See the house rule
// in CLAUDE.md: any style naming a colour must be built per-render like this.
const makeStyles = (colors) =>
  StyleSheet.create({
    // The shape shared by both variants.
    chip: {
      flexDirection: 'row',        // icon and label side by side, not stacked
      alignItems: 'center',        // vertically centre them against each other
      gap: 6,                      // 6pt between icon and label, no margins needed
      paddingHorizontal: 14,       // breathing room at the ends of the pill
      paddingVertical: 9,          // and above/below the text
      borderRadius: radius.pill,   // a huge radius, which on a short box = a pill
      // minHeight, not height, so the pill grows with the phone's text size
      // instead of clipping the label. 38 + padding lands close to the 44pt
      // comfortable tap size.
      minHeight: 38,
      justifyContent: 'center',    // centres the pair horizontally when there is spare width
    },
    // Flat variant: a soft grey fill, no shadow, because it sits ON a page.
    chipFlat: { backgroundColor: colors.chipIdle },
    // Floating variant: card-coloured with a shadow, because it sits OVER the
    // map and needs to look like it is lifted off the surface.
    chipFloating: {
      backgroundColor: colors.card,
      shadowColor: '#000',         // iOS shadow: colour...
      shadowOpacity: 0.08,         // ...how dark...
      shadowRadius: 4,             // ...and how blurred
      elevation: 2,                // Android ignores shadow*, and reads this instead
    },
    // Selected state, for either variant: the brand blue takes over.
    chipActive: { backgroundColor: colors.primary },
    // Idle label: secondary grey, semi-bold so a small size stays legible.
    text: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    // Selected label: white, for contrast against the blue fill.
    textActive: { color: '#fff' },
  });
