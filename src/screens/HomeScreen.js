// ============================================================================
// HomeScreen.js - THE LANDING SCREEN (Home tab)
//
// Layout, top to bottom:
//   1. Header: a greeting, the city pill (now tappable), a favorites shortcut
//   2. Search bar - NOW WORKING. It used to be decorative.
//   3. Horizontal row of category circles
//   4. Blue banner that opens the day planner
//   5. "Popular" horizontal carousel
//   6. "Nearby" vertical list
//
// WHAT CHANGED: every list on this screen used to come from a hardcoded array
// in mockData.js. Now it is read from the SQLite database, which means:
//   - the places a user adds appear here once an admin approves them
//   - a place an admin hides disappears
//   - there is a real (brief) loading moment, so the screen has a spinner
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, radius, spacing, hitSlopFor } from '../theme/colors';
import { useStore, useT } from '../store';
import * as placeRepo from '../db/placeRepo';

import Screen from '../components/Screen';
import SearchField from '../components/SearchField';
import PlaceCard from '../components/PlaceCard';
import IconButton from '../components/IconButton';
import { SectionHeader, Loading, EmptyState } from '../components/Feedback';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const t = useT();
  const { city, user, isFavorite, toggleFavorite, isLoggedIn } = useStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // --- What is on screen ---------------------------------------------------
  const [categories, setCategories] = useState([]);   // the 6 category circles
  const [featured, setFeatured] = useState([]);       // the "Popular" carousel
  const [nearby, setNearby] = useState([]);           // the "Nearby" list
  const [counts, setCounts] = useState({});           // how many places per category

  // --- Screen state --------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // pull-to-refresh spinner
  const [query, setQuery] = useState('');              // what is typed in the search box
  const [results, setResults] = useState(null);        // null = not searching

  // -------------------------------------------------------------------------
  // load() - read everything this screen needs from the database.
  //
  // useCallback keeps this the SAME function between renders. That matters
  // because useFocusEffect below depends on it - a brand-new function every
  // render would make the effect restart forever.
  // -------------------------------------------------------------------------
  const load = useCallback(async () => {
    try {
      // Promise.all runs all four queries AT THE SAME TIME rather than waiting
      // for each to finish before starting the next. Four trips in the time of one.
      const [cats, featuredRows, allRows, countRows] = await Promise.all([
        placeRepo.listCategories(),
        placeRepo.listPlaces({ featuredOnly: true, limit: 6 }),
        placeRepo.listPlaces({ limit: 12 }),
        placeRepo.countPlacesByCategory(),
      ]);

      setCategories(cats);
      setFeatured(featuredRows);
      setNearby(allRows);
      setCounts(countRows);
    } catch (e) {
      console.warn('[HomeScreen] load failed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // useFocusEffect runs every time this screen comes back into view - not just
  // once like useEffect. So after adding a place or approving one, coming back
  // here shows the change.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // -------------------------------------------------------------------------
  // SEARCH - this is the feature that was missing entirely.
  //
  // Every keystroke asks the database for matches. That is fine at this size
  // (30 places, a local file). With thousands of rows you would add a short
  // delay - a "debounce" - so it only searches once the user stops typing.
  // -------------------------------------------------------------------------
  const handleSearch = async (text) => {
    setQuery(text);

    // Empty box -> stop searching and show the normal screen again.
    if (!text.trim()) {
      setResults(null);
      return;
    }

    try {
      const found = await placeRepo.listPlaces({ search: text });
      setResults(found);
    } catch (e) {
      console.warn('[HomeScreen] search failed:', e);
    }
  };

  // Pull down on the list to reload.
  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  // openPlace(place) - go to the detail screen.
  // We pass only the ID, not the whole place object. The old code passed the
  // whole object, which worked by luck; an id is what a saved link or a
  // notification would carry, and the detail screen looks it up itself.
  const openPlace = (place) => navigation.navigate('PlaceDetail', { placeId: place.id });

  // The heart on a card. Favorites belong to an account, so a guest is asked
  // to log in first rather than tapping a heart that silently does nothing.
  const handleToggleFavorite = (placeId) => {
    if (!isLoggedIn) {
      navigation.navigate('Login');
      return;
    }
    toggleFavorite(placeId);
  };

  // The very first load, before anything is on screen.
  if (loading) {
    return (
      <Screen>
        <Loading label={t('common.loading')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* ---------- HEADER ---------- */}
        <View style={styles.header}>
          {/* flex:1 + minWidth:0 so a long name shrinks instead of pushing the
              buttons off the right edge of a small screen. */}
          <View style={styles.headerLeft}>
            <Text style={styles.greeting} numberOfLines={1}>
              {/* Show the person's first name when logged in, otherwise a
                  neutral greeting. .split(' ')[0] takes the first word. */}
              {user ? `${t('home.nearby')} · ${user.name.split(' ')[0]}` : 'Bon Plan Bizerte'}
            </Text>

            {/* The city pill. It used to be a plain View with a chevron that
                did nothing - now it really opens the city picker. */}
            <TouchableOpacity
              style={styles.cityPill}
              onPress={() => navigation.navigate('ChooseCity', { fromProfile: true })}
              hitSlop={hitSlopFor(28)}
            >
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={styles.cityText} numberOfLines={1}>
                {city}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* The bell used to do nothing. It now opens saved favorites, which
              is a real destination the app was missing. */}
          <IconButton
            name="heart-outline"
            size={20}
            diameter={40}
            onPress={() => navigation.navigate(isLoggedIn ? 'Favorites' : 'Login')}
            accessibilityLabel={t('fav.title')}
          />
        </View>

        {/* ---------- SEARCH ---------- */}
        <SearchField
          value={query}
          onChangeText={handleSearch}
          placeholder={t('home.searchPlaceholder')}
          onClear={() => handleSearch('')}
          style={styles.search}
        />

        {/* When the user is searching we replace the whole page with results.
            `results !== null` means "a search is active" - an empty ARRAY still
            counts as searching (it means "nothing matched"), which is why we
            check against null rather than length. */}
        {results !== null ? (
          <View style={styles.resultsWrap}>
            {results.length === 0 ? (
              <EmptyState
                icon="search"
                title={t('list.empty')}
                subtitle={t('comment.emptySub')}
              />
            ) : (
              results.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  variant="row"
                  t={t}
                  onPress={() => openPlace(place)}
                />
              ))
            )}
          </View>
        ) : (
          // ---------- THE NORMAL PAGE ----------
          <>
            {/* CATEGORY CIRCLES */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryItem}
                  onPress={() => navigation.navigate('CategoryList', { category: cat })}
                >
                  <View style={styles.categoryCircle}>
                    <Ionicons name={cat.icon} size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.categoryLabel} numberOfLines={1}>
                    {/* t('cat.' + id) builds the key at runtime, e.g. 'cat.food'. */}
                    {t('cat.' + cat.id)}
                  </Text>
                  {/* How many places are in this category - the screen used to
                      give no hint that some were nearly empty. */}
                  <Text style={styles.categoryCount}>{counts[cat.id] || 0}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* BANNER -> the day planner */}
            <TouchableOpacity
              style={styles.banner}
              onPress={() => navigation.navigate('Main', { screen: 'Itinerary' })}
            >
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle} numberOfLines={2}>
                  {t('home.planTitle')}
                </Text>
                <Text style={styles.bannerSub} numberOfLines={3}>
                  {t('home.planSub')}
                </Text>
              </View>
              <View style={styles.bannerArrow}>
                <Ionicons name="arrow-forward" size={18} color={colors.primary} />
              </View>
            </TouchableOpacity>

            {/* POPULAR - horizontal carousel.
                "See all" now works: it opens the first category. */}
            <SectionHeader
              title={t('home.popular')}
              actionLabel={t('home.seeAll')}
              onActionPress={() =>
                categories[0] && navigation.navigate('CategoryList', { category: categories[0] })
              }
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
            >
              {featured.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  variant="carousel"
                  t={t}
                  onPress={() => openPlace(place)}
                  isFavorite={isFavorite(place.id)}
                  onToggleFavorite={() => handleToggleFavorite(place.id)}
                />
              ))}
            </ScrollView>

            {/* NEARBY - vertical list */}
            <SectionHeader
              title={t('home.nearby')}
              actionLabel={t('home.seeAll')}
              onActionPress={() =>
                categories[0] && navigation.navigate('CategoryList', { category: categories[0] })
              }
            />

            <View style={styles.nearbyList}>
              {nearby.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  variant="row"
                  t={t}
                  onPress={() => openPlace(place)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    // Extra bottom padding so the last card is not hidden behind the tab bar.
    scrollContent: { paddingBottom: spacing.xxl },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      gap: spacing.sm,
    },
    headerLeft: { flex: 1, minWidth: 0, gap: 6 },
    greeting: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
    cityPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      // alignSelf keeps the pill only as wide as its text, instead of
      // stretching across the whole header.
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    cityText: { color: colors.text, fontWeight: '600', flexShrink: 1 },

    search: { marginHorizontal: spacing.xl, marginTop: spacing.lg },

    resultsWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },

    categoriesRow: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      gap: 18,
    },
    categoryItem: { alignItems: 'center', width: 64 },
    categoryCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    categoryLabel: { fontSize: 12, color: colors.text, fontWeight: '500', textAlign: 'center' },
    categoryCount: { fontSize: 10, color: colors.textMuted, marginTop: 1 },

    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.xl,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.primary,
      gap: spacing.md,
    },
    bannerText: { flex: 1, minWidth: 0 },
    bannerTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
    // No lineHeight: it does not grow with the phone's text-size setting, so a
    // fixed value made the French and Arabic text collide at large sizes.
    bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
    bannerArrow: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },

    carousel: { paddingHorizontal: spacing.xl, gap: 14, paddingBottom: 4 },
    nearbyList: { paddingHorizontal: spacing.xl },
  });
