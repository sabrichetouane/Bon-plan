// ============================================================================
// CategoryListScreen.js - PLACES FOR ONE CATEGORY (grid of cards)
// Navigated to from Home by tapping a category icon. Route param `category`
// tells us which data list to show (food / coffee / nature / ...).
// Features a live search bar, filter chips (All / Top rated / Budget /
// Favorites) and a grid of 2 cards per row. Tapping a card opens PlaceDetail.
// ============================================================================

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  foodPlaces,
  coffeePlaces,
  naturePlaces,
  activityPlaces,
  shoppingPlaces,
  featuredPlaces,
} from '../data/mockData';
import { useTheme, radius, spacing } from '../theme/colors';
import { useStore, useT } from '../store';

// Map from category id -> the data array to show. Beach has no dedicated list
// yet so it falls through to the default (featuredPlaces) inside the component.
const categoryData = {
  food:     foodPlaces,
  coffee:   coffeePlaces,
  nature:   naturePlaces,
  activity: activityPlaces,
  shopping: shoppingPlaces,
};

export default function CategoryListScreen({ navigation, route }) {
  const { colors } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const category = route.params?.category || { id: 'food', label: 'Food' };
  const categoryLabel = t('cat.' + category.id);
  const all = categoryData[category.id] || featuredPlaces;
  const { isFavorite, toggleFavorite } = useStore();

  const filters = [
    { id: 'All', label: t('list.all') },
    { id: 'Top rated', label: t('list.topRated') },
    { id: 'Budget', label: t('list.budget') },
    { id: 'Favorites', label: t('list.favorites') },
  ];

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  // Derived list: apply search + chip filter on top of the raw list.
  // Wrapped in useMemo so it only re-computes when inputs change (perf).
  const data = useMemo(() => {
    let list = all;

    // 1) SEARCH - match by name, category, or location (case-insensitive)
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.location || '').toLowerCase().includes(q)
      );
    }

    // 2) FILTER CHIPS - sort or narrow further
    if (filter === 'Top rated') list = [...list].sort((a, b) => b.rating - a.rating);
    if (filter === 'Budget')
      // price field is '$', '$$', or '$$$' - shorter = cheaper
      list = [...list].sort(
        (a, b) => (a.price?.length || 0) - (b.price?.length || 0)
      );
    if (filter === 'Favorites') list = list.filter((p) => isFavorite(p.id));
    return list;
  }, [all, query, filter, isFavorite]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{categoryLabel}</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setFilter(filter === 'Favorites' ? 'All' : 'Favorites')}
        >
          <Ionicons
            name={filter === 'Favorites' ? 'heart' : 'heart-outline'}
            size={20}
            color={filter === 'Favorites' ? colors.danger : colors.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          placeholder={`${t('list.search')} ${categoryLabel.toLowerCase()}`}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.chipsRow}>
        {filters.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, c.id === filter && styles.chipActive]}
            onPress={() => setFilter(c.id)}
          >
            <Text style={[styles.chipText, c.id === filter && styles.chipTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: spacing.xl }}
        contentContainerStyle={{ paddingBottom: 30, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={34} color={colors.textMuted} />
            <Text style={styles.emptyText}>{t('list.empty')}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const fav = isFavorite(item.id);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('PlaceDetail', { place: item })}
            >
              <Image
                source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                style={styles.img}
              />
              <TouchableOpacity
                style={styles.cardFav}
                onPress={() => toggleFavorite(item.id)}
              >
                <Ionicons
                  name={fav ? 'heart' : 'heart-outline'}
                  size={16}
                  color={fav ? colors.danger : '#fff'}
                />
              </TouchableOpacity>
              <View style={styles.cardBody}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="star" size={11} color={colors.star} />
                  <Text style={styles.metaText}>
                    {item.rating} ({item.reviews})
                  </Text>
                </View>
                <Text style={styles.cat} numberOfLines={1}>
                  {item.category} · {item.price}
                </Text>
                {item.priceRange ? (
                  <Text style={styles.range} numberOfLines={1}>
                    {item.priceRange}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    gap: 8,
  },
  input: { flex: 1, marginLeft: 4, color: colors.text, fontSize: 14 },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.chipIdle,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  img: { width: '100%', height: 130, backgroundColor: colors.surface },
  cardFav: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: 10 },
  name: { fontSize: 13, fontWeight: '700', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  metaText: { fontSize: 11, color: colors.textSecondary, marginLeft: 4 },
  cat: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  range: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: colors.textMuted, marginTop: 10, fontWeight: '500' },
});
