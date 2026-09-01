// ============================================================================
// ForgotPasswordScreen.js - STEP 1 OF "I FORGOT MY PASSWORD"
//
// The user types the email they signed up with. We check that an account
// really exists, then send them to ResetPasswordScreen to choose a new one.
//
// HOW A REAL APP DOES THIS, and why ours is different:
// Normally the server emails you a one-time link, and only that link proves
// you own the address. That needs a mail server, which this offline app does
// not have - everything lives in SQLite on the phone.
//
// So we keep the same two-step flow and the same screens, and simplify only
// the "prove it is you" step. If a backend is added later, the only change is
// what happens between these two screens; the screens themselves stay.
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius } from '../theme/colors';
import { useT } from '../store';
import { findUserByEmail, isValidEmail } from '../db/userRepo';

import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { PrimaryButton } from '../components/Buttons';

export default function ForgotPasswordScreen({ navigation }) {
  const { colors } = useTheme();
  const t = useT();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  // -------------------------------------------------------------------------
  // handleContinue - look the email up, then move to step 2.
  // -------------------------------------------------------------------------
  const handleContinue = async () => {
    setError('');

    // Check the shape of the address before asking the database at all.
    if (!isValidEmail(email)) {
      setError('error.emailInvalid');
      return;
    }

    setChecking(true);
    try {
      const user = await findUserByEmail(email);

      if (!user) {
        setError('error.emailNotFound');
        return;
      }

      // Pass the email forward as a route param, so the next screen knows
      // whose password it is changing.
      navigation.navigate('ResetPassword', { email: user.email });
    } catch (e) {
      console.warn('[ForgotPasswordScreen] lookup failed:', e);
      setError('common.error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.resetTitle')}
      subtitle={t('auth.forgotSubtitle')}
      onBack={() => navigation.goBack()}
    >
      <FormField
        label={t('auth.email')}
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        placeholder={t('auth.emailPlaceholder')}
        keyboardType="email-address"
        error={error && t(error)}
        returnKeyType="go"
        onSubmitEditing={handleContinue}
      />

      <PrimaryButton
        title={t('auth.continue')}
        onPress={handleContinue}
        loading={checking}
        disabled={email.trim() === ''}
      />

      {/* An honest note, in the UI, about what this flow does and does not do.
          Being upfront here is better than implying an email was sent. */}
      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
        <Text style={styles.noteText}>
          This demo runs entirely on your phone, so no email is sent — you set the new
          password here directly.
        </Text>
      </View>
    </AuthLayout>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    note: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.xl,
    },
    // flex: 1 lets the sentence wrap onto several lines instead of running off
    // the right edge next to the icon.
    noteText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  });
