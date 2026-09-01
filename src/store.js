// ============================================================================
// store.js - GLOBAL STATE, NOW BACKED BY THE DATABASE
//
// WHAT "GLOBAL STATE" MEANS:
// Some information is needed by many screens at once - who is logged in, which
// places are favorited, what language the app is in. Passing that down through
// props from screen to screen would be painful. React Context solves it: we
// put the data in a "box" at the top of the app, and any screen can reach in.
//
// WHAT CHANGED FROM THE OLD VERSION:
// The old store kept everything in memory, so closing the app erased it.
// Now every change is written to SQLite through the db/*Repo.js files, and
// read back when the app starts. This file is the layer in between: it holds
// the current values in React state (so screens re-render instantly) AND
// saves them to the database (so they survive).
//
// The pattern used everywhere below is "optimistic update":
//   1. change the value on screen immediately  -> feels instant
//   2. write it to the database in the background
//   3. if the write failed, put the old value back
// ============================================================================

import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { lightColors, darkColors, ThemeContext } from './theme/colors';
import { translate } from './i18n';

// The database helpers. Each file handles one subject; see db/CLAUDE.md.
import { getDb } from './db/database';
import * as userRepo from './db/userRepo';
import * as favoriteRepo from './db/favoriteRepo';
import * as planRepo from './db/planRepo';

// The box that holds everything except the theme.
// ThemeContext is imported from theme/colors.js rather than made here, to
// avoid two files importing each other in a circle.
const StoreContext = createContext(null);

// ---------------------------------------------------------------------------
// StoreProvider - wraps the whole app (see App.js).
// Everything inside it can call useStore(), useT() or useTheme().
// ---------------------------------------------------------------------------
export function StoreProvider({ children }) {
  // === BOOT STATE ==========================================================
  // `ready` is false while we open the database and look for a saved session.
  // App.js shows a loading screen until it turns true. Without this, screens
  // would briefly render with no user and flash the login screen at someone
  // who is actually logged in.
  const [ready, setReady] = useState(false);

  // The logged-in user, or null when nobody is. This one value decides which
  // screens the navigator shows.
  const [user, setUser] = useState(null);

  // === DATA ================================================================
  // A Set of place ids this user has hearted. A Set is used because checking
  // "is this one in there?" is instant, and we do that for every card on screen.
  const [favorites, setFavorites] = useState(new Set());

  // The day-plan currently open on the Itinerary tab, with its activities.
  const [plan, setPlan] = useState(null);

  // === PREFERENCES =========================================================
  // These have sensible defaults so the login screen looks right before anyone
  // has logged in. Once a user logs in we replace them with that user's saved
  // choices, and every later change is written back to their row.
  const [themeMode, setThemeMode] = useState('light');
  const [language, setLanguageState] = useState('en');
  const [city, setCityState] = useState('Bizerte');

  // -------------------------------------------------------------------------
  // A small helper used all over this file.
  // `user?.id` means "user's id, but do not crash if user is null".
  // -------------------------------------------------------------------------
  const userId = user?.id ?? null;
  const isAdmin = user?.role === 'admin';

  // =========================================================================
  // LOADING A USER'S DATA
  // =========================================================================

  // loadUserData(nextUser) - pull everything that belongs to one user.
  // Called after login, after signup, and once at startup for a saved session.
  //
  // useCallback tells React "this function only changes if nothing in [] does",
  // so it keeps the same identity between renders. That stops the useEffect
  // below from re-running forever.
  const loadUserData = useCallback(async (nextUser) => {
    // Nobody logged in: clear everything and go back to default preferences.
    if (!nextUser) {
      setUser(null);
      setFavorites(new Set());
      setPlan(null);
      setThemeMode('light');
      setLanguageState('en');
      setCityState('Bizerte');
      return;
    }

    setUser(nextUser);

    // Adopt the preferences saved on this user's row.
    setThemeMode(nextUser.themeMode || 'light');
    setLanguageState(nextUser.language || 'en');
    setCityState(nextUser.city || 'Bizerte');

    // Promise.all runs both database reads AT THE SAME TIME instead of waiting
    // for the first to finish before starting the second. Two trips in the
    // time of one.
    const [favoriteIds, todayPlan] = await Promise.all([
      favoriteRepo.getFavoriteIds(nextUser.id),
      planRepo.getOrCreateTodayPlan(nextUser.id),
    ]);

    setFavorites(favoriteIds);
    setPlan(todayPlan);
  }, []);

  // =========================================================================
  // STARTUP
  // =========================================================================

  // useEffect with an empty [] runs ONCE, right after the app first renders.
  // This is where we open the database and check for a saved login.
  useEffect(() => {
    // A flag so we never call setState after this component is gone. If the
    // user closes the app mid-load, React warns about updating an unmounted
    // component - this prevents that.
    let cancelled = false;

    async function boot() {
      try {
        // Opening the database also creates the tables and seeds the starter
        // places the very first time. See db/database.js.
        await getDb();

        // Was somebody logged in last time? Returns the user, or null.
        const savedUser = await userRepo.restoreSession();

        if (!cancelled) await loadUserData(savedUser);
      } catch (error) {
        // If the database cannot open, we still let the app start - it will
        // simply show the login screen. Logging it means we can see why.
        console.warn('[store] startup failed:', error);
      } finally {
        // Whether it worked or not, stop showing the loading screen.
        if (!cancelled) setReady(true);
      }
    }

    boot();

    // The function returned from useEffect runs when the component unmounts.
    return () => {
      cancelled = true;
    };
  }, [loadUserData]);

  // =========================================================================
  // AUTHENTICATION
  // =========================================================================

  // signUp / logIn both return { ok, error } so the screen can show a message.
  const signUp = useCallback(
    async (form) => {
      const result = await userRepo.signUp(form);
      if (result.ok) await loadUserData(result.user);
      return result;
    },
    [loadUserData]
  );

  const logIn = useCallback(
    async (form) => {
      const result = await userRepo.logIn(form);
      if (result.ok) await loadUserData(result.user);
      return result;
    },
    [loadUserData]
  );

  const logOut = useCallback(async () => {
    await userRepo.logOut();       // delete the session row
    await loadUserData(null);      // clear everything held in memory
  }, [loadUserData]);

  // refreshUser() - reload the user row after editing the profile, so the
  // name shown on the Profile screen updates immediately.
  const refreshUser = useCallback(async () => {
    if (!userId) return;
    const fresh = await userRepo.findUserById(userId);
    if (fresh) setUser(fresh);
  }, [userId]);

  // =========================================================================
  // FAVORITES
  // =========================================================================

  // isFavorite(placeId) - true/false. Same name and behaviour as the old
  // in-memory version, so the screens using it did not have to change.
  const isFavorite = useCallback((placeId) => favorites.has(placeId), [favorites]);

  // toggleFavorite(placeId) - heart on/off.
  const toggleFavorite = useCallback(
    async (placeId) => {
      if (!userId) return false;      // not logged in: nothing to save

      // STEP 1 - update the screen right away so the heart fills instantly.
      // We build a NEW Set rather than editing the old one, because React only
      // re-renders when it sees a different object.
      const willBeFavorite = !favorites.has(placeId);
      setFavorites((previous) => {
        const next = new Set(previous);
        if (willBeFavorite) next.add(placeId);
        else next.delete(placeId);
        return next;
      });

      // STEP 2 - write it to the database.
      try {
        await favoriteRepo.toggleFavorite(userId, placeId);
      } catch (error) {
        // STEP 3 - the write failed, so undo the visual change. Otherwise the
        // heart would look saved when it is not.
        console.warn('[store] toggleFavorite failed:', error);
        setFavorites((previous) => {
          const next = new Set(previous);
          if (willBeFavorite) next.delete(placeId);
          else next.add(placeId);
          return next;
        });
        return !willBeFavorite;
      }

      return willBeFavorite;
    },
    [userId, favorites]
  );

  // =========================================================================
  // THE DAY PLAN (ITINERARY)
  // =========================================================================

  // refreshPlan() - re-read the open plan from the database.
  // Called after any change, so the screen always shows the true saved state.
  const refreshPlan = useCallback(async () => {
    if (!userId) return;
    const fresh = plan?.id
      ? await planRepo.getPlan(plan.id)
      : await planRepo.getOrCreateTodayPlan(userId);
    setPlan(fresh);
  }, [userId, plan?.id]);

  // openPlan(planId) - switch the Itinerary tab to a different plan.
  const openPlan = useCallback(async (planId) => {
    const next = await planRepo.getPlan(planId);
    setPlan(next);
    return next;
  }, []);

  // addToItinerary(place) - the "Add to itinerary" button on a place.
  const addToItinerary = useCallback(
    async (place) => {
      if (!userId) return { ok: false, error: 'notLoggedIn' };

      // Make sure a plan exists to add to (a brand-new user has none yet).
      let target = plan;
      if (!target) {
        target = await planRepo.getOrCreateTodayPlan(userId);
        setPlan(target);
      }

      const result = await planRepo.addPlaceToPlan({ planId: target.id, place });
      if (result.ok) {
        // Re-read the plan so the new row appears with its real database id.
        setPlan(await planRepo.getPlan(target.id));
      }
      return result;
    },
    [userId, plan]
  );

  // addBlankActivity() - the "+ Add activity" button.
  const addBlankActivity = useCallback(async () => {
    if (!userId) return { ok: false, error: 'notLoggedIn' };

    let target = plan;
    if (!target) {
      target = await planRepo.getOrCreateTodayPlan(userId);
    }

    const result = await planRepo.addBlankItem(target.id);
    setPlan(await planRepo.getPlan(target.id));
    return result;
  }, [userId, plan]);

  // removeFromItinerary(itemId) - the trash button on an activity.
  const removeFromItinerary = useCallback(
    async (itemId) => {
      await planRepo.removePlanItem(itemId);
      if (plan?.id) setPlan(await planRepo.getPlan(plan.id));
    },
    [plan?.id]
  );

  // updateItineraryItem(itemId, changes) - save an edited activity.
  const updateItineraryItem = useCallback(
    async (itemId, changes) => {
      const result = await planRepo.updatePlanItem({ itemId, ...changes });
      if (result.ok && plan?.id) setPlan(await planRepo.getPlan(plan.id));
      return result;
    },
    [plan?.id]
  );

  // moveItineraryItem(itemId, direction) - reorder with the up/down arrows.
  const moveItineraryItem = useCallback(
    async (itemId, direction) => {
      await planRepo.movePlanItem({ itemId, direction });
      if (plan?.id) setPlan(await planRepo.getPlan(plan.id));
    },
    [plan?.id]
  );

  // clearItinerary() - the "Clear all" option.
  const clearItinerary = useCallback(async () => {
    if (!plan?.id) return;
    await planRepo.clearPlanItems(plan.id);
    setPlan(await planRepo.getPlan(plan.id));
  }, [plan?.id]);

  // =========================================================================
  // PREFERENCES - each one updates the screen AND saves to the user's row
  // =========================================================================

  const setLanguage = useCallback(
    (nextLanguage) => {
      setLanguageState(nextLanguage);                       // instant on screen
      if (userId) userRepo.savePreferences({ userId, language: nextLanguage });
      // Note: no await. Saving a preference is not worth making the UI wait for.
    },
    [userId]
  );

  const setMode = useCallback(
    (nextMode) => {
      setThemeMode(nextMode);
      if (userId) userRepo.savePreferences({ userId, themeMode: nextMode });
    },
    [userId]
  );

  const toggleTheme = useCallback(() => {
    // Work out the opposite of the current mode, then reuse setMode so the
    // saving logic lives in exactly one place.
    setMode(themeMode === 'light' ? 'dark' : 'light');
  }, [themeMode, setMode]);

  const setCity = useCallback(
    (nextCity) => {
      setCityState(nextCity);
      if (userId) userRepo.savePreferences({ userId, city: nextCity });
    },
    [userId]
  );

  // =========================================================================
  // BUILDING THE VALUE HANDED TO EVERY SCREEN
  // =========================================================================

  // useMemo rebuilds this object only when something in the list at the bottom
  // actually changes. Without it, a brand-new object every render would make
  // every screen re-render every time, for no reason.
  const storeValue = useMemo(
    () => ({
      // --- boot ---
      ready,

      // --- who is logged in ---
      user,
      userId,
      isAdmin,
      isLoggedIn: Boolean(user),

      // --- auth actions ---
      signUp,
      logIn,
      logOut,
      refreshUser,

      // --- language ---
      language,
      setLanguage,
      // t('key') is the translator every screen uses for its text.
      t: (key) => translate(key, language),

      // --- city ---
      city,
      setCity,

      // --- favorites ---
      favorites,
      isFavorite,
      toggleFavorite,

      // --- the day plan ---
      plan,
      // userItinerary keeps the OLD name so existing screens keep working.
      // `?? []` means "an empty list if there is no plan", so screens can
      // always call .map on it without checking for null first.
      userItinerary: plan?.items ?? [],
      refreshPlan,
      openPlan,
      addToItinerary,
      addBlankActivity,
      removeFromItinerary,
      updateItineraryItem,
      moveItineraryItem,
      clearItinerary,
    }),
    [
      ready,
      user,
      userId,
      isAdmin,
      signUp,
      logIn,
      logOut,
      refreshUser,
      language,
      setLanguage,
      city,
      setCity,
      favorites,
      isFavorite,
      toggleFavorite,
      plan,
      refreshPlan,
      openPlan,
      addToItinerary,
      addBlankActivity,
      removeFromItinerary,
      updateItineraryItem,
      moveItineraryItem,
      clearItinerary,
    ]
  );

  // The theme is memoised separately, so switching to dark mode does not
  // rebuild the favorites/plan object and re-render screens that do not care.
  const themeValue = useMemo(
    () => ({
      mode: themeMode,
      colors: themeMode === 'dark' ? darkColors : lightColors,
      setMode,
      toggle: toggleTheme,
    }),
    [themeMode, setMode, toggleTheme]
  );

  // Both boxes wrap the app, so useTheme() and useStore() both work anywhere.
  return (
    <ThemeContext.Provider value={themeValue}>
      <StoreContext.Provider value={storeValue}>{children}</StoreContext.Provider>
    </ThemeContext.Provider>
  );
}

// ===========================================================================
// HOOKS - how screens read the store
// ===========================================================================

// useStore() - the full store.
//   const { user, isFavorite, toggleFavorite } = useStore();
export function useStore() {
  const context = useContext(StoreContext);
  // This error only fires if someone renders a screen outside <StoreProvider>,
  // which is a programming mistake. Failing loudly here is much easier to
  // debug than a mysterious "cannot read property of null" later.
  if (!context) throw new Error('useStore must be used inside <StoreProvider>');
  return context;
}

// useT() - shortcut when a component only needs to translate text.
//   const t = useT();
//   <Text>{t('home.popular')}</Text>
export function useT() {
  const context = useContext(StoreContext);
  // Fall back to showing the raw key, so a component used outside the provider
  // renders something readable instead of crashing.
  return context?.t || ((key) => key);
}

// useAuth() - shortcut for the login-related parts only.
// Used by the navigator to decide which screens to show.
export function useAuth() {
  const { ready, user, userId, isAdmin, isLoggedIn, signUp, logIn, logOut } = useStore();
  return { ready, user, userId, isAdmin, isLoggedIn, signUp, logIn, logOut };
}
