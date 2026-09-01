// ============================================================================
// AppNavigator.js - SCREEN ROUTING
// React Navigation is the standard library for moving between screens.
// We use two navigator types:
//   1) Stack  - top-level flow (splash -> onboarding -> main app)
//   2) Tabs   - bottom tabs inside the main app (Home / Map / Itinerary / Profile)
// ============================================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';              // MUST wrap all navigators once
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // stack factory (push/pop)
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';    // tabs factory
import { Ionicons } from '@expo/vector-icons';                               // icon set used in tabs

// Screens - each file is a React component that renders one full-screen view.
import SplashScreen         from '../screens/SplashScreen';
import Onboarding1          from '../screens/Onboarding1';
import Onboarding2          from '../screens/Onboarding2';
import ChooseCity           from '../screens/ChooseCity';
import HomeScreen           from '../screens/HomeScreen';
import CategoryListScreen   from '../screens/CategoryListScreen';
import PlaceDetailScreen    from '../screens/PlaceDetailScreen';
import ItineraryScreen      from '../screens/ItineraryScreen';
import MapScreen            from '../screens/MapScreen';
import ProfileScreen        from '../screens/ProfileScreen';
import { useTheme } from '../theme/colors';   // for colored tab bar
import { useT } from '../store';              // for translated tab labels

// Make two empty navigator objects - you register screens below.
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ---------------------------------------------------------------------------
// MainTabs - the bottom tab bar (visible after login flow)
// ---------------------------------------------------------------------------
function MainTabs() {
  const { colors } = useTheme();    // current light/dark palette
  const t = useT();                  // translator function
  return (
    <Tab.Navigator
      // screenOptions is a function so it can read props for each tab.
      screenOptions={({ route }) => ({
        headerShown: false,                     // no default top header - we draw our own
        tabBarActiveTintColor: colors.primary,  // selected tab color
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,         // bar bg matches theme
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        // Each tab picks an icon from Ionicons based on its route name.
        tabBarIcon: ({ color, size }) => {
          const iconMap = {
            Home: 'home',
            Map: 'map',
            Itinerary: 'calendar',
            Profile: 'person',
          };
          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}
    >
      {/* tabBarLabel is translated via t(). Change language -> label re-renders. */}
      <Tab.Screen name="Home"      component={HomeScreen}      options={{ tabBarLabel: t('tab.home') }} />
      <Tab.Screen name="Map"       component={MapScreen}       options={{ tabBarLabel: t('tab.map') }} />
      <Tab.Screen name="Itinerary" component={ItineraryScreen} options={{ tabBarLabel: t('tab.itinerary') }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}   options={{ tabBarLabel: t('tab.profile') }} />
    </Tab.Navigator>
  );
}

// ---------------------------------------------------------------------------
// AppNavigator - exported root. Stack of everything with initialRouteName = Splash.
// ---------------------------------------------------------------------------
export default function AppNavigator() {
  return (
    // NavigationContainer is required exactly once at the root.
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"                        // first screen on launch
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {/* Linear flow: splash -> onboarding -> choose city -> main app */}
        <Stack.Screen name="Splash"       component={SplashScreen} />
        <Stack.Screen name="Onboarding1"  component={Onboarding1} />
        <Stack.Screen name="Onboarding2"  component={Onboarding2} />
        <Stack.Screen name="ChooseCity"   component={ChooseCity} />
        {/* "Main" is the tabs. Once we reach it, user can switch between tabs freely. */}
        <Stack.Screen name="Main"         component={MainTabs} />
        {/* These screens are pushed ON TOP of Main when the user taps something. */}
        <Stack.Screen name="CategoryList" component={CategoryListScreen} />
        <Stack.Screen name="PlaceDetail"  component={PlaceDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
