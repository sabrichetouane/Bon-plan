// ============================================================================
// ProfileScreen.js - THE ACCOUNT AND SETTINGS TAB
//
// Sections, top to bottom:
//   - the avatar card: real name and email now, or a "log in" prompt for guests
//   - three stats: favorites, activities, reviews - all real counts
//   - Appearance: light / dark tiles (the choice now SAVES)
//   - My content: favorites, my places, my plans, add a place
//   - Settings: notifications, language, city
//   - Account: edit profile, change password
//   - About: help, terms, version
//   - Log out - which now actually logs you out
//
// WHAT CHANGED: nearly every row here used to be decorative. The identity was
// hardcoded ("Bon Plan Explorer" / "explorer@bonplan.tn" / avatar letter "B"),
// "Edit profile" had no handler, and the logout confirmation's destructive
// button had no onPress - confirming a logout did literally nothing.
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, radius, spacing } from '../theme/colors';
import { useStore, useT } from '../store';
import { LANGUAGES } from '../i18n';
import * as favoriteRepo from '../db/favoriteRepo';
import * as commentRepo from '../db/commentRepo';

import Screen from '../components/Screen';
import IconButton from '../components/IconButton';
import { PrimaryButton } from '../components/Buttons';
import { EmptyState } from '../components/Feedback';

// ---------------------------------------------------------------------------
// Row - one settings line: icon, label, optional value, chevron.
//
// It is defined outside the main component on purpose. A component declared
// INSIDE another is rebuilt on every render, which makes React throw away and
// recreate every row instead of just updating it.
// ---------------------------------------------------------------------------
function Row({ styles, colors, icon, label, value, onPress, last, danger }) {
  // Without an onPress this is just information, so it should not look tappable.
  const isTappable = Boolean(onPress);

  return (
    <TouchableOpacity
      style={[styles.row, !last && styles.rowBorder]}
      onPress={onPress}
      // `disabled` stops the row flashing when tapped if it does nothing.
      disabled={!isTappable}
      accessibilityRole={isTappable ? 'button' : 'text'}
    >
      <Ionicons name={icon} size={19} color={danger ? colors.danger : colors.primary} />

      {/* flex:1 + minWidth:0 + numberOfLines: a long French label shrinks
          instead of pushing the value and chevron off the screen. */}
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]} numberOfLines={1}>
        {label}
      </Text>

      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}

      {/* The chevron only appears when the row goes somewhere. The old Row
          always drew one, so read-only rows like "Version" looked tappable. */}
      {isTappable && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { colors, mode, setMode, toggle } = useTheme();
  const {
    user,
    userId,
    isAdmin,
    isLoggedIn,
    language,
    setLanguage,
    city,
    logOut,
    userItinerary,
  } = useStore();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Real counts, read from the database.
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const loadCounts = useCallback(async () => {
    if (!userId) return;
    try {
      const [favorites, reviews] = await Promise.all([
        favoriteRepo.countFavorites(userId),
        commentRepo.countComments(userId),
      ]);
      setFavoriteCount(favorites);
      setReviewCount(reviews);
    } catch (e) {
      console.warn('[ProfileScreen] counts failed:', e);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadCounts();
    }, [loadCounts])
  );

  // Which language is active, so we can show its own name ("Français").
  const currentLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // The language picker, as a native alert with one button per language.
  const openLanguagePicker = () => {
    Alert.alert(t('profile.chooseLanguage'), '', [
      ...LANGUAGES.map((lang) => ({
        // A tick next to whichever is currently active.
        text: `${lang.native}${lang.code === language ? '  ✓' : ''}`,
        onPress: () => setLanguage(lang.code),
      })),
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  // Log out, with a confirmation. The destructive button now has a real
  // onPress - previously it had none, so confirming did nothing at all.
  const handleLogout = () => {
    Alert.alert(t('profile.logoutConfirmTitle'), t('profile.logoutConfirmMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          await logOut();
          // Reset the whole history so back cannot return into the app as a
          // logged-out user. `index: 0` means Login becomes the only screen.
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ---------- HEADER ---------- */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          {/* A quick light/dark switch, next to the full choice below. */}
          <IconButton
            name={mode === 'dark' ? 'sunny' : 'moon'}
            size={20}
            diameter={40}
            onPress={toggle}
            accessibilityLabel={t('profile.appColor')}
          />
        </View>

        {/* ---------- WHO YOU ARE ---------- */}
        {isLoggedIn ? (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              {/* The first letter of the real name, not a hardcoded "B".
                  The `?.` chain means a missing name shows "?" not a crash. */}
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>

            <Text style={styles.name} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user.email}
            </Text>

            {/* A badge so an admin can see at a glance which account they are on. */}
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                <Text style={styles.adminBadgeText}>{t('admin.roleAdmin')}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="create-outline" size={14} color={colors.primary} />
              <Text style={styles.editButtonText}>{t('profile.edit')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // A guest sees an invitation instead of a fake identity.
          <View style={styles.guestCard}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={26} color={colors.primary} />
            </View>
            <Text style={styles.name}>{t('profile.guest')}</Text>
            <Text style={styles.email}>{t('profile.guestSub')}</Text>
            <PrimaryButton
              title={t('auth.logIn')}
              onPress={() => navigation.navigate('Login')}
              style={styles.guestButton}
            />
          </View>
        )}

        {/* ---------- STATS ---------- */}
        {isLoggedIn && (
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.stat} onPress={() => navigation.navigate('Favorites')}>
              <Text style={styles.statNumber}>{favoriteCount}</Text>
              <Text style={styles.statLabel}>{t('profile.favoritesCount')}</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <View style={styles.stat}>
              <Text style={styles.statNumber}>{userItinerary.length}</Text>
              <Text style={styles.statLabel}>{t('profile.activitiesCount')}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.stat}>
              <Text style={styles.statNumber}>{reviewCount}</Text>
              <Text style={styles.statLabel}>{t('profile.reviewsCount')}</Text>
            </View>
          </View>
        )}

        {/* ---------- APPEARANCE ---------- */}
        <Text style={styles.sectionLabel}>{t('profile.appearance')}</Text>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
            <Text style={styles.cardHeadText}>{t('profile.appColor')}</Text>
          </View>

          {/* Two preview tiles. Each shows a miniature of the theme it selects. */}
          <View style={styles.modeRow}>
            {[
              { key: 'light', label: t('profile.light'), icon: 'sunny-outline', bg: '#FFFFFF', border: '#E5E7EF', textBar: '#0F1226', mutedBar: '#9AA0B4', dot: '#1D2BEF' },
              { key: 'dark', label: t('profile.dark'), icon: 'moon-outline', bg: '#0B0C14', border: '#262937', textBar: '#F3F4F8', mutedBar: '#7A7F93', dot: '#6D78FF' },
            ].map((option) => {
              const isActive = mode === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.modeTile, isActive && styles.modeTileActive]}
                  onPress={() => setMode(option.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                >
                  <View style={[styles.modePreview, { backgroundColor: option.bg, borderColor: option.border }]}>
                    <View style={[styles.previewBar, { backgroundColor: option.textBar, width: '60%' }]} />
                    <View style={[styles.previewBar, { backgroundColor: option.mutedBar, width: '40%' }]} />
                    <View style={[styles.previewDot, { backgroundColor: option.dot }]} />
                  </View>

                  <View style={styles.modeLabelRow}>
                    <Ionicons
                      name={option.icon}
                      size={14}
                      color={isActive ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[styles.modeLabel, isActive && styles.modeLabelActive]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ---------- MY CONTENT ---------- */}
        {isLoggedIn && (
          <>
            <Text style={styles.sectionLabel}>{t('profile.account')}</Text>
            <View style={styles.card}>
              <Row
                styles={styles}
                colors={colors}
                icon="heart-outline"
                label={t('fav.title')}
                value={String(favoriteCount)}
                onPress={() => navigation.navigate('Favorites')}
              />
              <Row
                styles={styles}
                colors={colors}
                icon="calendar-outline"
                label={t('plan.myPlans')}
                onPress={() => navigation.navigate('MyPlans')}
              />
              <Row
                styles={styles}
                colors={colors}
                icon="business-outline"
                label={t('place.myPlaces')}
                onPress={() => navigation.navigate('MyPlaces')}
              />
              <Row
                styles={styles}
                colors={colors}
                icon="add-circle-outline"
                label={t('place.addOne')}
                onPress={() => navigation.navigate('AddPlace')}
                last
              />
            </View>
          </>
        )}

        {/* ---------- ADMIN SHORTCUT ---------- */}
        {isAdmin && (
          <>
            <Text style={styles.sectionLabel}>{t('admin.title')}</Text>
            <View style={styles.card}>
              <Row
                styles={styles}
                colors={colors}
                icon="shield-checkmark-outline"
                label={t('admin.openPanel')}
                onPress={() => navigation.navigate('Main', { screen: 'Admin' })}
                last
              />
            </View>
          </>
        )}

        {/* ---------- SETTINGS ---------- */}
        <Text style={styles.sectionLabel}>{t('profile.settings')}</Text>
        <View style={styles.card}>
          <Row
            styles={styles}
            colors={colors}
            icon="notifications-outline"
            label={t('profile.notifications')}
            onPress={() => Alert.alert(t('profile.notifications'), t('profile.notifMsg'))}
          />
          <Row
            styles={styles}
            colors={colors}
            icon="language-outline"
            label={t('profile.language')}
            value={currentLanguage.native}
            onPress={openLanguagePicker}
          />
          <Row
            styles={styles}
            colors={colors}
            icon="location-outline"
            label={t('profile.city')}
            value={city}
            onPress={() => navigation.navigate('ChooseCity', { fromProfile: true })}
            last
          />
        </View>

        {/* ---------- ACCOUNT SECURITY ---------- */}
        {isLoggedIn && (
          <View style={styles.card}>
            <Row
              styles={styles}
              colors={colors}
              icon="person-outline"
              label={t('profile.edit')}
              onPress={() => navigation.navigate('EditProfile')}
            />
            <Row
              styles={styles}
              colors={colors}
              icon="key-outline"
              label={t('profile.changePassword')}
              onPress={() => navigation.navigate('ChangePassword')}
              last
            />
          </View>
        )}

        {/* ---------- ABOUT ---------- */}
        <Text style={styles.sectionLabel}>{t('profile.about')}</Text>
        <View style={styles.card}>
          <Row
            styles={styles}
            colors={colors}
            icon="help-circle-outline"
            label={t('profile.help')}
            onPress={() => Alert.alert(t('profile.help'), t('profile.helpMsg'))}
          />
          <Row
            styles={styles}
            colors={colors}
            icon="document-text-outline"
            label={t('profile.terms')}
            onPress={() => Alert.alert(t('profile.terms'), t('profile.termsMsg'))}
          />
          {/* No onPress: this row is information only, so it draws no chevron. */}
          <Row
            styles={styles}
            colors={colors}
            icon="information-circle-outline"
            label={t('profile.version')}
            value="1.0.0"
            last
          />
        </View>

        {/* ---------- LOG OUT ---------- */}
        {isLoggedIn && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    scroll: { paddingBottom: spacing.xxl },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    title: { fontSize: 22, fontWeight: '700', color: colors.text },

    profileCard: {
      alignItems: 'center',
      marginHorizontal: spacing.xl,
      padding: spacing.xl,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    guestCard: {
      alignItems: 'center',
      marginHorizontal: spacing.xl,
      padding: spacing.xl,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    guestButton: { marginTop: spacing.lg, alignSelf: 'stretch' },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    avatarText: { fontSize: 28, fontWeight: '700', color: colors.primary },
    name: { fontSize: 17, fontWeight: '700', color: colors.text },
    email: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

    adminBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      marginTop: spacing.sm,
    },
    adminBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },

    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: 9,
      borderRadius: radius.pill,
      backgroundColor: colors.primarySoft,
      minHeight: 40,
    },
    editButtonText: { color: colors.primary, fontWeight: '600', fontSize: 13 },

    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.xl,
      marginTop: spacing.lg,
      paddingVertical: spacing.lg,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stat: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, height: 30, backgroundColor: colors.border },
    statNumber: { fontSize: 20, fontWeight: '700', color: colors.text },
    statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

    sectionLabel: {
      marginTop: spacing.xl,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.sm,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      color: colors.textMuted,
    },

    card: {
      marginHorizontal: spacing.xl,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: spacing.lg,
      paddingBottom: spacing.sm,
    },
    cardHeadText: { fontSize: 14, fontWeight: '600', color: colors.text },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      // minHeight, not height: the row must grow when the phone's text size is
      // turned up rather than clipping the label.
      minHeight: 52,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLabel: { flex: 1, minWidth: 0, fontSize: 14, color: colors.text },
    rowLabelDanger: { color: colors.danger },
    // flexShrink: 0 keeps the value readable; the LABEL is the part that gives way.
    rowValue: { fontSize: 13, color: colors.textMuted, flexShrink: 0, maxWidth: '45%' },

    modeRow: { flexDirection: 'row', gap: 12, padding: spacing.lg, paddingTop: 0 },
    modeTile: {
      flex: 1,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.border,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    modeTileActive: { borderColor: colors.primary },
    modePreview: {
      // aspectRatio instead of a fixed height, so the tile keeps its shape on
      // any screen width.
      width: '100%',
      aspectRatio: 3 / 2,
      borderRadius: radius.sm,
      borderWidth: 1,
      padding: 10,
      justifyContent: 'center',
      gap: 5,
    },
    previewBar: { height: 5, borderRadius: 3 },
    previewDot: { width: 14, height: 14, borderRadius: 7, marginTop: 3 },
    modeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    modeLabel: { flex: 1, minWidth: 0, fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
    modeLabelActive: { color: colors.primary },

    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: spacing.xl,
      marginTop: spacing.xl,
      paddingVertical: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.danger,
      minHeight: 48,
    },
    logoutText: { color: colors.danger, fontWeight: '600', fontSize: 15 },
  });
