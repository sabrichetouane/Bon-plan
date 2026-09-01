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
import { useTheme, spacing, MIN_TAP } from '../theme/colors';
import { useRTL } from '../theme/rtl';
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
  title,
  onBack,
  rightIcon,
  onRightPress,
  rightColor,
  subtitle,
  style,
}) {
  const { colors } = useTheme();
  // rtl mirrors the row and flips the back arrow when the language is Arabic.
  const rtl = useRTL();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.header, rtl.row, style]}>
      {/* LEFT. When there is no back button we still render an empty box of
          the same width, so the title stays visually centred instead of
          jumping left. This is a common trick for three-part headers. */}
      {onBack ? (
        <IconButton name={rtl.backIcon} size={22} onPress={onBack} accessibilityLabel="Go back" />
      ) : (
        <View style={styles.spacer} />
      )}

      {/* MIDDLE - the title. flex:1 lets it take the leftover space and,
          crucially, lets it SHRINK when the text is long. */}
      <View style={styles.titleWrap}>
        <Text style={[styles.title, rtl.textCenter]} numberOfLines={1}>
          {title}
        </Text>
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
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    // Same width as an IconButton's tap box, so both sides balance.
    spacer: { width: MIN_TAP, height: MIN_TAP },
    titleWrap: {
      flex: 1,                 // take the middle, and shrink when needed
      alignItems: 'center',
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
      textAlign: 'center',
    },
  });
