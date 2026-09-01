// ============================================================================
// Onboarding1.js - FIRST INTRODUCTION PAGE ("Find what's nearby")
//
// Two pages introduce the app before the login screen. Each has a Skip link,
// a picture, a title, a paragraph, progress dots and a Next button.
//
// WHAT CHANGED HERE:
//  - the picture is drawn with plain <View> boxes, no image file needed, but
//    it is now SIZED FROM THE SCREEN so it does not squash a small phone
//  - the text now comes from t() so it translates to French and Arabic
//  - it uses <Screen> instead of the old SafeAreaView, which did nothing on
//    Android and let this page draw under the status bar
//  - the content scrolls, so nothing is cut off on a short screen with the
//    phone's text size turned up
// ============================================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing } from '../theme/colors';
// useRTL mirrors the layout when the language is Arabic. Every value it
// returns is null in English and French, so using it costs nothing there.
import { useRTL } from '../theme/rtl';
import { useT } from '../store';
import Screen from '../components/Screen';
import { PrimaryButton, PressableText } from '../components/Buttons';

// ---------------------------------------------------------------------------
// Illustration - a little fake map, built entirely from styled boxes.
//
// `size` is passed in from the screen so the drawing can shrink on a small
// phone. Everything inside is a fraction of that size rather than a fixed
// number of pixels, which is what makes it scale properly.
// ---------------------------------------------------------------------------
function Illustration({ size, colors, styles }) {
  return (
    <View style={[styles.mapBackdrop, { width: size, height: size * 0.96 }]}>
      {/* Four pale bars standing in for streets. Their positions are
          percentages of the card, so they move with it as it resizes. */}
      <View style={[styles.street, { top: '13%', left: '4%', width: '75%' }]} />
      <View style={[styles.street, { top: '35%', left: '17%', width: '58%' }]} />
      <View
        style={[
          styles.street,
          { top: '57%', left: '8%', width: '83%', transform: [{ rotate: '-6deg' }] },
        ]}
      />
      <View style={[styles.street, { top: '78%', left: '21%', width: '54%' }]} />

      {/* Three map pins in the app's accent colours. */}
      <View style={[styles.pin, { top: '9%', left: '17%', backgroundColor: colors.danger }]}>
        <Ionicons name="location" size={18} color="#fff" />
      </View>
      <View style={[styles.pin, { top: '39%', right: '13%', backgroundColor: colors.primary }]}>
        <Ionicons name="location" size={18} color="#fff" />
      </View>
      <View style={[styles.pin, { bottom: '17%', left: '25%', backgroundColor: colors.success }]}>
        <Ionicons name="location" size={18} color="#fff" />
      </View>
    </View>
  );
}

export default function Onboarding1({ navigation }) {
  const { colors } = useTheme();
  const rtl = useRTL();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // The current screen size, kept up to date if the device rotates or unfolds.
  const { width, height } = useWindowDimensions();

  // Size the illustration from BOTH dimensions and take the smaller result.
  // Width alone would overflow a narrow phone; height alone would make it huge
  // on a tall one. Math.min keeps it sensible on every device, and the 280 cap
  // stops it ballooning on a tablet.
  const illustrationSize = Math.min(width * 0.62, height * 0.3, 280);

  return (
    // 'bottom' is included: this is a full page with no tab bar beneath it, so
    // it has to keep clear of the home indicator itself.
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Skip jumps past both pages straight to the login screen. */}
        <View style={[styles.skipRow, rtl.isRTL ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }]}>
          <PressableText
            title={t('common.skip')}
            tone="muted"
            onPress={() => navigation.replace('Login')}
          />
        </View>

        <View style={styles.illustrationWrap}>
          <Illustration size={illustrationSize} colors={colors} styles={styles} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, rtl.textCenter]}>{t('onboarding.title1')}</Text>
          <Text style={[styles.subtitle, rtl.textCenter]}>{t('onboarding.body1')}</Text>

          {/* Progress dots. The first is wider and blue = "you are here". */}
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>

          <PrimaryButton
            title={t('common.next')}
            onPress={() => navigation.navigate('Onboarding2')}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    // flexGrow (not flex) lets the content fill a tall screen but still grow
    // taller and scroll on a short one. Plain flex:1 would block scrolling.
    scroll: { flexGrow: 1, paddingBottom: spacing.xl },

    // alignItems is set in the JSX instead, because the Skip link belongs on
    // the trailing edge - the right in English, the LEFT in Arabic.
    skipRow: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
    },

    illustrationWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
    },
    mapBackdrop: {
      borderRadius: radius.xl,
      backgroundColor: colors.primarySoft,
      overflow: 'hidden',      // keeps the streets inside the rounded corners
    },
    street: {
      position: 'absolute',
      height: 6,
      borderRadius: 4,
      backgroundColor: colors.card,
    },
    pin: {
      position: 'absolute',
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },

    content: {
      paddingHorizontal: spacing.xl,
      alignItems: 'center',
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    // No lineHeight: React Native grows fontSize with the phone's text-size
    // setting but leaves a hardcoded lineHeight alone, so the lines collided
    // for anyone using large text. The platform default spacing is correct.
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
      paddingHorizontal: spacing.sm,
    },

    // The progress dots read left-to-right in every language: they show
    // position in a sequence, not text, so they are deliberately not mirrored.
    dotsRow: { flexDirection: 'row', marginBottom: spacing.xl, gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { width: 22, backgroundColor: colors.primary },
  });
