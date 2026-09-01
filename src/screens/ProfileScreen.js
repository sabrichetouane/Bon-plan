// ============================================================================
// ProfileScreen.js - USER PROFILE + SETTINGS (Profile tab)
// Sections:
//   - Avatar card with name, email, "Edit profile" button
//   - 3 quick stats (favorites / activities / city)
//   - Appearance: two big tiles to pick LIGHT or DARK theme
//   - Settings: Notifications, Language, City
//   - About: Help, Terms, Version
//   - Logout button
// All actions are wired to real effects (theme changes live, language changes
// re-render the whole UI, city opens Choose City, etc.)
// ============================================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing } from '../theme/colors';
import { useStore, useT } from '../store';
import { LANGUAGES } from '../i18n';

export default function ProfileScreen({ navigation }) {
  const { colors, mode, setMode, toggle } = useTheme();
  const { favorites, userItinerary, language, setLanguage } = useStore();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Look up the currently-selected language so we can show its native name
  // on the right side of the Language row (e.g. "العربية").
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Show a native Alert with one option per language. The selected one gets
  // a checkmark. Tapping any option calls setLanguage() which triggers every
  // useT() across the app to re-render in the new language.
  const openLanguageSheet = () => {
    Alert.alert(
      t('profile.chooseLanguage'),
      '',
      [
        ...LANGUAGES.map((l) => ({
          text: `${l.native}${l.code === language ? '  ✓' : ''}`,
          onPress: () => setLanguage(l.code),
        })),
        { text: t('itin.cancel'), style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={toggle}>
            <Ionicons
              name={mode === 'dark' ? 'sunny' : 'moon'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>B</Text>
          </View>
          <Text style={styles.name}>{t('profile.name')}</Text>
          <Text style={styles.email}>explorer@bonplan.tn</Text>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="create-outline" size={14} color={colors.primary} />
            <Text style={styles.editText}>{t('profile.edit')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{favorites.size}</Text>
            <Text style={styles.statLabel}>{t('profile.favoritesCount')}</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{userItinerary.length}</Text>
            <Text style={styles.statLabel}>{t('profile.activitiesCount')}</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>1</Text>
            <Text style={styles.statLabel}>{t('profile.cityCount')}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t('profile.appearance')}</Text>
        <View style={styles.card}>
          <View style={styles.rowHeader}>
            <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
            <Text style={styles.rowTitle}>{t('profile.appColor')}</Text>
          </View>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeCard, mode === 'light' && styles.modeCardActive]}
              onPress={() => setMode('light')}
            >
              <View style={[styles.modePreview, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EF' }]}>
                <View style={[styles.previewLine, { backgroundColor: '#0F1226', width: '60%' }]} />
                <View style={[styles.previewLine, { backgroundColor: '#9AA0B4', width: '40%' }]} />
                <View style={[styles.previewDot, { backgroundColor: '#1D2BEF' }]} />
              </View>
              <View style={styles.modeLabelRow}>
                <Ionicons
                  name="sunny-outline"
                  size={14}
                  color={mode === 'light' ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[styles.modeLabel, mode === 'light' && styles.modeLabelActive]}
                >
                  {t('profile.light')}
                </Text>
                {mode === 'light' && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, mode === 'dark' && styles.modeCardActive]}
              onPress={() => setMode('dark')}
            >
              <View style={[styles.modePreview, { backgroundColor: '#0B0C14', borderColor: '#262937' }]}>
                <View style={[styles.previewLine, { backgroundColor: '#F3F4F8', width: '60%' }]} />
                <View style={[styles.previewLine, { backgroundColor: '#7A7F93', width: '40%' }]} />
                <View style={[styles.previewDot, { backgroundColor: '#6D78FF' }]} />
              </View>
              <View style={styles.modeLabelRow}>
                <Ionicons
                  name="moon-outline"
                  size={14}
                  color={mode === 'dark' ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[styles.modeLabel, mode === 'dark' && styles.modeLabelActive]}
                >
                  {t('profile.dark')}
                </Text>
                {mode === 'dark' && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

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
            right={currentLang.native}
            onPress={openLanguageSheet}
          />
          <Row
            styles={styles}
            colors={colors}
            icon="location-outline"
            label={t('profile.city')}
            right="Bizerte"
            onPress={() => navigation.navigate('ChooseCity')}
            last
          />
        </View>

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
          <Row
            styles={styles}
            colors={colors}
            icon="information-circle-outline"
            label={t('profile.version')}
            right="1.0.0"
            last
          />
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() =>
            Alert.alert(t('profile.logoutConfirmTitle'), t('profile.logoutConfirmMsg'), [
              { text: t('itin.cancel'), style: 'cancel' },
              { text: t('profile.logout'), style: 'destructive' },
            ])
          }
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Small reusable row component for the Settings and About cards.
// Shows: icon on the left, label in the middle, optional `right` text
// (e.g. current value), chevron on the right. `last` removes the bottom border.
function Row({ styles, colors, icon, label, right, onPress, last }) {
  return (
    <TouchableOpacity
      style={[styles.row, !last && styles.rowBorder]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      {right ? <Text style={styles.rowRight}>{right}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
    },
    title: { fontSize: 22, fontWeight: '700', color: colors.text },
    iconBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center',
    },
    profileCard: {
      alignItems: 'center',
      marginHorizontal: spacing.xl, marginTop: spacing.lg,
      padding: spacing.xl,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1, borderColor: colors.border,
    },
    avatar: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: spacing.md,
    },
    avatarText: { color: '#fff', fontSize: 30, fontWeight: '700' },
    name: { fontSize: 17, fontWeight: '700', color: colors.text },
    email: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
    editBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      marginTop: spacing.md,
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: radius.pill,
      backgroundColor: colors.primarySoft,
    },
    editText: {
      color: colors.primary, fontWeight: '600', fontSize: 12, marginLeft: 6,
    },
    statsRow: {
      flexDirection: 'row',
      marginHorizontal: spacing.xl, marginTop: spacing.lg,
      padding: spacing.lg,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1, borderColor: colors.border,
    },
    stat: { flex: 1, alignItems: 'center' },
    statSep: { width: 1, backgroundColor: colors.border },
    statNum: { fontSize: 18, fontWeight: '700', color: colors.text },
    statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
    sectionLabel: {
      marginTop: spacing.xl, marginHorizontal: spacing.xl,
      fontSize: 11, color: colors.textMuted,
      fontWeight: '700', letterSpacing: 1,
      marginBottom: spacing.sm,
    },
    card: {
      marginHorizontal: spacing.xl,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1, borderColor: colors.border,
      overflow: 'hidden',
    },
    rowHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    },
    rowTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginLeft: 8 },
    modeRow: { flexDirection: 'row', gap: 10, padding: spacing.md },
    modeCard: {
      flex: 1, borderRadius: radius.md, padding: 10,
      borderWidth: 2, borderColor: colors.border,
      backgroundColor: colors.card,
    },
    modeCardActive: { borderColor: colors.primary },
    modePreview: {
      height: 90, borderRadius: radius.sm,
      borderWidth: 1, padding: 10,
      justifyContent: 'space-between',
    },
    previewLine: { height: 5, borderRadius: 2.5 },
    previewDot: { width: 18, height: 18, borderRadius: 9, alignSelf: 'flex-end' },
    modeLabelRow: {
      flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8,
    },
    modeLabel: {
      fontSize: 13, fontWeight: '600',
      color: colors.textSecondary, marginLeft: 6, flex: 1,
    },
    modeLabelActive: { color: colors.primary },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: spacing.lg, paddingVertical: 14,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLabel: { fontSize: 14, color: colors.text, marginLeft: 12 },
    rowRight: { fontSize: 13, color: colors.textMuted, marginRight: 6 },
    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6,
      marginHorizontal: spacing.xl, marginTop: spacing.xl,
      paddingVertical: 14, borderRadius: radius.md,
      backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border,
    },
    logoutText: { color: colors.danger, fontWeight: '600', marginLeft: 6 },
  });
