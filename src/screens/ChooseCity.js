// ============================================================================
// ChooseCity.js - PICK THE CITY YOU ARE VISITING
//
// WHAT CHANGED: the chosen city used to be thrown away the moment you pressed
// the button - the Home screen just showed the word "Bizerte" no matter what.
// Now the choice is saved on your user row in the database, so the Home
// header and the Profile screen both reflect it and it survives a restart.
//
// The screen is reached in two ways, and it has to behave differently in each:
//   - from Profile > City, to CHANGE the city  -> go back afterwards
//   - during first setup                       -> continue into the app
// It works out which case it is from a route param, `fromProfile`.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing } from '../theme/colors';
import { useStore, useT } from '../store';
import Screen from '../components/Screen';
import SearchField from '../components/SearchField';
import ScreenHeader from '../components/ScreenHeader';
import { PrimaryButton } from '../components/Buttons';

// The cities offered. Only Bizerte has data today, but the list is here so
// adding a second city later is a one-line change plus its places.
const CITIES = ['Bizerte', 'Tunis', 'Sousse', 'Hammamet', 'Djerba', 'Tabarka'];

// ---------------------------------------------------------------------------
// Illustration - a traveller, drawn from boxes, sized from `s`.
// ---------------------------------------------------------------------------
function Illustration({ s, colors, styles }) {
  return (
    <View style={[styles.stage, { width: s, height: s }]}>
      <View style={[styles.ground, { width: s * 0.9, height: s * 0.04, borderRadius: s * 0.02 }]} />
      <View style={styles.person}>
        <View style={[styles.hat, { width: s * 0.28, height: s * 0.065, borderRadius: s * 0.045, marginBottom: -s * 0.028 }]} />
        <View style={[styles.head, { width: s * 0.175, height: s * 0.175, borderRadius: s * 0.0875 }]} />
        <View style={[styles.shirt, { width: s * 0.34, height: s * 0.32, borderTopLeftRadius: s * 0.073, borderTopRightRadius: s * 0.073 }]} />
        <View style={[styles.stripe, { bottom: s * 0.23, width: s * 0.34, height: s * 0.027 }]} />
        <View style={[styles.stripe, { bottom: s * 0.155, width: s * 0.34, height: s * 0.027 }]} />
        <View style={[styles.pants, { width: s * 0.34, height: s * 0.14, borderBottomLeftRadius: s * 0.027, borderBottomRightRadius: s * 0.027 }]} />
      </View>
    </View>
  );
}

export default function ChooseCity({ navigation, route }) {
  const { colors } = useTheme();
  const t = useT();
  // `city` is the saved value; setCity writes the new one to the database.
  const { city, setCity, isLoggedIn } = useStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { width, height } = useWindowDimensions();
  const illustrationSize = Math.min(width * 0.55, height * 0.26, 240);

  // Was this opened from the Profile screen to change the city?
  // `?.` guards against route.params being undefined when opened normally.
  const fromProfile = route.params?.fromProfile === true;

  // Start on whatever city is already saved, so reopening shows the real state.
  const [selected, setSelected] = useState(city || 'Bizerte');
  const [query, setQuery] = useState('');

  // Filter the list as the user types.
  // useMemo caches the result so the filtering only runs when the text changes,
  // not on every unrelated re-render.
  const filtered = useMemo(() => {
    // .trim() BEFORE .toLowerCase(): typing "tunis " with a trailing space must
    // still match. The old search elsewhere in the app had exactly this bug.
    const needle = query.trim().toLowerCase();
    if (!needle) return CITIES;
    return CITIES.filter((name) => name.toLowerCase().includes(needle));
  }, [query]);

  // -------------------------------------------------------------------------
  // handleContinue - save the choice, then go wherever we came from.
  // -------------------------------------------------------------------------
  const handleContinue = () => {
    setCity(selected);   // updates the screen instantly and saves in the background

    if (fromProfile) {
      // Came from Profile: just go back. The old code called replace('Main')
      // here, which pushed a SECOND copy of the whole app onto the history.
      navigation.goBack();
    } else {
      // First-time setup. Logged in already -> into the app; otherwise log in.
      navigation.replace(isLoggedIn ? 'Main' : 'Login');
    }
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      {/* A back arrow only makes sense when there is something to go back to. */}
      {fromProfile ? (
        <ScreenHeader title={t('profile.city')} onBack={() => navigation.goBack()} />
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        // Lets the Continue button respond on the first tap while the keyboard
        // is open, instead of that tap only closing the keyboard.
        keyboardShouldPersistTaps="handled"
      >
        {/* Hide the drawing when the screen is short (a small phone with the
            keyboard open) so the list still has room. */}
        {!fromProfile && (
          <View style={styles.illustrationWrap}>
            <Illustration s={illustrationSize} colors={colors} styles={styles} />
          </View>
        )}

        <Text style={styles.title}>{t('city.title')}</Text>

        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={t('city.searchPlaceholder')}
          onClear={() => setQuery('')}
          style={styles.search}
        />

        <Text style={styles.sectionLabel}>{t('city.popular')}</Text>

        {/* One row per city. `key` is required by React so it can tell rows
            apart when the list changes - the city name is unique, so it works
            as the key. */}
        {filtered.map((name) => {
          const isSelected = selected === name;
          return (
            <TouchableOpacity
              key={name}
              style={[styles.cityRow, isSelected && styles.cityRowActive]}
              onPress={() => setSelected(name)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={styles.cityLeft}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                {/* flex:1 + numberOfLines: a long city name shrinks rather than
                    pushing the tick mark off the right edge. */}
                <Text style={styles.cityText} numberOfLines={1}>
                  {name}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Nothing matched what was typed. */}
        {filtered.length === 0 && <Text style={styles.noResults}>{t('list.empty')}</Text>}
      </ScrollView>

      {/* The button sits in a fixed bar at the bottom, above the safe area.
          It is OUTSIDE the ScrollView so it stays put while the list scrolls. */}
      <View style={styles.footer}>
        <PrimaryButton
          title={fromProfile ? t('common.save') : t('city.continue')}
          onPress={handleContinue}
        />
      </View>
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    scroll: { flexGrow: 1, paddingBottom: spacing.xl },

    illustrationWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
    },
    stage: { alignItems: 'center', justifyContent: 'center' },
    ground: { position: 'absolute', bottom: '7%', backgroundColor: colors.primarySoft },
    person: { alignItems: 'center' },
    hat: { backgroundColor: '#0E1BCF' },
    head: { backgroundColor: '#F4C9A4', marginBottom: 2 },
    shirt: { backgroundColor: colors.card, borderWidth: 2, borderColor: '#0F1226' },
    stripe: { position: 'absolute', backgroundColor: '#0F1226' },
    pants: { backgroundColor: '#0F1226' },

    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
      paddingHorizontal: spacing.xl,
    },
    search: { marginHorizontal: spacing.xl },

    sectionLabel: {
      marginTop: spacing.lg,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.sm,
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '700',
      letterSpacing: 1,
    },

    cityRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: spacing.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      borderRadius: radius.md,
      backgroundColor: colors.card,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      // minHeight rather than height, so the row grows if the phone's text
      // size is turned up instead of clipping the city name.
      minHeight: 52,
    },
    cityRowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    // minWidth: 0 is what actually allows the text to shrink. Without it a
    // flex child refuses to go narrower than its own content.
    cityLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
    cityText: { fontSize: 15, fontWeight: '500', color: colors.text, flexShrink: 1 },

    noResults: {
      textAlign: 'center',
      color: colors.textMuted,
      marginTop: spacing.xl,
      fontSize: 14,
    },

    footer: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
