// ============================================================================
// FavoritesScreen.js - THE PLACES YOU HEARTED
//
// This screen did not exist before, which was a real hole in the app: you
// could ADD a favorite from two places, but there was nowhere to SEE them.
// The only trace was a filter chip buried inside one category list and a
// number on the Profile screen.
//
// It is a 2-column grid, the same one used by the category list, so it looks
// like a natural part of the app rather than a bolted-on extra.
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, spacing } from '../theme/colors';
import { useStore, useT } from '../store';
import * as placeRepo from '../db/placeRepo';

import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import SearchField from '../components/SearchField';
import PlaceCard from '../components/PlaceCard';
import { Loading, EmptyState } from '../components/Feedback';

export default function FavoritesScreen({ navigation }) {
  const { colors } = useTheme();
  const t = useT();
  const { userId, isFavorite, toggleFavorite } = useStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // -------------------------------------------------------------------------
  // load() - ask for every approved place THIS USER has favorited.
  //
  // `favoritesOf: userId` is what does the work: inside placeRepo it adds an
  // "EXISTS (...)" check to the query, so the filtering happens in the
  // database rather than by fetching everything and sifting it in JavaScript.
  // -------------------------------------------------------------------------
  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const rows = await placeRepo.listPlaces({ favoritesOf: userId, search: query });
      setPlaces(rows);
    } catch (e) {
      console.warn('[FavoritesScreen] load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [userId, query]);

  // useFocusEffect rather than useEffect: coming back here after un-hearting
  // something on the detail screen should show the updated list.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Un-hearting from this screen should make the card disappear, so we reload
  // straight after the change rather than leaving a stale card on screen.
  const handleToggleFavorite = async (placeId) => {
    await toggleFavorite(placeId);
    load();
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={t('fav.title')} onBack={() => navigation.goBack()} />

      {/* The search box is only worth showing once there is a list worth
          searching - a single favorite does not need filtering. */}
      {places.length > 3 || query ? (
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={t('common.search')}
          onClear={() => setQuery('')}
          style={styles.search}
        />
      ) : null}

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title={t('fav.emptyTitle')}
              subtitle={t('fav.emptySub')}
              // Give the empty state something to DO, rather than leaving the
              // user on a dead end.
              action={{
                label: t('fav.explore'),
                onPress: () => navigation.navigate('Main', { screen: 'Home' }),
              }}
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
    search: { marginHorizontal: spacing.xl, marginBottom: spacing.md },
    column: { gap: 12, paddingHorizontal: spacing.xl },
    list: { paddingBottom: spacing.xxl, gap: 12, paddingTop: spacing.sm },
  });
