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

// React itself. Every file that writes JSX (the <Tag> syntax) needs it in
// scope on this React version's classic transform.
import React from 'react';
// Expo's status-bar component: it does not draw the bar, it CONTROLS the
// colour of the clock, battery and signal icons the OS draws.
import { StatusBar } from 'expo-status-bar';
// The provider that measures the device's notch and home-indicator insets.
// It must be mounted once, at the very top - hence here and nowhere else.
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Our own three top-level pieces:
// the navigator that owns every screen in the app...
import AppNavigator from './src/navigation/AppNavigator';
// ...the global store (user, favorites, plan, language) plus its read hook...
import { StoreProvider, useStore } from './src/store';
// ...and the theme hook, used below only to pick the status-bar icon colour.
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
  // `mode` is the string 'light' or 'dark' - the theme the user has chosen.
  // Destructuring `{ mode }` pulls just that one field out of the theme object.
  const { mode } = useTheme();

  // 'light' means light-coloured icons (for a dark background), and vice versa.
  // The `? :` is a ternary: condition ? valueIfTrue : valueIfFalse. It is the
  // only form of "if" that fits inside JSX, which needs an expression.
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

// ---------------------------------------------------------------------------
// Root - everything that needs the store lives in here.
// ---------------------------------------------------------------------------
function Root() {
  // `ready` becomes true once the database is open and we have checked whether
  // somebody was already logged in. We do not block on it here: the Splash
  // screen is what waits, and it looks far better than a blank white screen.
  //
  // Calling useStore() and ignoring the result still has a purpose: it
  // SUBSCRIBES this component to the store, so Root re-renders whenever the
  // user, theme or language changes - which is what ThemedStatusBar below
  // needs in order to follow a theme switch.
  useStore();

  return (
    // <>...</> is a "fragment": a wrapper that groups two elements without
    // adding a real View to the layout. A component may only return ONE root
    // element, and we have two things to render here.
    <>
      {/* Sets the status-bar icon colour for the whole app. Renders nothing. */}
      <ThemedStatusBar />
      {/* Every screen in the app lives inside this one component. */}
      <AppNavigator />
    </>
  );
}

// The default export is what Expo loads first when the app starts.
// `default` means the importer can name it anything; Expo looks for exactly
// this one export in this one file.
export default function App() {
  return (
    // Outermost: measures the device insets. Anything inside can ask for them.
    <SafeAreaProvider>
      {/* Second: opens SQLite, restores the saved session, holds global state.
          It is INSIDE SafeAreaProvider so that screens can use both. */}
      <StoreProvider>
        {/* Root is a child component rather than inline JSX so that it sits
            INSIDE StoreProvider and can therefore call useStore(). A hook only
            sees providers that are above it in the tree, never beside it. */}
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
