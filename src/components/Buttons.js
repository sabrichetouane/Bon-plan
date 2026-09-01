// ============================================================================
// components/Buttons.js - THE THREE BUTTON STYLES OF THE APP
//
// PrimaryButton    solid blue, for the main action ("Log in", "Save")
// SecondaryButton  outlined, for the softer choice ("Directions", "Cancel")
// PressableText    a plain text link ("See all", "Skip", "Forgot password?")
//
// Keeping them here means every button in every new screen automatically
// matches the ones already in the app - same colour, same height, same radius.
//
// All three grow their own tap area to 44pt, which is the minimum size a
// finger can hit reliably. The old "See all" links were about 45x17pt, so
// taps mostly missed them - one of the reasons those buttons felt "broken".
// ============================================================================

import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing, MIN_TAP } from '../theme/colors';
import { useRTL } from '../theme/rtl';

// ===========================================================================
// PrimaryButton - the solid blue call to action
// ===========================================================================
//   title     the label
//   onPress   what to run when tapped
//   icon      optional Ionicons name shown before the label
//   loading   true -> show a spinner and block further taps
//   disabled  true -> greyed out and not tappable
//   variant   'primary' (blue) | 'danger' (red, for destructive actions)
//   full      true (default) -> stretch to the full width of its parent
export function PrimaryButton({
  title,
  onPress,
  icon,
  loading = false,
  disabled = false,
  variant = 'primary',
  full = true,
  style,
  ...rest
}) {
  const { colors } = useTheme();
  const rtl = useRTL();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // While loading we must also block taps, otherwise a double tap submits a
  // form twice - which would create two accounts, two comments, and so on.
  const isBlocked = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isBlocked}
      style={[
        styles.primary,
        rtl.row,
        variant === 'danger' && styles.primaryDanger,
        full && styles.full,
        isBlocked && styles.blocked,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      {...rest}
    >
      {loading ? (
        // ActivityIndicator is React Native's built-in spinner.
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        // A Fragment (<>...</>) groups two elements without adding a real View.
        <>
          {icon && <Ionicons name={icon} size={18} color="#fff" style={styles.iconLeft} />}
          <Text style={styles.primaryText} numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ===========================================================================
// SecondaryButton - outlined, for the less important of two choices
// ===========================================================================
export function SecondaryButton({
  title,
  onPress,
  icon,
  disabled = false,
  full = true,
  style,
  ...rest
}) {
  const { colors } = useTheme();
  const rtl = useRTL();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.secondary, rtl.row, full && styles.full, disabled && styles.blocked, style]}
      accessibilityRole="button"
      {...rest}
    >
      {icon && <Ionicons name={icon} size={18} color={colors.primary} style={styles.iconLeft} />}
      <Text style={styles.secondaryText} numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// ===========================================================================
// PressableText - a text link with a proper tap area
// ===========================================================================
//   tone  'primary' (blue link) | 'muted' (grey, e.g. "Skip") | 'danger'
export function PressableText({ title, onPress, tone = 'primary', style, ...rest }) {
  const { colors } = useTheme();
  const rtl = useRTL();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const toneStyle =
    tone === 'muted' ? styles.linkMuted : tone === 'danger' ? styles.linkDanger : styles.linkPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      // The padding here is what creates the 44pt tap area. It is invisible,
      // but it is the difference between a link that responds and one that
      // seems dead. negative margins keep the visual spacing unchanged.
      style={[styles.link, style]}
      accessibilityRole="button"
      {...rest}
    >
      <Text style={toneStyle}>{title}</Text>
    </TouchableOpacity>
  );
}

// ===========================================================================
// ButtonRow - two buttons side by side, sharing the width evenly.
// Used by the sticky footer on the place detail screen.
// ===========================================================================
export function ButtonRow({ children, style }) {
  const { colors } = useTheme();
  const rtl = useRTL();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={[styles.row, rtl.row, style]}>{children}</View>;
}

const makeStyles = (colors) =>
  StyleSheet.create({
    // --- shared ---
    full: { alignSelf: 'stretch' },   // stretch across the parent's width
    blocked: { opacity: 0.5 },
    // No marginRight here: the parent uses `gap`, which already mirrors
    // correctly with flexDirection row-reverse.
    iconLeft: {},

    // --- primary ---
    primary: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      // minHeight rather than height, so the button grows if the user has
      // large text turned on instead of clipping the label.
      minHeight: MIN_TAP,
    },
    primaryDanger: { backgroundColor: colors.danger },
    primaryText: { color: '#fff', fontWeight: '600', fontSize: 15 },

    // --- secondary ---
    secondary: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      minHeight: MIN_TAP,
    },
    secondaryText: { color: colors.primary, fontWeight: '600', fontSize: 15 },

    // --- text link ---
    link: {
      minHeight: MIN_TAP,
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
      // Pull the invisible padding back in so the link still LOOKS like it sits
      // flush with its neighbours, while remaining 44pt tall to a finger.
      marginHorizontal: -spacing.sm,
    },
    linkPrimary: { color: colors.primary, fontWeight: '600', fontSize: 13 },
    linkMuted: { color: colors.textSecondary, fontWeight: '500', fontSize: 14 },
    linkDanger: { color: colors.danger, fontWeight: '600', fontSize: 14 },

    // --- row ---
    row: { flexDirection: 'row', gap: 10 },
  });
