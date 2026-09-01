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
// Alert draws the phone's OWN dialog box - the native one, not a React view.
import { Alert } from 'react-native';
// useT gives just the translator, without subscribing to the whole store.
import { useT } from '../store';
// Imported straight from the repository rather than through the store: this is
// not a logged-in action, so there is no session state to update afterwards.
import { resetPassword } from '../db/userRepo';

import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { PrimaryButton } from '../components/Buttons';

// `route` is the second prop React Navigation gives every screen; it carries
// the params the previous screen sent.
export default function ResetPasswordScreen({ navigation, route }) {
  const t = useT();

  // The email handed over by the previous screen.
  // `?.` and `|| ''` guard against the screen somehow being opened directly
  // with no params - it would show an error rather than crash.
  const email = route.params?.email || '';

  const [password, setPassword] = useState('');   // the new password
  const [confirm, setConfirm] = useState('');     // typed a second time, to catch typos
  const [saving, setSaving] = useState(false);    // true while the database write runs
  const [errors, setErrors] = useState({});       // field name -> translation key

  const handleReset = async () => {
    // --- Check the two boxes agree and are long enough ---
    const found = {};   // collect problems here rather than bailing on the first
    // Six characters is the same minimum the repository enforces; checking here
    // too means the user gets the message instantly, without a database trip.
    if (password.length < 6) found.password = 'error.passwordTooShort';
    // `else if`: only complain that the boxes differ once the password itself
    // is acceptable, so one mistake never shows two red messages.
    else if (password !== confirm) found.confirm = 'error.passwordMismatch';

    setErrors(found);                              // paint whatever we found
    // Object.keys(found).length counts the problems. Any at all -> stop here.
    if (Object.keys(found).length > 0) return;

    setSaving(true);                               // spinner on, button locked
    try {
      // The repository hashes the new password with a FRESH salt and writes it.
      const result = await resetPassword({ email, newPassword: password });

      if (!result.ok) {
        // e.g. the email no longer exists. Show it under the password box,
        // since there is no email field on this screen to attach it to.
        setErrors({ password: 'error.' + result.error });
        return;
      }

      // Tell the user it worked, then send them back to the login screen.
      // popToTop() unwinds the whole Forgot -> Reset detour in one step, so
      // pressing back from Login does not walk them through it again.
      Alert.alert(
        t('auth.passwordChanged'),                 // dialog title
        t('auth.passwordChangedMsg'),              // dialog body
        // The third argument is the list of buttons. One "OK" that navigates.
        [{ text: t('detail.ok'), onPress: () => navigation.popToTop() }]
      );
    } catch (e) {
      // A thrown error means something broke (database closed), not a rejected
      // input - those come back as { ok: false } above.
      console.warn('[ResetPasswordScreen] reset failed:', e);
      setErrors({ password: 'common.error' });
    } finally {
      // Runs on every path, so the button can never stay stuck spinning.
      setSaving(false);
    }
  };

  return (
    // AuthLayout is the shared shell for all four account screens: the logo,
    // the keyboard handling and the scroll behaviour live in there, not here.
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
        value={password}                            // controlled input: React owns the text
        onChangeText={setPassword}                  // every keystroke updates that state
        placeholder={t('auth.passwordPlaceholder')}
        secure                                      // shorthand for secure={true}: dots, not letters
        // `errors.password && t(...)` shows the message only when the key
        // exists; undefined && x is undefined, and FormField draws nothing.
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
        returnKeyType="go"                          // labels the keyboard's action key "go"
        onSubmitEditing={handleReset}               // pressing it submits, like tapping the button
      />

      <PrimaryButton
        title={t('common.save')}
        onPress={handleReset}
        loading={saving}                            // swaps the label for a spinner
        // Disabled until both boxes have something in them. The LENGTH rules
        // are checked on submit instead, so the user is not blocked by a
        // button that silently refuses to light up.
        disabled={password === '' || confirm === ''}
      />
    </AuthLayout>
  );
}
