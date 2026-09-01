// ============================================================================
// CategoryListScreen.js - ALL THE PLACES IN ONE CATEGORY
//
// Opened by tapping a category circle on the Home screen. Shows a search box,
// four filter chips, and a two-column grid of places.
//
// THREE BUGS FIXED HERE:
//
// 1. THE SEARCH IGNORED TRAILING SPACES. The old code checked `query.trim()`
//    but then searched with the UNtrimmed text, so typing "pizza " (with a
//    space) found nothing. The search now happens in SQL, which trims properly.
//
// 2. THE "BUDGET" SORT WAS WRONG. It sorted by the LENGTH of the price text,
//    so 'Free' (4 letters) ranked as more expensive than '$$$' (3). The
//    database now stores a real number, price_tier, and sorts on that.
//
// 3. AN ODD NUMBER OF CARDS STRETCHED THE LAST ONE. With numColumns={2} and
//    `flex: 1`, a lonely final card filled the whole row. Food has 7 places,
//    so this was visible by default. PlaceCard now carries maxWidth: '48%'.
//
// It also gained a category with no places before: "Beach" used to silently
// show the generic featured list, because mockData had no beach array.
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, spacing } from '../theme/colors';
import { useStore, useT } from '../store';
import * as placeRepo from '../db/placeRepo';

import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import SearchField from '../components/SearchField';
import Chip from '../components/Chip';
import PlaceCard from '../components/PlaceCard';
import { Loading, EmptyState } from '../components/Feedback';

// ---------------------------------------------------------------------------
// The filter chips.
//
// NOTE THE SPLIT between `id` and the label. The id is an English word that
// lives only in the code and is compared against; the label is looked up with
// t() and changes with the language. The old version used the visible label as
// the value, so in French the comparison `filter === 'Top rated'` could never
// be true. Keeping the two apart is what prevents that whole class of bug.
// ---------------------------------------------------------------------------
const FILTERS = [
  { id: 'all', labelKey: 'list.all' },
  { id: 'rating', labelKey: 'list.topRated' },
  { id: 'price', labelKey: 'list.budget' },
  { id: 'favorites', labelKey: 'list.favorites' },
];

export default function CategoryListScreen({ navigation, route }) {
  const { colors } = useTheme();
  const t = useT();
  const { userId, isFavorite, toggleFavorite, isLoggedIn } = useStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // The category we were sent. The `||` gives a safe default if the screen is
  // ever opened without params, so it shows something instead of crashing.
  const category = route.params?.category || { id: 'food', label: 'Food' };

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  // -------------------------------------------------------------------------
  // load() - ask the database for this category, with the search and sort
  // applied. Doing the work in SQL rather than in JavaScript means the phone
  // filters and sorts once, efficiently, instead of us copying arrays around.
  // -------------------------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await placeRepo.listPlaces({
        categoryId: category.id,
        search: query,
        // 'rating' and 'price' are sort orders; 'all' and 'favorites' are not,
        // so anything else falls back to the default ordering.
        sort: filter === 'rating' || filter === 'price' ? filter : 'default',
        // Passing a user id makes the query return only that person's favorites.
        favoritesOf: filter === 'favorites' ? userId : null,
      });
      setPlaces(rows);
    } catch (e) {
      console.warn('[CategoryListScreen] load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [category.id, query, filter, userId]);

  // Re-run whenever the screen is shown again, and whenever load() changes -
  // which happens the moment the search text or the chosen chip changes.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // The heart on a card. Guests get sent to log in first.
  const handleToggleFavorite = (placeId) => {
    if (!isLoggedIn) {
      navigation.navigate('Login');
      return;
    }
    toggleFavorite(placeId);
    // If we are LOOKING at the favorites filter, un-hearting something should
    // remove it from the list straight away, so reload.
    if (filter === 'favorites') load();
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title={t('cat.' + category.id)}
        onBack={() => navigation.goBack()}
        // The heart in the header is a shortcut to the favorites filter.
        rightIcon={filter === 'favorites' ? 'heart' : 'heart-outline'}
        rightColor={filter === 'favorites' ? colors.danger : colors.text}
        onRightPress={() => setFilter(filter === 'favorites' ? 'all' : 'favorites')}
      />

      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder={`${t('list.search')} ${t('cat.' + category.id).toLowerCase()}`}
        onClear={() => setQuery('')}
        style={styles.search}
      />

      {/* The filter chips. flexWrap lets them move onto a second line rather
          than being squashed, which matters for the longer French words. */}
      <View style={styles.chipsRow}>
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={t(f.labelKey)}
            active={f.id === filter}
            onPress={() => setFilter(f.id)}
          />
        ))}
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={places}
          // keyExtractor tells React which row is which, so it can reuse rows
          // efficiently when the list changes instead of redrawing everything.
          keyExtractor={(item) => item.id}
          numColumns={2}
          // columnWrapperStyle styles each ROW of the grid; contentContainerStyle
          // styles the whole scrolling area.
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title={t('list.empty')}
              // Explain what to do about it, rather than just stating the fact.
              subtitle={
                filter === 'favorites' ? t('fav.emptySub') : t('comment.emptySub')
              }
            />
          }
          renderItem={({ item }) => (
            <PlaceCard
              place={item}
              variant="grid"
              t={t}
              onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
            />
          )}
        />
      )}
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    search: { marginHorizontal: spacing.xl },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
    },
    column: { gap: 12, paddingHorizontal: spacing.xl },
    list: { paddingBottom: spacing.xxl, gap: 12 },
  });
