// ============================================================================
// ResetPasswordScreen.js - STEP 2 OF "I FORGOT MY PASSWORD"
//
// Reached from ForgotPasswordScreen, which passes the confirmed email as a
// route param. The user types a new password twice; we scramble it and save it.
//
// ROUTE PARAMS, briefly: when one screen calls
//     navigation.navigate('ResetPassword', { email: 'x@y.com' })
// the value arrives here as route.params.email. It is how screens hand data
// to each other.
// ============================================================================

import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useT } from '../store';
import { resetPassword } from '../db/userRepo';

import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { PrimaryButton } from '../components/Buttons';

export default function ResetPasswordScreen({ navigation, route }) {
  const t = useT();

  // The email handed over by the previous screen.
  // `?.` and `|| ''` guard against the screen somehow being opened directly
  // with no params - it would show an error rather than crash.
  const email = route.params?.email || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleReset = async () => {
    // --- Check the two boxes agree and are long enough ---
    const found = {};
    if (password.length < 6) found.password = 'error.passwordTooShort';
    else if (password !== confirm) found.confirm = 'error.passwordMismatch';

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const result = await resetPassword({ email, newPassword: password });

      if (!result.ok) {
        setErrors({ password: 'error.' + result.error });
        return;
      }

      // Tell the user it worked, then send them back to the login screen.
      // popToTop() unwinds the whole Forgot -> Reset detour in one step, so
      // pressing back from Login does not walk them through it again.
      Alert.alert(t('auth.passwordChanged'), t('auth.passwordChangedMsg'), [
        { text: t('detail.ok'), onPress: () => navigation.popToTop() },
      ]);
    } catch (e) {
      console.warn('[ResetPasswordScreen] reset failed:', e);
      setErrors({ password: 'common.error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.resetTitle')}
      // .replace('%s', email) drops the address into the sentence. The
      // translations all contain a %s placeholder in the right spot for their
      // own word order.
      subtitle={t('auth.resetSubtitle').replace('%s', email)}
      onBack={() => navigation.goBack()}
    >
      <FormField
        label={t('auth.newPassword')}
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
        onSubmitEditing={handleReset}
      />

      <PrimaryButton
        title={t('common.save')}
        onPress={handleReset}
        loading={saving}
        disabled={password === '' || confirm === ''}
      />
    </AuthLayout>
  );
}
