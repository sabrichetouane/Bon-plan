// ============================================================================
// EditProfileScreen.js - CHANGE YOUR NAME AND EMAIL
//
// The "Edit profile" button on the Profile screen used to be a button with no
// onPress at all - it gave press feedback and did nothing. This is the screen
// it should have opened.
//
// Two things worth noticing:
//   - the email must stay unique across all accounts, so the database checks
//     for a clash with SOMEBODY ELSE (excluding you, or keeping your own email
//     unchanged would fail)
//   - after saving we call refreshUser(), which re-reads the row so the name
//     and avatar letter on the Profile screen update straight away
// ============================================================================

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, radius, spacing } from '../theme/colors';
// useRTL mirrors the layout when the language is Arabic. Every value it
// returns is null in English and French, so using it costs nothing there.
import { useRTL } from '../theme/rtl';
import { useStore, useT } from '../store';
import * as userRepo from '../db/userRepo';

import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import FormField from '../components/FormField';
import { PrimaryButton } from '../components/Buttons';

export default function EditProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const rtl = useRTL();
  const t = useT();
  const { user, userId, refreshUser } = useStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Start the boxes with the CURRENT values, so the user edits rather than
  // retypes. `|| ''` keeps them as empty strings rather than undefined, which
  // React Native complains about in a TextInput.
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  // A brief "Saved" confirmation, so the screen does not just sit there.
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setErrors({});
    setSaved(false);
    setSaving(true);

    try {
      const result = await userRepo.updateProfile({ userId, name, email });

      if (!result.ok) {
        // Put the message under whichever field caused it.
        const field = result.error === 'nameTooShort' ? 'name' : 'email';
        setErrors({ [field]: 'error.' + result.error });
        return;
      }

      // Re-read the user into the store so every screen showing the name
      // updates immediately, without needing a restart.
      await refreshUser();
      setSaved(true);
    } catch (e) {
      console.warn('[EditProfileScreen] save failed:', e);
      setErrors({ name: 'common.error' });
    } finally {
      setSaving(false);
    }
  };

  // Nothing has been typed differently yet -> nothing to save.
  const hasChanges = name !== (user?.name || '') || email !== (user?.email || '');

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={t('profile.edit')} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* A big avatar showing the first letter of whatever is typed, so the
              change is visible before it is even saved. */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          </View>

          <FormField
            label={t('auth.name')}
            icon="person-outline"
            value={name}
            onChangeText={setName}
            placeholder={t('auth.namePlaceholder')}
            error={errors.name && t(errors.name)}
          />

          <FormField
            label={t('auth.email')}
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            error={errors.email && t(errors.email)}
          />

          {/* The success confirmation, shown only right after a save. */}
          {saved && (
            <View style={[styles.savedBox, rtl.row]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.savedText, rtl.text]}>{t('profile.saved')}</Text>
            </View>
          )}

          <PrimaryButton
            title={t('common.save')}
            onPress={handleSave}
            loading={saving}
            disabled={!hasChanges}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },

    avatarWrap: { alignItems: 'center', marginBottom: spacing.xl },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 34, fontWeight: '700', color: colors.primary },

    savedBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      // The success colour at ~13% opacity - '1A' is the alpha part of an
      // 8-digit hex colour.
      backgroundColor: colors.success + '1A',
      borderRadius: radius.sm,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    savedText: { color: colors.success, fontSize: 13, fontWeight: '600', flex: 1 },
  });
