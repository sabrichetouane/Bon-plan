// ============================================================================
// MapScreen.js - THE REAL MAP (Map tab)
//
// Uses react-native-maps, which wraps Apple Maps on iOS and Google Maps on
// Android. One coloured marker per place, category chips to filter them, and
// a card at the bottom describing whichever marker is selected.
//
// NOTE: this screen needs a real device or Expo Go. Maps do not render in a
// web browser, so `npx expo start --web` will show an empty area here.
//
// FOUR BUGS FIXED:
//
// 1. `tracksViewChanges={false}` was a fixed `false`. That freezes the marker's
//    picture the first time it is drawn, so the "selected marker grows by 15%"
//    effect never actually appeared. It is now true only while a marker is
//    changing, then back to false (which is what keeps the map fast).
//
// 2. The bottom card started already open on the first place and could never
//    be closed - the map had no onPress. Now it starts closed, tapping the map
//    dismisses it, and changing the filter clears a selection that is no
//    longer visible.
//
// 3. The search box did nothing. It now filters the markers as you type.
//
// 4. `mode` was read from the theme and never used, which is why the map tiles
//    stayed bright white in dark mode while everything around them went dark.
//    A dark map style is applied now.
// ============================================================================

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, radius, spacing } from '../theme/colors';
import { useRTL } from '../theme/rtl';
import { useT } from '../store';
import { resolveImage } from '../data/assetRegistry';
import * as placeRepo from '../db/placeRepo';

import Screen from '../components/Screen';
import SearchField from '../components/SearchField';
import Chip from '../components/Chip';
import IconButton from '../components/IconButton';
import { DARK_MAP_STYLE } from '../theme/mapStyle';

// The centre of Bizerte. The map opens here and the locate button returns here.
const CITY_CENTER = { latitude: 37.2744, longitude: 9.8739 };

// Which Ionicons icon to draw inside a marker, per category.
const MARKER_ICONS = {
  food: 'restaurant',
  coffee: 'cafe',
  beach: 'umbrella',
  nature: 'leaf',
  activity: 'compass',
  shopping: 'bag',
};

export default function MapScreen({ navigation }) {
  // `mode` is 'light' or 'dark'. It was previously read and ignored.
  const { colors, mode } = useTheme();
  // Arabic mirrors the floating controls and the bottom card. The map itself
  // and its markers are never mirrored - a map is not text. In English and
  // French every rtl.* value is empty, so nothing moves at all.
  const rtl = useRTL();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  // Starts as null = no card showing. The old code started on places[0], so a
  // card was on screen from the first frame and could never be dismissed.
  const [selected, setSelected] = useState(null);

  // useRef gives us a handle on the MapView so we can tell it to move the
  // camera. Changing a ref does NOT re-render the screen, which is exactly
  // what we want for something imperative like "pan the map".
  const mapRef = useRef(null);

  // -------------------------------------------------------------------------
  // Load every place that has coordinates.
  // -------------------------------------------------------------------------
  const load = useCallback(async () => {
    try {
      const [placeRows, categoryRows] = await Promise.all([
        placeRepo.listMapPlaces(),
        placeRepo.listCategories(),
      ]);
      setPlaces(placeRows);
      setCategories(categoryRows);
    } catch (e) {
      console.warn('[MapScreen] load failed:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // -------------------------------------------------------------------------
  // visible - the markers actually drawn, after the chip filter and the search.
  //
  // useMemo means this list is only recalculated when one of those three
  // things changes, not on every render. With 30 markers it hardly matters;
  // with 3000 it would.
  // -------------------------------------------------------------------------
  const visible = useMemo(() => {
    let list = places;

    if (filter !== 'all') {
      list = list.filter((place) => place.categoryId === filter);
    }

    // .trim() before .toLowerCase() so a trailing space still matches.
    const needle = query.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (place) =>
          place.name.toLowerCase().includes(needle) ||
          (place.location || '').toLowerCase().includes(needle)
      );
    }

    return list;
  }, [places, filter, query]);

  // -------------------------------------------------------------------------
  // focusOn(place) - select a marker and slide the camera to it.
  // The two "delta" numbers are how much of the world to show; smaller = more
  // zoomed in.
  // -------------------------------------------------------------------------
  const focusOn = (place) => {
    setSelected(place);
    mapRef.current?.animateToRegion(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      500   // how long the slide takes, in milliseconds
    );
  };

  // Back to the whole city.
  const recenter = () => {
    setSelected(null);
    mapRef.current?.animateToRegion(
      { ...CITY_CENTER, latitudeDelta: 0.15, longitudeDelta: 0.15 },
      500
    );
  };

  // Changing the filter must also clear a selection that is about to vanish -
  // otherwise you pick "Shopping" and the card for a restaurant stays on
  // screen while its marker disappears.
  const handleFilter = (categoryId) => {
    setFilter(categoryId);
    if (selected && categoryId !== 'all' && selected.categoryId !== categoryId) {
      setSelected(null);
    }
  };

  // Build the chip list: an "All" chip, then one per category from the database.
  const chips = [
    { id: 'all', label: t('list.all'), icon: 'grid' },
    ...categories.map((cat) => ({ id: cat.id, label: t('cat.' + cat.id), icon: cat.icon })),
  ];

  return (
    // No 'top' edge: the map itself should fill the screen edge to edge and
    // run under the status bar. The floating controls handle their own inset.
    <Screen edges={['left', 'right']} style={styles.screen}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{ ...CITY_CENTER, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
        showsUserLocation
        showsMyLocationButton={false}
        // Tapping empty map dismisses the bottom card. This is the piece that
        // was missing, which made the card impossible to close.
        onPress={() => setSelected(null)}
        // In dark mode, recolour the map tiles so they match the rest of the
        // app. Passing an empty array leaves the normal light map alone.
        customMapStyle={mode === 'dark' ? DARK_MAP_STYLE : []}
      >
        {visible.map((place) => {
          const isActive = selected?.id === place.id;
          return (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              onPress={() => focusOn(place)}
              // TRUE only for the selected marker. Marker pictures are cached
              // for speed; `false` everywhere meant the selected marker's
              // larger size never got redrawn. Letting only the active one
              // update keeps the map fast AND makes the effect visible.
              tracksViewChanges={isActive}
            >
              <View
                style={[
                  styles.marker,
                  { backgroundColor: place.color },
                  isActive && styles.markerActive,
                ]}
              >
                <Ionicons
                  name={MARKER_ICONS[place.categoryId] || 'location'}
                  size={14}
                  color="#fff"
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* ---------- FLOATING TOP BAR ----------
          rtl.row moves the locate button to the left in Arabic, so the search
          box still begins on the side the reader starts from. */}
      <View style={[styles.topBar, rtl.row]}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={t('common.search')}
          onClear={() => setQuery('')}
          variant="card"
          style={styles.search}
        />
        <IconButton
          name="locate"
          size={20}
          color={colors.primary}
          diameter={44}
          background={colors.card}
          onPress={recenter}
          circleStyle={styles.shadow}
          accessibilityLabel="Recenter map"
        />
      </View>

      {/* ---------- CATEGORY CHIPS ---------- */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {chips.map((chip) => (
            <Chip
              key={chip.id}
              label={chip.label}
              icon={chip.icon}
              variant="floating"
              active={chip.id === filter}
              onPress={() => handleFilter(chip.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* A small counter, so it is obvious when a filter has hidden everything
          rather than the map simply failing to load. */}
      {visible.length === 0 && (
        <View style={[styles.noResults, rtl.row]}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <Text style={[styles.noResultsText, rtl.text]}>{t('list.empty')}</Text>
        </View>
      )}

      {/* ---------- BOTTOM CARD ---------- */}
      {selected && (
        <View style={styles.sheet}>
          {/* The little grey handle, a familiar "this is a sheet" signal. */}
          <View style={styles.sheetHandle} />

          {/* rtl.row mirrors the whole card in Arabic: photo on the right, the
              go button on the left. The map behind it is left untouched. */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.sheetRow, rtl.row]}
            onPress={() => navigation.navigate('PlaceDetail', { placeId: selected.id })}
          >
            <Image source={resolveImage(selected.image)} style={styles.sheetImage} />

            {/* flex:1 + minWidth:0 lets these lines shrink instead of pushing
                the arrow button off the right edge on a narrow phone. */}
            <View style={styles.sheetText}>
              <Text style={[styles.sheetName, rtl.text]} numberOfLines={1}>
                {selected.name}
              </Text>
              <View style={[styles.sheetMeta, rtl.row]}>
                <Ionicons name="star" size={11} color={colors.star} />
                <Text style={[styles.sheetMetaText, rtl.text]} numberOfLines={1}>
                  {selected.rating} · {selected.category}
                </Text>
              </View>
              <View style={[styles.sheetMeta, rtl.row]}>
                <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                <Text style={[styles.sheetMetaText, rtl.text]} numberOfLines={1}>
                  {selected.location}
                </Text>
              </View>
            </View>

            {/* An arrow inside a button points the way the reader moves, so it
                flips in Arabic. rtl.arrowIcon picks the matching icon name. */}
            <View style={[styles.goButton, { backgroundColor: selected.color }]}>
              <Ionicons name={rtl.arrowIcon} size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { backgroundColor: colors.mapBackdrop },
    map: { flex: 1 },

    // A shadow recipe reused by the floating controls. Both properties are
    // needed: iOS reads shadow*, Android reads elevation.
    shadow: {
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },

    marker: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#fff',
    },
    markerActive: { transform: [{ scale: 1.25 }], borderWidth: 3 },

    topBar: {
      position: 'absolute',
      // 52 clears the status bar on both platforms. Using a plain number here
      // rather than a safe-area inset keeps the map itself full-bleed.
      top: 52,
      left: spacing.lg,
      right: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    search: { flex: 1 },

    chipsWrap: { position: 'absolute', top: 108, left: 0, right: 0 },
    chipsRow: { paddingHorizontal: spacing.lg, gap: 8 },

    noResults: {
      position: 'absolute',
      top: 168,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    noResultsText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },

    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.card,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 8,
    },
    sheetHandle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 14,
    },
    sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sheetImage: {
      width: 54,
      height: 54,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
    },
    sheetText: { flex: 1, minWidth: 0 },
    sheetName: { fontSize: 14, fontWeight: '700', color: colors.text },
    sheetMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    sheetMetaText: { fontSize: 11, color: colors.textMuted, flexShrink: 1 },
    goButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
  });
