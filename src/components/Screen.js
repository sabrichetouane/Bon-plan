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

import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
export default function Screen({ children, edges = ['top', 'left', 'right'], style, ...rest }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    // The array form [a, b] merges styles - later entries win, so a caller's
    // `style` can override the default background when it needs to.
    <SafeAreaView style={[styles.screen, style]} edges={edges} {...rest}>
      {children}
    </SafeAreaView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    // flex: 1 = "take all the space you can". Without it the screen would
    // shrink to fit its content and the background would not reach the bottom.
    screen: { flex: 1, backgroundColor: colors.background },
  });
