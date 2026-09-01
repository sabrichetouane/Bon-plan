// ============================================================================
// components/AuthLayout.js - THE SHARED FRAME FOR LOGIN / SIGN-UP / RESET
//
// All four account screens look the same: the Bon Plan logo, a title, a short
// explanation, then the form. Putting that frame here means the four screens
// only contain their own fields, and they can never drift apart visually.
//
// TWO IMPORTANT THINGS THIS HANDLES:
//
// 1. KeyboardAvoidingView.
//    When the phone keyboard opens it covers the bottom half of the screen.
//    Without this, the password field and the Log in button are hidden behind
//    it and the user cannot see what they are typing. This component lifts the
//    content up by exactly the keyboard's height.
//    iOS and Android need different settings, hence the Platform.select.
//
// 2. ScrollView + keyboardShouldPersistTaps.
//    On a small phone (iPhone SE) the form is taller than the visible area
//    once the keyboard is open, so it must scroll. And "persistTaps" means a
//    tap on the Log in button works FIRST TIME while the keyboard is open -
//    without it the first tap only dismisses the keyboard, which feels broken.
// ============================================================================

import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme, radius, spacing } from '../theme/colors';
import Screen from './Screen';
import IconButton from './IconButton';

// ---------------------------------------------------------------------------
// Props:
//   title     the big heading, e.g. "Welcome back"
//   subtitle  the grey explanation under it
//   onBack    if given, a back arrow appears top-left
//   children  the form fields and buttons
//   footer    optional content pinned under the form (e.g. "Sign up" link)
// ---------------------------------------------------------------------------
export default function AuthLayout({ title, subtitle, onBack, children, footer }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    // edges includes 'bottom' here: these are full-page screens with no tab
    // bar underneath, so they must keep clear of the home indicator themselves.
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        // 'padding' works on iOS; 'height' is the reliable choice on Android.
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          // Lets a button press register on the first tap while the keyboard
          // is still open, instead of the tap being eaten to close it.
          keyboardShouldPersistTaps="handled"
        >
          {/* The back arrow, only on screens that were pushed onto another. */}
          {onBack ? (
            <View style={styles.backRow}>
              <IconButton name="chevron-back" size={22} onPress={onBack} />
            </View>
          ) : (
            <View style={styles.backSpacer} />
          )}

          {/* Brand block: the same white rounded logo card as the splash screen,
              so opening the app and reaching the login screen feel continuous. */}
          <View style={styles.brand}>
            <View style={styles.logoCard}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>Bon Plan Bizerte</Text>
          </View>

          {/* Heading + explanation. */}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {/* The screen's own fields and buttons drop in here. */}
          <View style={styles.form}>{children}</View>

          {/* Anything the screen wants at the bottom (links, hints). */}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: {
      // flexGrow (not flex) on a ScrollView's content: it lets the content
      // stretch to fill a tall screen, but still grow taller and scroll on a
      // short one. Plain `flex: 1` would stop it scrolling at all.
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxl,
    },
    backRow: { marginLeft: -spacing.sm, marginTop: spacing.xs },
    backSpacer: { height: spacing.xl },

    brand: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
    logoCard: {
      width: 76,
      height: 76,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      // Both shadow properties, because iOS reads shadow* and Android reads
      // elevation. Setting only one gives a flat button on the other platform.
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
      marginBottom: spacing.md,
    },
    logo: { width: 54, height: 54 },
    brandName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 0.3,
    },

    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.xl,
    },

    form: { marginTop: spacing.sm },
    // marginTop: 'auto' pushes the footer to the bottom when the screen is
    // tall, but lets it sit right after the form when space is tight.
    footer: { marginTop: 'auto', paddingTop: spacing.xl },
  });
