// ============================================================================
// SplashScreen.js - FIRST SCREEN
// Shows the logo on a blue gradient for ~2 seconds, then auto-advances.
// A splash is mostly cosmetic but also gives your app time to prepare (fonts,
// data fetch, etc.) before the real UI shows up.
// ============================================================================

import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';   // for the 3-color blue bg
import { colors } from '../theme/colors';                // static light palette (this screen is always blue)

// Dimensions.get('window') returns the device's screen size at launch.
// We use `width` so the decorative circles are proportional to the phone size.
const { width, height } = Dimensions.get('window');

// `navigation` is an object React Navigation injects automatically.
// We use navigation.replace(name) to swap to the next screen (no back arrow).
export default function SplashScreen({ navigation }) {
  // useEffect runs code AFTER the first render. Here we schedule a timer.
  useEffect(() => {
    // After 2.2s, replace (not push) the splash with the first onboarding page.
    const t = setTimeout(() => navigation.replace('Onboarding1'), 2200);
    // Cleanup: if the screen unmounts before the timer fires, cancel it.
    return () => clearTimeout(t);
  }, [navigation]); // rerun only if navigation changes (it never does in practice)

  return (
    // LinearGradient draws a smooth blend between the listed colors.
    <LinearGradient colors={['#0E1BCF', '#1D2BEF', '#3A46FF']} style={styles.container}>
      {/* Two big translucent circles that peek in from the edges for a designed look. */}
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      {/* Logo card + "Bon Plan / Bizerte" title */}
      <View style={styles.logoWrap}>
        <View style={styles.logoCard}>
          {/* require(...) bundles the image at build time. assets/icon.png is the user's logo. */}
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImg}
            resizeMode="contain"  // keep aspect ratio inside the box
          />
        </View>
        <Text style={styles.title}>Bon Plan</Text>
        <Text style={styles.title}>Bizerte</Text>
      </View>
    </LinearGradient>
  );
}

// StyleSheet.create performs a few lightweight optimizations vs. plain objects.
const styles = StyleSheet.create({
  container: {
    flex: 1,                 // take all available space (whole screen)
    alignItems: 'center',    // center child horizontally
    justifyContent: 'center',// center child vertically
    overflow: 'hidden',      // clip the blobs that stick out of the edges
  },
  blob: {
    position: 'absolute',    // float above siblings, out of normal flow
    width: width * 1.2,      // bigger than the screen
    height: width * 1.2,
    borderRadius: width,     // huge radius = perfect circle
    backgroundColor: 'rgba(255,255,255,0.08)', // faint white glow
  },
  blobTop:    { top: -width * 0.6,    left: -width * 0.3 },
  blobBottom: { bottom: -width * 0.6, right: -width * 0.3, backgroundColor: 'rgba(255,255,255,0.06)' },
  logoWrap: { alignItems: 'center' },
  logoCard: {
    width: 110, height: 110, borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    // Shadow - iOS uses `shadow*`, Android uses `elevation`. We set both.
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  logoImg: { width: 82, height: 82 },
  title: { color: '#fff', fontSize: 28, fontWeight: '600', lineHeight: 34 },
});
