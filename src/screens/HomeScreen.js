// ============================================================================
// HomeScreen.js - THE LANDING SCREEN (Home tab)
//
// Layout, top to bottom:
//   1. Header: the city pill (now tappable) + a favorites button
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
import { useRTL } from '../theme/rtl';
import { useStore, useT } from '../store';
import * as placeRepo from '../db/placeRepo';

import Screen from '../components/Screen';
import SearchField from '../components/SearchField';
import PlaceCard from '../components/PlaceCard';
import IconButton from '../components/IconButton';
import { SectionHeader, Loading, EmptyState } from '../components/Feedback';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  // useRTL() hands back tiny style pieces that mirror the layout in Arabic.
  // In English and French every one of them is null, so nothing moves there.
  const rtl = useRTL();
  const t = useT();
  const { city, favorites, isFavorite, toggleFavorite, isLoggedIn } = useStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // --- What is on screen ---------------------------------------------------
  const [categories, setCategories] = useState([]);   // the 6 category circles
  const [featured, setFeatured] = useState([]);       // the "Popular" carousel
  const [nearby, setNearby] = useState([]);           // the "Nearby" list

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
      const [cats, featuredRows, allRows] = await Promise.all([
        placeRepo.listCategories(),
        placeRepo.listPlaces({ featuredOnly: true, limit: 6 }),
        placeRepo.listPlaces({ limit: 12 }),
      ]);

      setCategories(cats);
      setFeatured(featuredRows);
      setNearby(allRows);
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
        {/* ---------- HEADER ----------
            The original layout: the city pill on the left, a round button on
            the right. The only difference now is that both of them work - the
            pill opens the city picker, and the button opens your favorites. */}
        {/* rtl.row flips this row in Arabic: the city pill moves to the right
            edge and the favorites button to the left. It does nothing in
            English or French. */}
        <View style={[styles.header, rtl.row]}>
          {/* The city pill. It used to be a plain View with a chevron that led
              nowhere; it is a real button now, and it shows the city you
              actually chose instead of a hardcoded "Bizerte". */}
          {/* Inside the pill: the pin, the city name and the chevron read
              right-to-left in Arabic. */}
          <TouchableOpacity
            style={[styles.cityPill, rtl.row]}
            onPress={() => navigation.navigate('ChooseCity', { fromProfile: true })}
            hitSlop={hitSlopFor(28)}
          >
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={[styles.cityText, rtl.text]} numberOfLines={1}>
              {city}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.text} />
          </TouchableOpacity>

          {/* The round button on the right. It used to have no onPress at all.
              It now opens your saved favorites, and the little red dot appears
              only when you actually have some. */}
          <View>
            <IconButton
              name="heart-outline"
              size={22}
              diameter={40}
              onPress={() => navigation.navigate(isLoggedIn ? 'Favorites' : 'Login')}
              accessibilityLabel={t('fav.title')}
            />
            {/* pointerEvents="none" lets a tap pass straight THROUGH the dot to
                the button underneath, so the dot can never swallow a press. */}
            {favorites.size > 0 && <View style={styles.badge} pointerEvents="none" />}
          </View>
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
            {/* rtl.row lays the circles out starting from the right in Arabic. */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.categoriesRow, rtl.row]}
            >
              {categories.map((cat) => (
                // rtl.marginEnd puts the gap AFTER each circle, which is the
                // right side in English and the left side in Arabic.
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryItem, rtl.marginEnd(14)]}
                  onPress={() => navigation.navigate('CategoryList', { category: cat })}
                >
                  <View style={styles.categoryCircle}>
                    <Ionicons name={cat.icon} size={22} color={colors.primary} />
                  </View>
                  {/* Already centred, so it only needs the right-to-left hint. */}
                  <Text style={[styles.categoryLabel, rtl.textCenter]} numberOfLines={1}>
                    {/* t('cat.' + id) builds the key at runtime, e.g. 'cat.food'. */}
                    {t('cat.' + cat.id)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* BANNER -> the day planner */}
            {/* rtl.row moves the round arrow to the left end of the banner in
                Arabic, with the text block on the right. */}
            <TouchableOpacity
              style={[styles.banner, rtl.row]}
              onPress={() => navigation.navigate('Main', { screen: 'Itinerary' })}
            >
              <View style={styles.bannerText}>
                <Text style={[styles.bannerTitle, rtl.text]} numberOfLines={2}>
                  {t('home.planTitle')}
                </Text>
                <Text style={[styles.bannerSub, rtl.text]} numberOfLines={3}>
                  {t('home.planSub')}
                </Text>
              </View>
              <View style={styles.bannerArrow}>
                {/* This arrow means "go forward", so it points the way the
                    reader moves - left in Arabic. */}
                <Ionicons name={rtl.arrowIcon} size={18} color={colors.primary} />
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

      {/* ---------- ADD A PLACE ----------
          A floating round button in the bottom-right corner. "Add a place" also
          lives in the Profile menu, but it was buried there and easy to miss -
          this puts it one tap away from the main screen.

          It sits OUTSIDE the ScrollView so it stays put while the page scrolls.
          A guest is sent to log in first, because a submitted place has to be
          attributed to somebody. */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate(isLoggedIn ? 'AddPlace' : 'Login')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('place.addOne')}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
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
      paddingTop: spacing.md,
      gap: spacing.sm,
    },
    cityPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      // flexShrink lets a long city name give way rather than pushing the
      // button on the right off the edge of a narrow screen.
      flexShrink: 1,
    },
    cityText: { color: colors.text, fontWeight: '600', flexShrink: 1 },
    // The little red dot on the favorites button, exactly where the original
    // notification badge sat.
    badge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.danger,
    },

    search: { marginHorizontal: spacing.xl, marginTop: spacing.lg },

    resultsWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },

    categoriesRow: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      gap: 18,
    },
    // The 14px gap that used to be marginRight lives in the JSX now, as
    // rtl.marginEnd(14), so it stays on the correct side when the strip mirrors.
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

    // The floating "add a place" button.
    fab: {
      position: 'absolute',
      right: spacing.xl,
      bottom: spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      // It floats above the content, so it needs a shadow to read as raised.
      // iOS uses shadow*, Android uses elevation - set both or it looks flat
      // on whichever platform you forgot.
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
  });
