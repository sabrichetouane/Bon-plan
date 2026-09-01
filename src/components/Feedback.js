// ============================================================================
// components/Feedback.js - THE SMALL "STATE" PIECES OF THE UI
//
// Four little components that every data-driven screen needs:
//
//   <Loading />       a spinner while the database is being read
//   <EmptyState />    "nothing here yet" with an icon and a hint
//   <SectionHeader /> "Popular" + "See all"
//   <StatusBadge />   the Pending / Hidden / Approved pill for moderation
//
// The old app had none of these, because nothing was ever loaded - the data
// was already in memory. Now that screens read from SQLite there is a real
// (if short) moment where there is nothing to show, and it needs to look
// deliberate rather than broken.
// ============================================================================

import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing } from '../theme/colors';
import { PressableText } from './Buttons';

// ===========================================================================
// Loading - a centred spinner.
// ===========================================================================
export function Loading({ label, style }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.centre, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={styles.loadingText}>{label}</Text> : null}
    </View>
  );
}

// ===========================================================================
// EmptyState - shown when a list has no rows.
// ===========================================================================
//   icon      Ionicons name
//   title     the main line
//   subtitle  the explanation / what to do about it
//   action    optional { label, onPress } for a link underneath
export function EmptyState({ icon = 'search', title, subtitle, action, style }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.empty, style]}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={colors.textMuted} />
      </View>

      <Text style={styles.emptyTitle}>{title}</Text>

      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}

      {action ? (
        <PressableText title={action.label} onPress={action.onPress} style={styles.emptyAction} />
      ) : null}
    </View>
  );
}

// ===========================================================================
// SectionHeader - a title on the left, an optional link on the right.
// ===========================================================================
export function SectionHeader({ title, actionLabel, onActionPress, style }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.sectionHeader, style]}>
      {/* flex:1 + numberOfLines: a long translated title shrinks instead of
          pushing the "See all" link off the right edge of the screen. */}
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {title}
      </Text>

      {actionLabel && onActionPress ? (
        <PressableText title={actionLabel} onPress={onActionPress} />
      ) : null}
    </View>
  );
}

// ===========================================================================
// StatusBadge - the little coloured pill saying Approved / Pending / Hidden.
// ===========================================================================
//   status  'approved' | 'pending' | 'hidden'
//   t       translator, so the word itself is localised
export function StatusBadge({ status, t = (k) => k, style }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Pick the colour and the icon that go with this status.
  // An object like this is tidier than a chain of if/else.
  const CONFIG = {
    approved: { color: colors.success, icon: 'checkmark-circle', key: 'status.approved' },
    pending: { color: colors.warning, icon: 'time', key: 'status.pending' },
    hidden: { color: colors.textMuted, icon: 'eye-off', key: 'status.hidden' },
  };

  // Unknown status -> fall back to pending rather than crashing on undefined.
  const config = CONFIG[status] || CONFIG.pending;

  return (
    <View style={[styles.badge, { backgroundColor: config.color + '22' }, style]}>
      {/* '22' appended to a hex colour is its alpha channel - about 13%
          opacity. It gives a soft tinted background from the same colour. */}
      <Ionicons name={config.icon} size={12} color={config.color} />
      <Text style={[styles.badgeText, { color: config.color }]}>{t(config.key)}</Text>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    centre: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    loadingText: { color: colors.textMuted, fontSize: 13 },

    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xxl * 1.5,
      gap: spacing.sm,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
    },
    emptyAction: { marginTop: spacing.sm },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      marginTop: spacing.xl,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      minWidth: 0,
    },

    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      alignSelf: 'flex-start',   // only as wide as its text, not the full row
    },
    badgeText: { fontSize: 11, fontWeight: '700' },
  });
