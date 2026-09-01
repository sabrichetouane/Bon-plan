// ============================================================================
// ChooseCity.js - LET THE USER PICK A CITY
// Shown after onboarding. Currently we only support Bizerte, but the list is
// designed to scale: add more cities to `cities` below.
// The screen has a search bar (filters live), a radio-style list, and a
// bottom "Follow up" button that moves to the main app (tabs).
// ============================================================================

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing } from '../theme/colors';

// List of cities shown as rows. Add a new city here and it shows up instantly.
const cities = [
  'Bizerte',
  'Tunis',
  'Sousse',
  'Hammamet',
  'Djerba',
  'Tabarka',
];

function Illustration({ styles }) {
  return (
    <View style={styles.illustrationWrap}>
      <View style={styles.groundShadow} />
      <View style={styles.person}>
        <View style={styles.hat} />
        <View style={styles.head} />
        <View style={styles.shirt} />
        <View style={styles.stripe1} />
        <View style={styles.stripe2} />
        <View style={styles.pants} />
      </View>
    </View>
  );
}

export default function ChooseCity({ navigation }) {
  const { colors } = useTheme();                                   // current palette (light/dark)
  const styles = useMemo(() => makeStyles(colors), [colors]);      // rebuild styles if theme changes
  const [selected, setSelected] = useState('Bizerte');             // currently-selected city
  const [query, setQuery] = useState('');                          // what's typed in the search

  // Live filter: keep only cities whose name includes the search text
  // (case-insensitive). Runs on every keystroke - cheap because the list is tiny.
  const filtered = cities.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Illustration styles={styles} />

        <Text style={styles.title}>Select city to explore</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Search a city"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <Text style={styles.popular}>POPULAR CITIES</Text>
        {filtered.map((city) => (
          <TouchableOpacity
            key={city}
            style={[
              styles.cityRow,
              selected === city && styles.cityRowActive,
            ]}
            onPress={() => setSelected(city)}
          >
            <View style={styles.cityLeft}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={styles.cityText}>{city}</Text>
            </View>
            {selected === city && (
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.replace('Main')}
        >
          <Text style={styles.ctaText}>Follow up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  illustrationWrap: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  groundShadow: {
    position: 'absolute',
    bottom: 20,
    width: 220,
    height: 10,
    borderRadius: 6,
    backgroundColor: colors.primarySoft,
  },
  person: { alignItems: 'center' },
  hat: {
    width: 60,
    height: 14,
    borderRadius: 10,
    backgroundColor: '#0E1BCF',
    marginBottom: -6,
  },
  head: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F4C9A4',
    marginBottom: 2,
  },
  shirt: {
    width: 74,
    height: 70,
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 2,
    borderColor: '#0F1226',
  },
  stripe1: {
    position: 'absolute',
    bottom: 50,
    width: 74,
    height: 6,
    backgroundColor: '#0F1226',
  },
  stripe2: {
    position: 'absolute',
    bottom: 34,
    width: 74,
    height: 6,
    backgroundColor: '#0F1226',
  },
  pants: {
    width: 74,
    height: 30,
    backgroundColor: '#0F1226',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    color: colors.text,
    fontSize: 14,
  },
  popular: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.xl,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
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
  },
  cityRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  cityLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cityText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 10,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
