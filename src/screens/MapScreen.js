// ============================================================================
// MapScreen.js - REAL MAP WITH PINS (Map tab)
// Uses react-native-maps which wraps Apple Maps (iOS) and Google Maps (Android).
// We add one Marker per place at its real lat/lng, plus a filter chip row
// above the map and a bottom sheet card with info on the selected marker.
// ============================================================================

import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { allMapPlaces, CITY_CENTER } from '../data/mockData';
import { useTheme, radius, spacing } from '../theme/colors';
import { useT } from '../store';

const { height } = Dimensions.get('window');

// Chip definitions - shown above the map as a horizontal scroll.
// `key` is the translation key (labels are translated live); `id` matches
// the `kind` field set on each place in mockData.js so we can filter markers.
const FILTER_IDS = [
  { id: 'all',      key: 'list.all',      icon: 'grid' },
  { id: 'food',     key: 'cat.food',      icon: 'restaurant' },
  { id: 'coffee',   key: 'cat.coffee',    icon: 'cafe' },
  { id: 'nature',   key: 'cat.nature',    icon: 'leaf' },
  { id: 'activity', key: 'cat.activity',  icon: 'compass' },
  { id: 'shopping', key: 'cat.shopping',  icon: 'bag' },
];

export default function MapScreen({ navigation }) {
  const { colors, mode } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(allMapPlaces[0]);
  const mapRef = useRef(null);
  const FILTERS = FILTER_IDS.map((f) => ({ ...f, label: t(f.key) }));

  // Live list of pins to draw: either everything or only the selected category.
  const visible = useMemo(
    () => (filter === 'all' ? allMapPlaces : allMapPlaces.filter((p) => p.kind === filter)),
    [filter]
  );

  // When a pin is tapped: select it + smooth-pan the map to center on it.
  // latitudeDelta/longitudeDelta control the zoom (smaller = more zoomed in).
  const focusOn = (p) => {
    setSelected(p);
    mapRef.current?.animateToRegion(
      { latitude: p.latitude, longitude: p.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 },
      500  // animation duration in ms
    );
  };

  // "Locate" FAB - reset camera to the city center at a wider zoom.
  const recenter = () => {
    mapRef.current?.animateToRegion(
      { latitude: CITY_CENTER.latitude, longitude: CITY_CENTER.longitude, latitudeDelta: 0.15, longitudeDelta: 0.15 },
      500
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: CITY_CENTER.latitude,
          longitude: CITY_CENTER.longitude,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {visible.map((p) => {
          const active = selected?.id === p.id;
          return (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              onPress={() => focusOn(p)}
              tracksViewChanges={false}
            >
              <View
                style={[
                  styles.marker,
                  { backgroundColor: p.color, transform: [{ scale: active ? 1.15 : 1 }] },
                ]}
              >
                <Ionicons
                  name={
                    p.kind === 'food'
                      ? 'restaurant'
                      : p.kind === 'coffee'
                      ? 'cafe'
                      : p.kind === 'nature'
                      ? 'leaf'
                      : p.kind === 'activity'
                      ? 'compass'
                      : p.kind === 'shopping'
                      ? 'bag'
                      : 'location'
                  }
                  size={14}
                  color="#fff"
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder={t('list.search')}
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <TouchableOpacity style={styles.circleBtn} onPress={recenter}>
          <Ionicons name="locate" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 8 }}
      >
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(f.id)}
            >
              <Ionicons
                name={f.icon}
                size={14}
                color={active ? '#fff' : colors.text}
              />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom detail card */}
      {selected && (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.detail}
          onPress={() => navigation.navigate('PlaceDetail', { place: selected })}
        >
          <View style={styles.detailHandle} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={
                typeof selected.image === 'string' ? { uri: selected.image } : selected.image
              }
              style={styles.detailImg}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.detailName}>{selected.name}</Text>
              <Text style={styles.detailMeta} numberOfLines={1}>
                <Ionicons name="star" size={11} color={colors.star} /> {selected.rating} ·{' '}
                {selected.category}
              </Text>
              <Text style={styles.detailLoc} numberOfLines={1}>
                <Ionicons name="location-outline" size={11} color={colors.textMuted} />{' '}
                {selected.location}
              </Text>
            </View>
            <View style={[styles.goBtn, { backgroundColor: selected.color }]}>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.mapBackdrop },
  map: { flex: 1 },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  topBar: {
    position: 'absolute',
    top: spacing.md + 10,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 44,
    marginHorizontal: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  input: { flex: 1, marginLeft: 6, color: colors.text, fontSize: 14 },
  chips: {
    position: 'absolute',
    top: spacing.md + 64,
    left: 0,
    right: 0,
    maxHeight: 44,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    marginRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.text, fontSize: 12, fontWeight: '600', marginLeft: 6 },
  chipTextActive: { color: '#fff' },
  detail: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  detailHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  detailImg: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  detailName: { fontSize: 14, fontWeight: '700', color: colors.text },
  detailMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  detailLoc: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  goBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
