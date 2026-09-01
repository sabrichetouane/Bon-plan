// ============================================================================
// AppNavigator.js - SCREEN ROUTING
//
// React Navigation is the standard library for moving between screens.
// We use two navigator types:
//   1) Stack  - screens pushed on top of each other (splash, login, details)
//   2) Tabs   - the bottom bar inside the main app
//
// WHAT CHANGED WITH ACCOUNTS:
//   - the auth screens (login / sign-up / forgot / reset) are registered here
//   - the bottom bar grows a fifth "Admin" tab, but ONLY for admin accounts
//   - the tab bar's safe-area bug is fixed (see the long note further down)
//
// Everything stays in ONE stack rather than swapping stacks on login, because
// this app deliberately lets people browse as a guest. The Splash screen is
// what decides where to send you once the database has been read.
// ============================================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// --- The linear flow before the app proper ---
import SplashScreen from '../screens/SplashScreen';
import Onboarding1 from '../screens/Onboarding1';
import Onboarding2 from '../screens/Onboarding2';
import ChooseCity from '../screens/ChooseCity';

// --- Accounts ---
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

// --- The main app ---
import HomeScreen from '../screens/HomeScreen';
import CategoryListScreen from '../screens/CategoryListScreen';
import PlaceDetailScreen from '../screens/PlaceDetailScreen';
import ItineraryScreen from '../screens/ItineraryScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import AddPlaceScreen from '../screens/AddPlaceScreen';
import MyPlacesScreen from '../screens/MyPlacesScreen';
import MyPlansScreen from '../screens/MyPlansScreen';
import PickPlaceScreen from '../screens/PickPlaceScreen';

// --- Admin ---
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminPlacesScreen from '../screens/admin/AdminPlacesScreen';
import AdminPlansScreen from '../screens/admin/AdminPlansScreen';
import AdminCommentsScreen from '../screens/admin/AdminCommentsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';

import { useTheme } from '../theme/colors';
import { useStore, useT } from '../store';

// Create the two navigator objects. Screens get registered onto them below.
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ---------------------------------------------------------------------------
// MainTabs - the bottom bar
// ---------------------------------------------------------------------------
function MainTabs() {
  const { colors } = useTheme();
  const t = useT();
  // isAdmin decides whether the fifth tab exists at all. An ordinary user
  // never sees it, and because the screen is not registered for them, there is
  // no route they could navigate to by accident either.
  const { isAdmin } = useStore();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,                       // each screen draws its own header
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,

        // ---------------------------------------------------------------
        // THE SAFE-AREA BUG THAT WAS HERE
        //
        // This used to say `height: 64, paddingBottom: 10`. That looks
        // harmless, but inside @react-navigation/bottom-tabs it does two
        // damaging things:
        //
        //  1. getTabBarHeight() checks for a numeric `height` in your style
        //     and, if it finds one, returns it AS IS - skipping the
        //     "+ bottom inset" it would otherwise add.
        //  2. Your tabBarStyle is merged LAST, so `paddingBottom: 10`
        //     overwrote the library's own `paddingBottom: insets.bottom`.
        //
        // Result: on any phone with a home indicator or Android gesture bar
        // (a ~34pt strip at the bottom), the icons and labels were drawn
        // inside that strip - clipped, and competing with the system's own
        // swipe gesture.
        //
        // The fix is simply to NOT set height or paddingBottom, and let the
        // library size the bar using the real device insets.
        // ---------------------------------------------------------------
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11 },

        // Each tab picks its icon from this map, by route name.
        tabBarIcon: ({ color, size }) => {
          const iconMap = {
            Home: 'home',
            Map: 'map',
            Itinerary: 'calendar',
            Profile: 'person',
            Admin: 'shield-checkmark',
          };
          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('tab.home') }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: t('tab.map') }} />
      <Tab.Screen
        name="Itinerary"
        component={ItineraryScreen}
        options={{ tabBarLabel: t('itin.title') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: t('tab.profile') }}
      />

      {/* The admin tab. `{isAdmin && (...)}` means "put this here only if
          isAdmin is true"; otherwise React renders nothing at all. */}
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminDashboardScreen}
          options={{ tabBarLabel: t('admin.title') }}
        />
      )}
    </Tab.Navigator>
  );
}

// ---------------------------------------------------------------------------
// AppNavigator - the root. Every screen in the app is registered here.
// ---------------------------------------------------------------------------
export default function AppNavigator() {
  return (
    // NavigationContainer must wrap all navigators, exactly once.
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {/* ---- Startup + onboarding ---- */}
        {/* SplashScreen waits for the database, then sends the user either to
            onboarding (new) or straight to Main (already logged in). */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding1" component={Onboarding1} />
        <Stack.Screen name="Onboarding2" component={Onboarding2} />
        <Stack.Screen name="ChooseCity" component={ChooseCity} />

        {/* ---- Accounts ---- */}
        {/* 'slide_from_right' here instead of the global 'fade': moving
            between login and sign-up should feel like steps in one flow. */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="Signup"
          component={SignupScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
          options={{ animation: 'slide_from_right' }}
        />

        {/* ---- The app itself ---- */}
        <Stack.Screen name="Main" component={MainTabs} />

        {/* Screens pushed ON TOP of the tabs. They slide in from the right so
            it is obvious they are a layer above, not a tab switch. */}
        <Stack.Screen
          name="CategoryList"
          component={CategoryListScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="PlaceDetail"
          component={PlaceDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="AddPlace"
          component={AddPlaceScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="MyPlaces"
          component={MyPlacesScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="MyPlans"
          component={MyPlansScreen}
          options={{ animation: 'slide_from_right' }}
        />
        {/* Opened from the Itinerary tab: pick a place to drop into the plan. */}
        <Stack.Screen
          name="PickPlace"
          component={PickPlaceScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ animation: 'slide_from_right' }}
        />

        {/* ---- Admin moderation screens ----
            These are registered for everyone, but nothing links to them unless
            the logged-in user is an admin, and each screen checks the role
            again when it opens. Two locks are better than one. */}
        <Stack.Screen
          name="AdminPlaces"
          component={AdminPlacesScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="AdminPlans"
          component={AdminPlansScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="AdminComments"
          component={AdminCommentsScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="AdminUsers"
          component={AdminUsersScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
