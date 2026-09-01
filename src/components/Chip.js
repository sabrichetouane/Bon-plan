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
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, MIN_TAP } from '../theme/colors';
import { useRTL } from '../theme/rtl';

// ---------------------------------------------------------------------------
// Props:
//   label     the visible, translated text
//   icon      optional Ionicons name shown before the label
//   active    true -> filled blue with white text
//   onPress   what happens when tapped
//   variant   'flat' (on a page) | 'floating' (over the map, with shadow)
// ---------------------------------------------------------------------------
export default function Chip({ label, icon, active = false, onPress, variant = 'flat', style }) {
  const { colors } = useTheme();
  const rtl = useRTL();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        variant === 'floating' ? styles.chipFloating : styles.chipFlat,
        active && styles.chipActive,
        rtl.row,
        style,
      ]}
      accessibilityRole="button"
      // Tells a screen reader "this filter is currently on".
      accessibilityState={{ selected: active }}
    >
      {icon ? (
        <Ionicons name={icon} size={14} color={active ? '#fff' : colors.text} />
      ) : null}
      <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: radius.pill,
      // minHeight, not height, so the pill grows with the phone's text size
      // instead of clipping the label. 38 + padding lands close to the 44pt
      // comfortable tap size.
      minHeight: 38,
      justifyContent: 'center',
    },
    chipFlat: { backgroundColor: colors.chipIdle },
    chipFloating: {
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    chipActive: { backgroundColor: colors.primary },
    text: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    textActive: { color: '#fff' },
  });
