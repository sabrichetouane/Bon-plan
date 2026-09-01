// ============================================================================
// LoginScreen.js - SIGN IN TO AN EXISTING ACCOUNT
//
// The first screen after onboarding. It collects an email and a password,
// hands them to the store's logIn(), and - once the store confirms the user -
// resets the navigation history onto the main app itself.
//
// It has to do that reset explicitly. Some React Navigation apps register two
// separate stacks ('logged out' / 'logged in') and let a condition swap them,
// so no screen ever navigates after a login. This app cannot: a guest is
// allowed to browse without an account, so there is only ONE stack and nobody
// is watching whether the store gained a user.
//
// HOW A FORM SCREEN WORKS IN REACT, in short:
//   - useState holds what the user has typed so far
//   - every keystroke calls setEmail / setPassword, which re-renders the screen
//     with the new text
//   - pressing the button reads those values and calls the database
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, spacing, radius } from '../theme/colors';
// useRTL mirrors the layout when the language is Arabic. Every value it
// returns is null in English and French, so using it costs nothing there.
import { useRTL } from '../theme/rtl';
import { useStore, useT } from '../store';

import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { PrimaryButton, PressableText } from '../components/Buttons';

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const rtl = useRTL();
  const t = useT();                      // translator: t('auth.logIn') etc.
  const { logIn } = useStore();          // the login function from the store
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  // --- What the user has typed ---------------------------------------------
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- Screen state --------------------------------------------------------
  // `submitting` disables the button and shows a spinner while we check the
  // password, so a double tap cannot fire two logins.
  const [submitting, setSubmitting] = useState(false);
  // `error` holds a translation key like 'error.badCredentials', or '' for none.
  const [error, setError] = useState('');

  // -------------------------------------------------------------------------
  // handleLogin - runs when the Log in button is pressed.
  // `async` because talking to the database takes a moment.
  // -------------------------------------------------------------------------
  const handleLogin = async () => {
    setError('');                        // clear any message from a previous try
    setSubmitting(true);                 // show the spinner, block the button

    try {
      // logIn returns { ok: true } or { ok: false, error: 'badCredentials' }.
      const result = await logIn({ email, password });

      if (!result.ok) {
        // Turn the error CODE into a translated sentence. The `error.` prefix
        // matches the keys added in i18n.js.
        setError('error.' + result.error);
        return;                          // stop here; stay on the form
      }

      // SUCCESS. logIn() has already awaited the store, so by this line the
      // user row - role included - is in memory. That matters for an admin:
      // MainTabs reads isAdmin while it mounts to decide whether the fifth
      // tab exists, so the reset below must happen AFTER the store is filled.
      //
      // reset() throws the whole history away and rebuilds it with a single
      // entry. That is the right verb here rather than navigate() or
      // replace():
      //   - navigate('Main') would push Main ON TOP of Login, so the Android
      //     back button would drop a signed-in user back onto the login form
      //   - replace('Main') only swaps the current screen, so a Login reached
      //     from Signup would still leave Signup underneath
      // reset() leaves exactly one screen, Main, with nothing behind it.
      //
      // Without this line the screen simply sat there after a correct
      // password: nothing in a single-stack navigator watches the store for a
      // new user. Force-quitting appeared to log you in only because
      // SplashScreen re-reads the saved session on the next launch.
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      // A crash (database unavailable, etc.) rather than a wrong password.
      console.warn('[LoginScreen] login failed:', e);
      setError('common.error');
    } finally {
      // `finally` always runs, success or failure - so the button can never
      // stay stuck in its loading state.
      setSubmitting(false);
    }
  };

  // The button should be tappable only when both boxes have something in them.
  const canSubmit = email.trim().length > 0 && password.length > 0;

  return (
    <AuthLayout
      title={t('auth.welcomeBack')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        // The bottom links: create an account, or look around without one.
        <View style={styles.footerBlock}>
          <View style={[styles.footerRow, rtl.row]}>
            <Text style={[styles.footerText, rtl.text]}>{t('auth.noAccount')}</Text>
            <PressableText title={t('auth.signUp')} onPress={() => navigation.navigate('Signup')} />
          </View>

          <PressableText
            title={t('auth.continueAsGuest')}
            tone="muted"
            onPress={() => navigation.navigate('Main')}
            style={styles.guestLink}
          />

          {/* A visible reminder of the demo admin account. This exists because
              the app ships with no users other than the seeded admin; a real
              product would never print credentials on screen. */}
          <Text style={[styles.demoHint, rtl.textCenter]}>{t('auth.demoHint')}</Text>
        </View>
      }
    >
      <FormField
        label={t('auth.email')}
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        placeholder={t('auth.emailPlaceholder')}
        keyboardType="email-address"
      />

      <FormField
        label={t('auth.password')}
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        placeholder={t('auth.passwordPlaceholder')}
        secure
        // Pressing "go" on the keyboard submits, just like tapping the button.
        returnKeyType="go"
        onSubmitEditing={canSubmit ? handleLogin : undefined}
      />

      {/* The error message, shown only when there is one. */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={[styles.errorText, rtl.text]}>{t(error)}</Text>
        </View>
      ) : null}

      {/* Right-aligned "Forgot password?" link. */}
      <View style={[styles.forgotRow, rtl.isRTL ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }]}>
        <PressableText
          title={t('auth.forgotPassword')}
          onPress={() => navigation.navigate('ForgotPassword')}
        />
      </View>

      <PrimaryButton
        title={t('auth.logIn')}
        onPress={handleLogin}
        loading={submitting}
        disabled={!canSubmit}
      />
    </AuthLayout>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    // A soft red panel behind the error text, using the danger colour at ~13%
    // opacity ('1A' is the alpha part of an 8-digit hex colour).
    errorBox: {
      backgroundColor: colors.danger + '1A',
      borderRadius: radius.sm,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    errorText: { color: colors.danger, fontSize: 13 },

    // In Arabic the 'forgot password?' link belongs on the LEFT, which is the
    // trailing edge there - so the alignment flips with the language.
    forgotRow: { marginBottom: spacing.lg },

    footerBlock: { alignItems: 'center', gap: spacing.sm },
    footerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { color: colors.textSecondary, fontSize: 14 },
    guestLink: { marginTop: spacing.xs },

    demoHint: {
      marginTop: spacing.md,
      fontSize: 11,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
