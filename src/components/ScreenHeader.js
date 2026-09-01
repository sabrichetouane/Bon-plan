// ============================================================================
// components/ScreenHeader.js - THE TOP BAR: back arrow, title, right action
//
// Written by hand on three screens before (Category list, Itinerary, Profile),
// each with its own copy of the same styles. Now there is one.
//
// RESPONSIVE FIX BUILT IN: the title gets flex:1 and numberOfLines={1}.
// Without those, a long title in French or Arabic pushes the right-hand button
// off the edge of the screen. React Native does NOT shrink text by default -
// flexShrink is 0 unless you say otherwise - so this has to be explicit.
// ============================================================================

import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
// spacing = the shared 4/8/12/16/24 scale; MIN_TAP = the 44pt touch minimum.
import { useTheme, spacing, MIN_TAP } from '../theme/colors';
import { useRTL } from '../theme/rtl';
// Reusing IconButton means both header buttons inherit its 44pt tap box for
// free, instead of this file re-solving the same problem.
import IconButton from './IconButton';

// ---------------------------------------------------------------------------
// Props:
//   title          the centred heading
//   onBack         if given, a back chevron appears on the left
//   rightIcon      Ionicons name for the right-hand button
//   onRightPress   what that button does
//   rightColor     colour for the right icon (e.g. red for an active heart)
//   subtitle       optional small line under the title
// ---------------------------------------------------------------------------
export default function ScreenHeader({
  title,           // the heading text, already translated by the caller
  onBack,          // PRESENCE of this prop is what decides the arrow exists
  rightIcon,       // same idea: no icon name means no right-hand button
  onRightPress,    // what the right button does when tapped
  rightColor,      // lets a caller turn an active heart red, for instance
  subtitle,        // optional small second line
  style,           // caller's override, merged last
}) {
  const { colors } = useTheme();
  // rtl mirrors the row and flips the back arrow when the language is Arabic.
  const rtl = useRTL();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    // rtl.row swaps the whole bar end-for-end in Arabic: back button on the
    // right, action on the left - which is where Arabic readers expect them.
    <View style={[styles.header, rtl.row, style]}>
      {/* LEFT. When there is no back button we still render an empty box of
          the same width, so the title stays visually centred instead of
          jumping left. This is a common trick for three-part headers. */}
      {onBack ? (
        // rtl.backIcon is 'chevron-back' in English, 'chevron-forward' in
        // Arabic - the arrow must point back toward where you came from.
        <IconButton name={rtl.backIcon} size={22} onPress={onBack} accessibilityLabel="Go back" />
      ) : (
        // The invisible placeholder that keeps the title centred.
        <View style={styles.spacer} />
      )}

      {/* MIDDLE - the title. flex:1 lets it take the leftover space and,
          crucially, lets it SHRINK when the text is long. */}
      <View style={styles.titleWrap}>
        {/* numberOfLines={1} is the other half of the fix: it truncates with
            an ellipsis instead of wrapping and making the header taller. */}
        <Text style={[styles.title, rtl.textCenter]} numberOfLines={1}>
          {title}
        </Text>
        {/* The subtitle only exists when a caller passes one. */}
        {subtitle ? (
          <Text style={[styles.subtitle, rtl.textCenter]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* RIGHT - same empty-box trick when there is no action. */}
      {rightIcon ? (
        <IconButton name={rightIcon} size={20} color={rightColor} onPress={onRightPress} />
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',                // the three parts sit side by side
      alignItems: 'center',                // vertically centred against each other
      paddingHorizontal: spacing.lg,       // 16 in from each screen edge
      paddingTop: spacing.sm,              // small gap below the safe-area inset
      paddingBottom: spacing.md,           // slightly more below, separating header from content
      gap: spacing.sm,                     // 8 between button, title and action
    },
    // Same width as an IconButton's tap box, so both sides balance.
    spacer: { width: MIN_TAP, height: MIN_TAP },
    titleWrap: {
      flex: 1,                 // take the middle, and shrink when needed
      alignItems: 'center',    // centre the title (and subtitle) inside that space
    },
    title: {
      fontSize: 17,            // the app's screen-title size
      fontWeight: '700',       // bold, so it reads as the page heading
      color: colors.text,      // primary text colour, follows the theme
      textAlign: 'center',     // centres the line itself within titleWrap
    },
    subtitle: {
      fontSize: 11,            // clearly secondary to the 17pt title
      color: colors.textMuted, // the faintest of the three text colours
      marginTop: 2,            // hairline gap so the two lines do not touch
      textAlign: 'center',
    },
  });
