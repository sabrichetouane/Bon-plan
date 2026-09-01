// ============================================================================
// store.js - GLOBAL STATE (favorites, itinerary, theme, language)
// We use React Context so any screen can read/update shared state without
// passing props all the way down. For a larger app you'd use Redux/Zustand.
// ============================================================================

import React, { createContext, useContext, useMemo, useState } from 'react';
import { itinerary as seedItinerary } from './data/mockData';         // initial itinerary rows
import { lightColors, darkColors, ThemeContext } from './theme/colors'; // palettes + existing ThemeContext
import { translate } from './i18n';                                    // translator function (EN/FR/AR)

// Context for everything except theme (favorites, itinerary, language, t()).
// ThemeContext is imported from theme/colors.js to avoid circular imports.
const StoreContext = createContext(null);

// ---------------------------------------------------------------------------
// StoreProvider - put this ONCE near the top of the tree (App.js does).
// Everything inside it can call useStore() or useT() to read/change state.
// ---------------------------------------------------------------------------
export function StoreProvider({ children }) {
  // --- STATE --------------------------------------------------------------
  // Set = built-in collection of unique ids. We store favorite place ids here.
  const [favorites, setFavorites] = useState(new Set());
  // User's current day plan. Starts with the sample itinerary from mockData.
  const [userItinerary, setUserItinerary] = useState(seedItinerary);
  // Active theme mode - 'light' or 'dark'. Flipped from Profile screen.
  const [themeMode, setThemeMode] = useState('light');
  // Active UI language. 'en' | 'fr' | 'ar'. Picked from Profile > Language.
  const [language, setLanguage] = useState('en');

  // --- STORE VALUE (memoized so identity only changes when state changes) ---
  const storeValue = useMemo(
    () => ({
      // Language getters/setters + translator
      language,
      setLanguage,
      t: (key) => translate(key, language),   // screens call t('home.popular')

      // Favorites API
      favorites,
      isFavorite: (id) => favorites.has(id),  // true/false shortcut
      toggleFavorite: (id) =>
        setFavorites((prev) => {
          const next = new Set(prev);          // copy so React detects change
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),

      // Itinerary API
      userItinerary,
      addToItinerary: (place) =>
        setUserItinerary((prev) => {
          // Don't add the same place twice - use placeId as dedupe key
          if (prev.some((p) => p.placeId === place.id)) return prev;
          // Auto-pick a time: 2 hours after the previous entry
          const lastTime = prev.length ? prev[prev.length - 1].time : '09:00';
          const [h, m] = lastTime.split(':').map(Number);
          const newH = Math.min(h + 2, 22);
          const time = `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          return [
            ...prev,
            {
              id: 'user-' + Date.now(),        // unique id
              placeId: place.id,               // reference back to the place
              time,
              title: place.name,
              subtitle: place.category + ' · ' + (place.location || ''),
              duration: '1h',
              color: place.color || '#1D2BEF',
            },
          ];
        }),

      // Remove one activity from the plan
      removeFromItinerary: (id) =>
        setUserItinerary((prev) => prev.filter((x) => x.id !== id)),

      // "Add activity" button adds an empty row the user can edit later
      addBlankActivity: () =>
        setUserItinerary((prev) => {
          const lastTime = prev.length ? prev[prev.length - 1].time : '09:00';
          const [h, m] = lastTime.split(':').map(Number);
          const newH = Math.min(h + 1, 22);
          const time = `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          return [
            ...prev,
            {
              id: 'user-' + Date.now(),
              time,
              title: 'New activity',
              subtitle: 'Tap to edit',
              duration: '1h',
              color: '#1D2BEF',
            },
          ];
        }),
    }),
    // Deps: re-compute the object only when state actually changes.
    [favorites, userItinerary, language]
  );

  // --- THEME VALUE ---------------------------------------------------------
  // Separate memo because theme changes are independent from itinerary etc.
  const themeValue = useMemo(
    () => ({
      mode: themeMode,
      colors: themeMode === 'dark' ? darkColors : lightColors,
      setMode: setThemeMode,
      toggle: () => setThemeMode((m) => (m === 'light' ? 'dark' : 'light')),
    }),
    [themeMode]
  );

  // Render both contexts so BOTH are available app-wide.
  return (
    <ThemeContext.Provider value={themeValue}>
      <StoreContext.Provider value={storeValue}>{children}</StoreContext.Provider>
    </ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// HOOKS - the public API for the rest of the app
// ---------------------------------------------------------------------------

// Full store: favorites, itinerary, language, etc.
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

// Shortcut when you only need the translator.
//   const t = useT();
//   return <Text>{t('home.popular')}</Text>
export function useT() {
  const ctx = useContext(StoreContext);
  return ctx?.t || ((k) => k);               // fallback: show the raw key
}
