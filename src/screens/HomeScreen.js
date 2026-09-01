// ============================================================================
// HomeScreen.js - MAIN LANDING SCREEN (Home tab)
// Layout (top -> bottom):
//   1. Header: city pill + notification bell
//   2. Search bar
//   3. Horizontal row of category icons (tapping opens CategoryList)
//   4. Blue banner promoting the itinerary planner
//   5. Horizontal "Popular" carousel
//   6. Vertical "Nearby" list
// ============================================================================

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categories, featuredPlaces } from '../data/mockData';
import { useTheme, radius, spacing } from '../theme/colors';
import { useT } from '../store';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();   // theme-aware palette (light/dark)
  const t = useT();                 // translator: t('home.popular') etc.
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // activeCategory is only used visually to highlight the tapped category.
  // Tapping also navigates the user to the CategoryList screen.
  const [activeCategory, setActiveCategory] = useState('food');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* --- HEADER --- City pill (left) + notification bell (right) */}
        <View style={styles.header}>
          <View>
            <View style={styles.cityPill}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={styles.cityText}>Bizerte</Text>
              <Ionicons name="chevron-down" size={14} color={colors.text} />
            </View>
          </View>
          <TouchableOpacity style={styles.bell}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        {/* --- SEARCH BAR --- purely decorative for now (no onChange handler) */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
          />
          <Ionicons name="options-outline" size={18} color={colors.textMuted} />
        </View>

        {/* --- CATEGORIES --- horizontal scroll of icons, each navigates to CategoryList */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {categories.map((cat) => {
            const active = cat.id === activeCategory;
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryItem}
                onPress={() => {
                  setActiveCategory(cat.id);
                  navigation.navigate('CategoryList', { category: cat });
                }}
              >
                <View
                  style={[
                    styles.categoryCircle,
                    { backgroundColor: active ? colors.primary : colors.primarySoft },
                  ]}
                >
                  <Ionicons
                    name={cat.icon}
                    size={22}
                    color={active ? '#fff' : colors.primary}
                  />
                </View>
                <Text style={styles.categoryLabel}>{t('cat.' + cat.id)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* --- BANNER --- big blue CTA that jumps to the Itinerary tab */}
        <TouchableOpacity
          style={styles.banner}
          onPress={() => navigation.navigate('Itinerary')}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>{t('home.planTitle')}</Text>
            <Text style={styles.bannerSub}>{t('home.planSub')}</Text>
          </View>
          <View style={styles.bannerArrow}>
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* --- POPULAR --- horizontal carousel of the top featured places */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.popular')}</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 14 }}
        >
          {featuredPlaces.slice(0, 3).map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.popularCard}
              onPress={() => navigation.navigate('PlaceDetail', { place: p })}
            >
              <Image source={typeof p.image === 'string' ? { uri: p.image } : p.image} style={styles.popularImage} />
              <View style={styles.ratingTag}>
                <Ionicons name="star" size={11} color={colors.star} />
                <Text style={styles.ratingTagText}>{p.rating}</Text>
              </View>
              <View style={styles.popularInfo}>
                <Text style={styles.popularName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.popularLoc} numberOfLines={1}>
                  <Ionicons name="location-outline" size={11} color={colors.textMuted} />{' '}
                  {p.location}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* --- NEARBY --- vertical list of all featured places */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.nearby')}</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: 30 }}>
          {featuredPlaces.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.listCard}
              onPress={() => navigation.navigate('PlaceDetail', { place: p })}
            >
              <Image source={typeof p.image === 'string' ? { uri: p.image } : p.image} style={styles.listImg} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.listName}>{p.name}</Text>
                <Text style={styles.listMeta}>
                  <Ionicons name="location-outline" size={12} color={colors.textMuted} />{' '}
                  {p.location}
                </Text>
                <View style={styles.listBottom}>
                  <View style={styles.stars}>
                    <Ionicons name="star" size={12} color={colors.star} />
                    <Text style={styles.starsText}>
                      {p.rating} · {p.reviews} {t('list.reviews')}
                    </Text>
                  </View>
                  <Text style={styles.listPrice}>{p.price}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  cityText: {
    color: colors.text,
    fontWeight: '600',
    marginHorizontal: 6,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    gap: 8,
  },
  input: {
    flex: 1,
    marginLeft: 4,
    color: colors.text,
    fontSize: 14,
  },
  categoriesRow: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: 18,
  },
  categoryItem: { alignItems: 'center', marginRight: 14 },
  categoryCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 18 },
  bannerArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  seeAll: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  popularCard: {
    width: 170,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  popularImage: {
    width: '100%',
    height: 110,
    backgroundColor: colors.surface,
  },
  ratingTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 3,
  },
  popularInfo: { padding: 10 },
  popularName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  popularLoc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
  listCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listImg: {
    width: 78,
    height: 78,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  listName: { fontSize: 14, fontWeight: '700', color: colors.text },
  listMeta: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  listBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starsText: { fontSize: 11, color: colors.textSecondary, marginLeft: 4 },
  listPrice: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
});
