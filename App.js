// ============================================================================
// App.js - ROOT COMPONENT
// Every React Native app has one entry component. This is ours.
// It wraps the whole app in the providers that give every screen access to:
//   - safe area insets (notch, home bar, etc.)
//   - our own Store (favorites, itinerary, theme mode, language)
// Then it renders AppNavigator, which manages all the screens.
// ============================================================================

import React from 'react';                                    // React itself - required in every component
import { StatusBar } from 'expo-status-bar';                  // Controls the phone's top status bar (clock, battery)
import { SafeAreaProvider } from 'react-native-safe-area-context'; // Gives children info about the safe area (avoid notches)
import AppNavigator from './src/navigation/AppNavigator';     // Our navigator: splash -> onboarding -> tabs
import { StoreProvider } from './src/store';                  // Our global state (favorites, itinerary, theme, language)

// Default export = what Expo loads first on app start.
export default function App() {
  return (
    // SafeAreaProvider MUST wrap anything that uses safe area insets (bottom tabs, headers).
    <SafeAreaProvider>
      {/* StoreProvider shares one single state object with every screen via React Context. */}
      <StoreProvider>
        {/* "auto" = dark icons on light backgrounds and vice-versa, managed by system. */}
        <StatusBar style="auto" />
        {/* The actual screens live inside AppNavigator. */}
        <AppNavigator />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
