// ============================================================================
// ChangePasswordScreen.js - CHANGE YOUR PASSWORD WHILE LOGGED IN
//
// Different from the "forgot password" flow: here you already know your
// current password, and you have to prove it before setting a new one.
//
// WHY ASK FOR THE OLD PASSWORD AT ALL, if you are already logged in?
// Because a session can outlive the person. If someone picks up an unlocked
// phone, without this check they could change the password and lock the real
// owner out of their own account. It costs one field and closes that hole.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, radius, spacing } from '../theme/colors';
import { useStore, useT } from '../store';
import * as userRepo from '../db/userRepo';

import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import FormField from '../components/FormField';
import { PrimaryButton } from '../components/Buttons';

export default function ChangePasswordScreen({ navigation }) {
  const { colors } = useTheme();
  const t = useT();
  const { userId } = useStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSave = async () => {
    // --- Check the form first, so mistakes get an instant message ---
    const found = {};
    if (current.length === 0) found.current = 'error.wrongPassword';
    if (next.length < 6) found.next = 'error.passwordTooShort';
    // Only complain about the confirmation once the new password itself is
    // valid, or the user sees two red messages for one mistake.
    else if (next !== confirm) found.confirm = 'error.passwordMismatch';

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const result = await userRepo.changePassword({
        userId,
        currentPassword: current,
        newPassword: next,
      });

      if (!result.ok) {
        // 'wrongPassword' belongs under the first box; anything else under the new one.
        const field = result.error === 'wrongPassword' ? 'current' : 'next';
        setErrors({ [field]: 'error.' + result.error });
        return;
      }

      Alert.alert(t('auth.passwordChanged'), t('auth.passwordChangedMsg'), [
        { text: t('detail.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.warn('[ChangePasswordScreen] change failed:', e);
      setErrors({ next: 'common.error' });
    } finally {
      setSaving(false);
    }
  };

  // Every box needs something in it before the button becomes active.
  const canSubmit = current !== '' && next !== '' && confirm !== '';

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={t('profile.changePassword')} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* A short explanation of why the first box exists. */}
          <View style={styles.note}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <Text style={styles.noteText}>
              {t('auth.currentPassword')} — {t('common.required')}
            </Text>
          </View>

          <FormField
            label={t('auth.currentPassword')}
            icon="lock-closed-outline"
            value={current}
            onChangeText={setCurrent}
            placeholder={t('auth.passwordPlaceholder')}
            secure
            error={errors.current && t(errors.current)}
          />

          <FormField
            label={t('auth.newPassword')}
            icon="key-outline"
            value={next}
            onChangeText={setNext}
            placeholder={t('auth.passwordPlaceholder')}
            secure
            error={errors.next && t(errors.next)}
          />

          <FormField
            label={t('auth.confirmPassword')}
            icon="key-outline"
            value={confirm}
            onChangeText={setConfirm}
            placeholder={t('auth.passwordPlaceholder')}
            secure
            error={errors.confirm && t(errors.confirm)}
            // Pressing the keyboard's "go" key submits, like tapping the button.
            returnKeyType="go"
            onSubmitEditing={canSubmit ? handleSave : undefined}
          />

          <PrimaryButton
            title={t('common.save')}
            onPress={handleSave}
            loading={saving}
            disabled={!canSubmit}
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

    note: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    // flex:1 lets a long translated sentence wrap instead of running past the
    // right edge next to the icon.
    noteText: { flex: 1, fontSize: 12, color: colors.textSecondary },
  });
