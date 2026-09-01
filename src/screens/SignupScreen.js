// ============================================================================
// SignupScreen.js - CREATE A NEW ACCOUNT
//
// Collects a name, an email and a password (typed twice), then calls the
// store's signUp(). A successful sign-up logs the person straight in, which is
// what people expect - being asked to log in again right after registering is
// a classic annoyance.
//
// VALIDATION HAPPENS TWICE, on purpose:
//   - here, so the user gets an instant, friendly message
//   - again inside db/userRepo.js, because a screen must never be the only
//     thing protecting the database. If another screen is added later and
//     forgets to check, the repository still refuses bad data.
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, spacing, radius } from '../theme/colors';
// useRTL mirrors the layout when the language is Arabic. Every value it
// returns is null in English and French, so using it costs nothing there.
import { useRTL } from '../theme/rtl';
import { useStore, useT } from '../store';
import { isValidEmail } from '../db/userRepo';

import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { PrimaryButton, PressableText } from '../components/Buttons';

export default function SignupScreen({ navigation }) {
  const { colors } = useTheme();
  const rtl = useRTL();
  const t = useT();
  const { signUp } = useStore();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  // --- The four boxes ------------------------------------------------------
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // --- Screen state --------------------------------------------------------
  const [submitting, setSubmitting] = useState(false);
  // `errors` is an object, one entry per field: { email: 'error.emailTaken' }.
  // Keeping them separate means each message appears under its own box.
  const [errors, setErrors] = useState({});

  // -------------------------------------------------------------------------
  // validate() - check the form before touching the database.
  // Returns an errors object; empty means everything is fine.
  // -------------------------------------------------------------------------
  const validate = () => {
    const found = {};

    if (name.trim().length < 2) found.name = 'error.nameTooShort';
    if (!isValidEmail(email)) found.email = 'error.emailInvalid';
    if (password.length < 6) found.password = 'error.passwordTooShort';
    // Only complain about the confirmation once the password itself is valid,
    // otherwise the user sees two red messages for one mistake.
    else if (password !== confirm) found.confirm = 'error.passwordMismatch';

    return found;
  };

  const handleSignup = async () => {
    const found = validate();
    setErrors(found);

    // Object.keys(...).length counts how many problems we found.
    if (Object.keys(found).length > 0) return;   // stop; messages are on screen

    setSubmitting(true);
    try {
      const result = await signUp({ name, email, password });

      if (!result.ok) {
        // The database found something the screen could not, e.g. the email is
        // already taken. Show it under the field it belongs to.
        const field = result.error === 'emailTaken' || result.error === 'emailInvalid'
          ? 'email'
          : result.error === 'nameTooShort'
          ? 'name'
          : 'password';
        setErrors({ [field]: 'error.' + result.error });
      }
      // On success: the store now has a user, and AppNavigator switches to the
      // main app on its own. Nothing to navigate to from here.
    } catch (e) {
      console.warn('[SignupScreen] signup failed:', e);
      setErrors({ password: 'common.error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Enable the button only once every box has something in it.
  const canSubmit =
    name.trim() !== '' && email.trim() !== '' && password !== '' && confirm !== '';

  return (
    <AuthLayout
      title={t('auth.createAccount')}
      subtitle={t('auth.signupSubtitle')}
      onBack={() => navigation.goBack()}
      footer={
        <View style={[styles.footerRow, rtl.row]}>
          <Text style={[styles.footerText, rtl.text]}>{t('auth.haveAccount')}</Text>
          <PressableText title={t('auth.logIn')} onPress={() => navigation.goBack()} />
        </View>
      }
    >
      <FormField
        label={t('auth.name')}
        icon="person-outline"
        value={name}
        onChangeText={setName}
        placeholder={t('auth.namePlaceholder')}
        // `errors.name && t(...)` -> show the message only if that key exists.
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

      <FormField
        label={t('auth.password')}
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        placeholder={t('auth.passwordPlaceholder')}
        secure
        error={errors.password && t(errors.password)}
      />

      <FormField
        label={t('auth.confirmPassword')}
        icon="lock-closed-outline"
        value={confirm}
        onChangeText={setConfirm}
        placeholder={t('auth.passwordPlaceholder')}
        secure
        error={errors.confirm && t(errors.confirm)}
        returnKeyType="go"
        onSubmitEditing={canSubmit ? handleSignup : undefined}
      />

      <PrimaryButton
        title={t('auth.signUp')}
        onPress={handleSignup}
        loading={submitting}
        disabled={!canSubmit}
        style={styles.submit}
      />
    </AuthLayout>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    submit: { marginTop: spacing.sm },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    footerText: { color: colors.textSecondary, fontSize: 14 },
  });
