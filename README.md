# Bon Plan Bizerte

React Native (Expo) mobile app for discovering the best places in Bizerte, Tunisia.

## Screens

- Splash screen (animated logo, auto-advance)
- Onboarding 1 — "Find what's nearby"
- Onboarding 2 — "Customize your travel"
- Choose City — select your destination
- Home — categories, featured & nearby places
- Category List — browse all places in a category
- Place Detail — photos, reviews, stats, CTA
- Itinerary — day-by-day trip planner
- Map — interactive mock map with pins

## Getting started

```bash
npm install
npx expo start
```

Press `a` for Android, `i` for iOS simulator, or scan the QR with Expo Go.

## Structure

```
src/
  navigation/    Stack + bottom tabs
  screens/       All UI screens
  theme/         Colors, spacing, radius
  data/          Mock content
```

## Stack

- Expo SDK 52
- React Navigation 7 (native-stack + bottom-tabs)
- expo-linear-gradient
- @expo/vector-icons (Ionicons)
