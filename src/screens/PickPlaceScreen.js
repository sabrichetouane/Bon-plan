// ============================================================================
// PickPlaceScreen.js - CHOOSE A PLACE TO PUT IN YOUR DAY PLAN
//
// WHY THIS SCREEN EXISTS:
// The Itinerary tab could only add a BLANK activity - a row saying "New
// activity" that you then had to type into yourself. There was no way to say
// "add Crock'in to my Saturday" from inside the planner. You had to leave,
// find the place, open it, and press "Add to itinerary" there.
//
// This screen closes that gap: search or filter the places, tap one, and it
// goes straight into the plan you are looking at.
//
// It reuses the same pieces as the rest of the app - the same search box, the
// same category chips, the same place card - so it looks like it has always
// been there.
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, radius, spacing } from '../theme/colors';
import { useRTL } from '../theme/rtl';
import { useStore, useT } from '../store';
import * as placeRepo from '../db/placeRepo';

import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import SearchField from '../components/SearchField';
import Chip from '../components/Chip';
import PlaceCard from '../components/PlaceCard';
import { Loading, EmptyState } from '../components/Feedback';

export default function PickPlaceScreen({ navigation }) {
  const { colors } = useTheme();
  const rtl = useRTL();
  const t = useT();
  // addToItinerary puts the chosen place into the plan that is currently open
  // on the Itinerary tab. `plan` is that plan, used here only to show its name.
  const { addToItinerary, plan, userItinerary } = useStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');   // 'all' or a category id
  // Which place we are in the middle of adding, so its row can show a spinner
  // and cannot be tapped twice.
  const [adding, setAdding] = useState(null);

  // -------------------------------------------------------------------------
  // load() - fetch the places that match the search box and the chosen chip.
  //
  // useCallback keeps this the same function between renders, so the
  // useFocusEffect below does not restart it forever.
  // -------------------------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Promise.all runs both reads at once instead of one after the other.
      const [placeRows, categoryRows] = await Promise.all([
        placeRepo.listPlaces({
          search: query,
          // null means "every category"; the repo skips the filter entirely.
          categoryId: category === 'all' ? null : category,
        }),
        placeRepo.listCategories(),
      ]);
      setPlaces(placeRows);
      setCategories(categoryRows);
    } catch (e) {
      console.warn('[PickPlaceScreen] load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [query, category]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // -------------------------------------------------------------------------
  // handlePick(place) - add it to the plan and go back.
  // -------------------------------------------------------------------------
  const handlePick = async (place) => {
    setAdding(place.id);
    try {
      const result = await addToItinerary(place);

      if (!result.ok) {
        // The usual reason is that it is already in this plan. Say so rather
        // than silently doing nothing, and stay on the screen so the user can
        // pick something else.
        Alert.alert(t('detail.alreadyTitle'), `${place.name} ${t('detail.alreadyMsg')}`);
        return;
      }

      // Added. Go straight back to the plan so the new row is visible.
      navigation.goBack();
    } catch (e) {
      console.warn('[PickPlaceScreen] add failed:', e);
      Alert.alert(t('common.error'), t('error.saveFailed'));
    } finally {
      setAdding(null);
    }
  };

  // The chip row: "All" plus one per category from the database.
  // The `id` is the English value we compare against; only the label is
  // translated. Mixing those two up is what breaks filters in French.
  const chips = [
    { id: 'all', label: t('list.all'), icon: 'grid' },
    ...categories.map((cat) => ({ id: cat.id, label: t('cat.' + cat.id), icon: cat.icon })),
  ];

  // Which places are already in the plan, so we can mark them.
  // A Set answers "is this one in there?" instantly, however long the list is.
  const alreadyAdded = new Set(userItinerary.map((item) => item.placeId));

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title={t('plan.addPlace')}
        // The plan's own name, so it is obvious WHICH day you are adding to.
        subtitle={plan?.title}
        onBack={() => navigation.goBack()}
      />

      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder={t('home.searchPlaceholder')}
        onClear={() => setQuery('')}
        style={styles.search}
      />

      {/* The category chips. flexWrap lets them run onto a second line rather
          than being squeezed, which matters for the longer French words. */}
      <View style={[styles.chipsRow, rtl.row]}>
        {chips.map((chip) => (
          <Chip
            key={chip.id}
            label={chip.label}
            icon={chip.icon}
            active={chip.id === category}
            onPress={() => setCategory(chip.id)}
          />
        ))}
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="search" title={t('list.empty')} subtitle={t('comment.emptySub')} />
          }
          renderItem={({ item }) => {
            const isAdded = alreadyAdded.has(item.id);
            return (
              <View>
                <PlaceCard
                  place={item}
                  variant="row"
                  t={t}
                  // Tapping the card ADDS it, rather than opening it - that is
                  // the whole job of this screen.
                  onPress={() => handlePick(item)}
                  // Dim a place that is already in the plan so it reads as
                  // unavailable before you tap it.
                  style={isAdded ? styles.added : null}
                />

                {/* A small "already in your plan" tag on top of the card. */}
                {isAdded && (
                  <View style={[styles.addedTag, rtl.row]}>
                    <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                    <Text style={styles.addedTagText}>{t('detail.added')}</Text>
                  </View>
                )}

                {/* While this specific place is being saved. */}
                {adding === item.id && (
                  <View style={styles.savingOverlay}>
                    <Ionicons name="hourglass-outline" size={18} color={colors.primary} />
                  </View>
                )}
              </View>
            );
          }}
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
    list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },

    // 0.55 opacity reads clearly as "not available" without hiding the card.
    added: { opacity: 0.55 },
    addedTag: {
      position: 'absolute',
      top: 14,
      right: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.card,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addedTagText: { fontSize: 10, fontWeight: '700', color: colors.success },

    savingOverlay: {
      // Cover the whole card while it saves, so a second tap cannot land.
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background + 'AA',
      borderRadius: radius.md,
    },
  });
