// ============================================================================
// App.js - ROOT COMPONENT
//
// Every React Native app has one entry component. This is ours. It wraps the
// whole app in the "providers" that give every screen access to shared things:
//
//   SafeAreaProvider - knows how tall the notch, status bar and home indicator
//                      are on this exact device, so components/Screen.js can
//                      keep content clear of them
//   StoreProvider    - our own global state: the logged-in user, favorites,
//                      the day plan, the theme and the language. It is also
//                      what opens the SQLite database on startup.
//
// Then it renders AppNavigator, which owns all the screens.
//
// ORDER MATTERS: SafeAreaProvider must be OUTSIDE StoreProvider, because
// screens deep inside need the safe-area numbers, and a provider can only give
// values to things rendered inside it.
// ============================================================================

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { StoreProvider, useStore } from './src/store';
import { useTheme } from './src/theme/colors';

// ---------------------------------------------------------------------------
// ThemedStatusBar - makes the clock and battery icons readable.
//
// The status bar text is drawn by the phone, not by us, so it does not follow
// our theme automatically. In dark mode the background is nearly black and we
// need WHITE icons; in light mode a white background needs DARK icons.
//
// This has to be a separate small component because it calls useTheme(), and a
// hook can only read a provider that is ABOVE it in the tree - App itself sits
// outside StoreProvider, so it cannot call useTheme() directly.
// ---------------------------------------------------------------------------
function ThemedStatusBar() {
  const { mode } = useTheme();
  // 'light' means light-coloured icons (for a dark background), and vice versa.
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

// ---------------------------------------------------------------------------
// Root - everything that needs the store lives in here.
// ---------------------------------------------------------------------------
function Root() {
  // `ready` becomes true once the database is open and we have checked whether
  // somebody was already logged in. We do not block on it here: the Splash
  // screen is what waits, and it looks far better than a blank white screen.
  useStore();

  return (
    <>
      <ThemedStatusBar />
      <AppNavigator />
    </>
  );
}

// The default export is what Expo loads first when the app starts.
export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
