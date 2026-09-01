// ============================================================================
// components/Screen.js - THE SAFE-AREA SHELL EVERY SCREEN SITS IN
//
// THE PROBLEM THIS FIXES:
// Every screen used to start with <SafeAreaView> imported from 'react-native'.
// That component is deprecated, and - more importantly - it does NOTHING on
// Android: React Native defines it as `Platform.select({ ios: ..., default: View })`,
// so on Android it is literally a plain <View>. The result was that headers,
// back buttons and the map's top bar were drawn UNDER the status bar and the
// camera punch-hole on every Android phone.
//
// The fix is the SafeAreaView from 'react-native-safe-area-context', which
// works on both platforms. That package was already installed, and App.js
// already mounts its <SafeAreaProvider> - nothing was using it.
//
// WHAT IS A "SAFE AREA"?
// The part of the screen nothing is covering: below the notch / status bar,
// above the home indicator, inside the rounded corners. An "inset" is how many
// points to keep clear on one side.
// ============================================================================

// React, plus useMemo - the hook that caches a computed value between renders.
import React, { useMemo } from 'react';
// StyleSheet.create turns a plain object of styles into an optimised one.
import { StyleSheet } from 'react-native';
// THE important import: this SafeAreaView, from the safe-area-context package,
// is the one that actually works on Android. Importing the same name from
// 'react-native' is the bug described in the header above.
import { SafeAreaView } from 'react-native-safe-area-context';
// Gives us the current palette (light or dark) chosen in the store.
import { useTheme } from '../theme/colors';

// ---------------------------------------------------------------------------
// Props:
//   edges  - which sides to keep clear. Defaults to top/left/right, which is
//            what the four TAB screens need: the tab bar already handles the
//            bottom, and padding it twice leaves a dead strip above the bar.
//              * full-screen pages (login, onboarding): add 'bottom'
//              * PlaceDetail: pass ['bottom'] only, so the hero photo can run
//                edge-to-edge under the status bar on purpose
//   style  - extra styles merged over the default background
// ---------------------------------------------------------------------------
export default function Screen({
  // `children` is whatever the caller wrote between <Screen> and </Screen>.
  children,
  // `= [...]` is a DEFAULT value: used only when the caller passes no `edges`.
  edges = ['top', 'left', 'right'],
  // Optional extra styling from the caller.
  style,
  // `...rest` collects every other prop (testID, onLayout, ...) into one object
  // so we can forward them, instead of listing every prop React Native accepts.
  ...rest
}) {
  // Read the active colour palette; this re-runs whenever the theme changes.
  const { colors } = useTheme();
  // Rebuild the stylesheet ONLY when `colors` changes. Without useMemo we would
  // call StyleSheet.create on every single render, which is pure waste.
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    // The array form [a, b] merges styles - later entries win, so a caller's
    // `style` can override the default background when it needs to.
    <SafeAreaView
      style={[styles.screen, style]}
      // Tells the library which sides to pad with the device inset.
      edges={edges}
      // Spreads the forwarded props back on as if they were written here.
      {...rest}
    >
      {/* Renders the screen's own content inside the padded area. */}
      {children}
    </SafeAreaView>
  );
}

// A FACTORY, not a plain stylesheet: it takes `colors` and returns the styles.
// The project rule is that any style mentioning a colour must be built this
// way, because a module-level StyleSheet.create would freeze the light-mode
// colours at import time and never follow a switch to dark mode.
const makeStyles = (colors) =>
  StyleSheet.create({
    // flex: 1 = "take all the space you can". Without it the screen would
    // shrink to fit its content and the background would not reach the bottom.
    screen: { flex: 1, backgroundColor: colors.background },
  });
