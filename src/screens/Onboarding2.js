// ============================================================================
// Onboarding2.js - SECOND INTRODUCTION PAGE ("Customize your travel")
//
// Same layout as Onboarding1: Skip, picture, title, paragraph, dots, button.
// Only the drawing, the words and which dot is active change.
//
// The picture is a simple traveller with a suitcase, built from plain <View>
// boxes - no image file. Every measurement is a fraction of `size`, which the
// screen works out from the real device dimensions, so it scales instead of
// overflowing a small phone.
//
// The Next button uses replace() rather than navigate(). That matters: it
// takes onboarding OFF the history, so once you reach the login screen you
// cannot swipe back into the introduction. The old version used navigate()
// here, which left Onboarding1 sitting under the whole app for the rest of
// the session.
// ============================================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useTheme, spacing } from '../theme/colors';
// useRTL mirrors the layout when the language is Arabic. Every value it
// returns is null in English and French, so using it costs nothing there.
import { useRTL } from '../theme/rtl';
import { useT } from '../store';
import Screen from '../components/Screen';
import { PrimaryButton, PressableText } from '../components/Buttons';

// ---------------------------------------------------------------------------
// Illustration - a person with a suitcase, drawn from boxes.
// `s` is the base size; every part is a multiple of it.
// ---------------------------------------------------------------------------
function Illustration({ s, colors, styles }) {
  return (
    <View style={[styles.stage, { width: s, height: s }]}>
      {/* The pale oval "ground" the figure stands on. */}
      <View style={[styles.ground, { width: s * 0.85, height: s * 0.055, borderRadius: s * 0.03 }]} />

      {/* Two small decorative dots in the corners. */}
      <View style={[styles.miniBlob, { width: s * 0.08, height: s * 0.08, borderRadius: s * 0.04, top: s * 0.1, left: s * 0.08 }]} />
      <View style={[styles.miniBlob, { width: s * 0.08, height: s * 0.08, borderRadius: s * 0.04, bottom: s * 0.18, right: s * 0.06, backgroundColor: '#FFD1A8' }]} />

      {/* The figure: a head, a body, and a suitcase beside it. */}
      <View style={styles.person}>
        <View style={[styles.head, { width: s * 0.19, height: s * 0.19, borderRadius: s * 0.095 }]} />
        <View
          style={[
            styles.body,
            {
              width: s * 0.31,
              height: s * 0.4,
              borderTopLeftRadius: s * 0.08,
              borderTopRightRadius: s * 0.08,
              borderBottomLeftRadius: s * 0.045,
              borderBottomRightRadius: s * 0.045,
            },
          ]}
        />
        <View
          style={[
            styles.suitcase,
            {
              width: s * 0.2,
              height: s * 0.21,
              borderRadius: s * 0.027,
              right: -s * 0.19,
              bottom: s * 0.06,
            },
          ]}
        >
          {/* The little handle on top of the suitcase. */}
          <View
            style={[
              styles.handle,
              { top: -s * 0.036, left: s * 0.045, width: s * 0.11, height: s * 0.036 },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export default function Onboarding2({ navigation }) {
  const { colors } = useTheme();
  const rtl = useRTL();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { width, height } = useWindowDimensions();
  // Same sizing rule as page one, so both illustrations match visually.
  const size = Math.min(width * 0.62, height * 0.3, 280);

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.skipRow, rtl.isRTL ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }]}>
          <PressableText
            title={t('common.skip')}
            tone="muted"
            onPress={() => navigation.replace('Login')}
          />
        </View>

        <View style={styles.illustrationWrap}>
          <Illustration s={size} colors={colors} styles={styles} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, rtl.textCenter]}>{t('onboarding.title2')}</Text>
          <Text style={[styles.subtitle, rtl.textCenter]}>{t('onboarding.body2')}</Text>

          {/* The SECOND dot is the active one on this page. */}
          <View style={styles.dotsRow}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>

          <PrimaryButton title={t('common.next')} onPress={() => navigation.replace('Login')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
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
    stage: { alignItems: 'center', justifyContent: 'center' },
    ground: {
      position: 'absolute',
      bottom: '8%',
      backgroundColor: colors.primarySoft,
    },
    miniBlob: { position: 'absolute', backgroundColor: colors.primarySoft },

    person: { alignItems: 'center' },
    head: { backgroundColor: '#F4C9A4', marginBottom: 4 },
    body: { backgroundColor: colors.primary },
    suitcase: { position: 'absolute', backgroundColor: '#8A5A3B' },
    handle: {
      position: 'absolute',
      borderWidth: 2,
      borderColor: '#8A5A3B',
      borderBottomWidth: 0,     // an upside-down U shape
      backgroundColor: 'transparent',
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },

    content: { paddingHorizontal: spacing.xl, alignItems: 'center' },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    // lineHeight deliberately omitted - see the note in Onboarding1.js.
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
