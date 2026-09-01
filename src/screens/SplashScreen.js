// ============================================================================
// SplashScreen.js - FIRST SCREEN, AND THE TRAFFIC POLICEMAN
//
// It shows the logo on a blue gradient, but it also does real work: while the
// user looks at it, the app is opening the SQLite database, creating the
// tables the first time, loading the 28 starter places, and checking whether
// somebody was already logged in last time.
//
// When that finishes it sends the user to one of two places:
//   - already logged in  -> straight into the app (Main)
//   - nobody logged in   -> the onboarding pages, then login
//
// That is why a splash screen exists at all: it gives the app a moment to get
// ready, instead of showing a half-empty screen.
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';

export default function SplashScreen({ navigation }) {
  // `ready` turns true once the store has opened the database and looked for a
  // saved session. `isLoggedIn` tells us which way to send the user.
  const { ready, isLoggedIn } = useStore();

  // useWindowDimensions gives the CURRENT screen size and updates if it
  // changes (rotation, a foldable opening, Android split-screen).
  // The old code read the size once with Dimensions.get() at the top of the
  // file, which is frozen the moment the app loads and never updates.
  const { width } = useWindowDimensions();

  // useRef holds a value that survives re-renders WITHOUT causing one.
  // We use it as a one-way switch: "have we already navigated away?".
  // Without it, if `ready` changed twice we could fire two navigations and
  // end up with two copies of the app on the stack.
  const navigated = useRef(false);

  useEffect(() => {
    // Nothing to do until the database has finished opening.
    if (!ready) return;
    // Already sent the user somewhere - do not do it twice.
    if (navigated.current) return;

    // Keep the logo on screen for a moment even if the database was instant,
    // otherwise the splash flashes past too fast to read.
    const timer = setTimeout(() => {
      navigated.current = true;

      // replace() instead of navigate(): it REPLACES the splash in the history
      // rather than stacking on top, so pressing back never returns here.
      navigation.replace(isLoggedIn ? 'Main' : 'Onboarding1');
    }, 1400);

    // If this screen disappears before the timer fires, cancel it. Otherwise
    // React warns about updating a screen that no longer exists.
    return () => clearTimeout(timer);
  }, [ready, isLoggedIn, navigation]);

  // The decorative circles are sized from the screen width, so they look the
  // same on a small phone and a tablet.
  const blobSize = width * 1.2;

  return (
    // LinearGradient blends smoothly between the listed colours, top to bottom.
    <LinearGradient colors={['#0E1BCF', '#1D2BEF', '#3A46FF']} style={styles.container}>
      {/* Two big translucent circles peeking in from the corners. */}
      <View
        style={[
          styles.blob,
          { width: blobSize, height: blobSize, borderRadius: blobSize / 2 },
          { top: -blobSize * 0.5, left: -blobSize * 0.25 },
        ]}
      />
      <View
        style={[
          styles.blob,
          { width: blobSize, height: blobSize, borderRadius: blobSize / 2 },
          { bottom: -blobSize * 0.5, right: -blobSize * 0.25, backgroundColor: 'rgba(255,255,255,0.06)' },
        ]}
      />

      <View style={styles.logoWrap}>
        <View style={styles.logoCard}>
          {/* require() bundles the image into the app at build time. */}
          <Image source={require('../../assets/icon.png')} style={styles.logoImg} resizeMode="contain" />
        </View>
        <Text style={styles.title}>Bon Plan</Text>
        <Text style={styles.title}>Bizerte</Text>
      </View>

      {/* A small spinner while the database is still opening. It disappears
          the moment `ready` becomes true, which reassures the user that
          something is happening on a slow first launch. */}
      {!ready && <ActivityIndicator color="rgba(255,255,255,0.8)" style={styles.spinner} />}
    </LinearGradient>
  );
}

// This screen is always blue, so its styles never change with the theme and
// can safely live at module level (unlike every other screen in the app).
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',     // clip the circles that stick out past the edges
  },
  blob: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  logoWrap: { alignItems: 'center' },
  logoCard: {
    width: 110,
    height: 110,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    // iOS reads shadow*, Android reads elevation - set both or it is flat on one.
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  logoImg: { width: 82, height: 82 },
  // No lineHeight here on purpose. React Native scales fontSize with the
  // phone's text-size setting but leaves lineHeight fixed, so the old
  // `lineHeight: 34` made the two title lines overlap at large text sizes.
  title: { color: '#fff', fontSize: 28, fontWeight: '600' },
  spinner: { position: 'absolute', bottom: 64 },
});
