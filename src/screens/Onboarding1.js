// ============================================================================
// Onboarding1.js - FIRST ONBOARDING PAGE ("Find what's nearby")
// After splash, users see two onboarding pages introducing the app.
// Each has a "Skip" shortcut, a Next button, and dots showing progress.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';

// Sub-component that draws the little map illustration with pins.
// We keep it at module scope because it doesn't need any state.
function Illustration() {
  return (
    <View style={styles.illustration}>
      {/* Faint blue card that represents a map */}
      <View style={styles.mapBackdrop}>
        {/* A few fake "streets" - simple horizontal bars with a tiny rotation */}
        <View style={[styles.street, { top: 30,  left: 10, width: 180 }]} />
        <View style={[styles.street, { top: 80,  left: 40, width: 140 }]} />
        <View style={[styles.street, { top: 130, left: 20, width: 200, transform: [{ rotate: '-6deg' }] }]} />
        <View style={[styles.street, { top: 180, left: 50, width: 130 }]} />

        {/* Three colored pins dotted around the map */}
        <View style={[styles.pin, { top: 20,    left: 40,   backgroundColor: '#EF4444' }]}><Ionicons name="location" size={18} color="#fff" /></View>
        <View style={[styles.pin, { top: 90,    right: 30,  backgroundColor: colors.primary }]}><Ionicons name="location" size={18} color="#fff" /></View>
        <View style={[styles.pin, { bottom: 40, left: 60,   backgroundColor: '#22C55E' }]}><Ionicons name="location" size={18} color="#fff" /></View>
      </View>
    </View>
  );
}

export default function Onboarding1({ navigation }) {
  return (
    // SafeAreaView keeps content below the notch on iPhone X+.
    <SafeAreaView style={styles.container}>
      {/* Top-right Skip button jumps straight to city picker. */}
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={() => navigation.replace('ChooseCity')}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Decorative illustration */}
      <Illustration />

      {/* Bottom content: title, paragraph, dots, next button */}
      <View style={styles.content}>
        <Text style={styles.title}>Find what's nearby</Text>
        <Text style={styles.subtitle}>
          Discover the best spots around you in Bizerte. Restaurants, beaches,
          hidden gems and more, all in one place.
        </Text>

        {/* Progress dots - first is active (wider + blue) */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        {/* navigation.navigate pushes the next screen (you can swipe back). */}
        <TouchableOpacity style={styles.nextBtn} onPress={() => navigation.navigate('Onboarding2')}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  skipRow: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, alignItems: 'flex-end' },
  skip: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  illustration: { flex: 1.1, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  mapBackdrop: { width: 240, height: 230, borderRadius: 24, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  street: { position: 'absolute', height: 6, borderRadius: 4, backgroundColor: '#fff' },
  pin: { position: 'absolute', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'flex-start' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  dotsRow: { flexDirection: 'row', marginBottom: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4, backgroundColor: colors.border },
  dotActive: { width: 22, backgroundColor: colors.primary },
  nextBtn: { width: '90%', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  nextText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
