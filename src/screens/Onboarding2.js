// ============================================================================
// Onboarding2.js - SECOND ONBOARDING PAGE ("Customize your travel")
// Same structure as Onboarding1 but the illustration is a person with luggage,
// the title/body are different, and the second dot is active.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';

// The illustration is built entirely from styled Views (no SVG/PNG).
// Each View is a body part of a simple person with a suitcase.
function Illustration() {
  return (
    <View style={styles.illustration}>
      <View style={styles.stage} />            {/* ground line */}
      <View style={styles.person}>
        <View style={styles.head} />
        <View style={styles.body} />
        <View style={styles.suitcase}>         {/* little brown suitcase */}
          <View style={styles.handle} />
        </View>
      </View>
      {/* Two decorative dots in the corners */}
      <View style={[styles.miniBlob, { top: 40, left: 30 }]} />
      <View style={[styles.miniBlob, { bottom: 50, right: 20, backgroundColor: '#FFD1A8' }]} />
    </View>
  );
}

export default function Onboarding2({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Top-right Skip jumps past onboarding */}
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={() => navigation.replace('ChooseCity')}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Illustration />

      <View style={styles.content}>
        <Text style={styles.title}>Customize your travel</Text>
        <Text style={styles.subtitle}>
          Plan your day, save your favorite spots and let Bon Plan build the
          perfect itinerary through Bizerte for you.
        </Text>

        {/* Progress dots - the second one is active here */}
        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        {/* navigation.replace ends the onboarding flow - user can't go back. */}
        <TouchableOpacity style={styles.nextBtn} onPress={() => navigation.replace('ChooseCity')}>
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
  stage: { position: 'absolute', bottom: 30, width: 220, height: 14, borderRadius: 7, backgroundColor: colors.primarySoft },
  miniBlob: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primarySoft },
  person: { alignItems: 'center' },
  head: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F4C9A4', marginBottom: 4 },
  body: { width: 70, height: 90, backgroundColor: colors.primary, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  suitcase: { position: 'absolute', right: -42, bottom: 14, width: 44, height: 46, borderRadius: 6, backgroundColor: '#8A5A3B' },
  handle: { position: 'absolute', top: -8, left: 10, width: 24, height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#8A5A3B', borderBottomWidth: 0, backgroundColor: 'transparent' },
  content: { flex: 1, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'flex-start' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  dotsRow: { flexDirection: 'row', marginBottom: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4, backgroundColor: colors.border },
  dotActive: { width: 22, backgroundColor: colors.primary },
  nextBtn: { width: '90%', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  nextText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
