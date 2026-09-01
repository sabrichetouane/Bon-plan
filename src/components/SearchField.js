// ============================================================================
// components/SearchField.js - THE SEARCH BAR, WRITTEN ONCE
//
// The app had four nearly-identical search bars (Home, Category list, Choose
// city, Map). Two of them did not even work - they had no onChangeText, so
// typing did nothing. Writing the control once means fixing it once.
//
// TWO RESPONSIVE BUGS FIXED HERE:
//
// 1. `height: 46` became `minHeight: 46`.
//    When a user turns up the text size in their phone settings, React Native
//    multiplies every fontSize. A fixed `height` cannot grow, so the text gets
//    cut off. `minHeight` keeps the normal look but lets the box expand.
//
// 2. `paddingVertical: 0` on the TextInput.
//    Android's native text box adds its own invisible padding on top of ours,
//    which made the field taller than designed and pushed the text off-centre.
//    Setting it to 0 hands full control back to our own minHeight.
// ============================================================================

import React, { useMemo } from 'react';
// TextInput is the actual editable box; the View around it is only decoration.
import { StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// hitSlopFor(n) computes the invisible padding needed to bring an n-point icon
// up to the 44pt tap minimum.
import { useTheme, radius, spacing, hitSlopFor } from '../theme/colors';
import { useRTL } from '../theme/rtl';

// ---------------------------------------------------------------------------
// Props:
//   value          the current text (comes from the screen's state)
//   onChangeText   called on every keystroke with the new text
//   placeholder    grey hint shown when empty
//   onClear        if given, an X button appears once there is text
//   rightIcon      optional extra Ionicons name on the right (e.g. 'options-outline')
//   onRightIconPress  what that icon does
//   variant        'surface' (default, sits on a page) | 'card' (floats over the map)
//   style          extra styles for the outer box (margins, flex)
// ---------------------------------------------------------------------------
export default function SearchField({
  value,                    // CONTROLLED input: the screen owns the text, not the box
  onChangeText,             // fired on each keystroke with the full new string
  placeholder,              // grey hint, already translated by the caller
  onClear,                  // presence of this decides whether an X can appear
  rightIcon,                // optional second action on the trailing edge
  onRightIconPress,
  variant = 'surface',      // 'surface' on a page, 'card' floating over the map
  style,                    // outer-box overrides: margins, flex, width
  ...rest                   // forwarded to TextInput (autoFocus, onSubmitEditing...)
}) {
  const { colors } = useTheme();
  const rtl = useRTL();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Should the clear button be visible? Only when there IS text to clear
  // and the screen actually gave us something to do about it.
  // Boolean(...) collapses the two checks to a real true/false, so we never
  // accidentally render the empty string '' as a child.
  const showClear = Boolean(onClear && value);

  return (
    // rtl.row moves the magnifier to the right-hand side in Arabic, which is
    // the leading edge there.
    <View style={[styles.bar, variant === 'card' && styles.barCard, rtl.row, style]}>
      {/* The magnifying glass. Decorative, so it gets no accessibility label -
          the input beside it is what a screen reader should announce. */}
      <Ionicons name="search" size={18} color={colors.textMuted} />

      <TextInput
        style={[styles.input, rtl.text]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        // Placeholder colour is a separate prop, not a style - React Native
        // does not inherit it from the input's own `color`.
        placeholderTextColor={colors.textMuted}
        // Stop the keyboard auto-capitalising and autocorrecting search terms -
        // it fights the user when they type a place name.
        autoCapitalize="none"
        autoCorrect={false}
        // 'search' turns the keyboard's return key into a magnifying glass.
        returnKeyType="search"
        {...rest}
      />

      {/* The X button. `showClear && (...)` means "only render this if true". */}
      {showClear && (
        <TouchableOpacity
          onPress={onClear}
          // The icon is only 18pt, so we grow its tap area. The parent row is
          // 46pt tall, so this slop stays inside the parent and works on Android.
          hitSlop={hitSlopFor(18)}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* An optional extra button, e.g. the filter icon on the Home screen. */}
      {/* `!showClear` because the two share the same slot: while there is text
          to clear, the X wins - clearing is the more urgent action. */}
      {rightIcon && !showClear && (
        <TouchableOpacity
          onPress={onRightIconPress}
          hitSlop={hitSlopFor(18)}
          accessibilityRole="button"
        >
          <Ionicons name={rightIcon} size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',       // icon, input and buttons sit side by side
      alignItems: 'center',       // vertically centred against each other
      backgroundColor: colors.surface,   // the flat page variant
      borderRadius: radius.md,           // gently rounded, not a pill
      paddingHorizontal: spacing.md,     // 12 in from each end
      paddingVertical: spacing.sm,       // 8 above and below
      minHeight: 46,              // NOT height - see the note at the top
      gap: 8,                     // space between the children
    },
    // The map's search bar floats over the map, so it uses the card colour,
    // a fully round shape and a shadow instead of sitting flat on the page.
    barCard: {
      backgroundColor: colors.card,
      borderRadius: radius.pill,
      minHeight: 44,
      shadowColor: '#000',        // iOS shadow
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,               // elevation is Android's version of a shadow
    },
    input: {
      flex: 1,                    // take all the leftover width
      color: colors.text,         // typed text follows the theme
      fontSize: 14,
      paddingVertical: 0,         // see note 2 at the top of this file
    },
  });
