// ============================================================================
// PlaceDetailScreen.js - ONE PLACE IN DETAIL
// Layout (top to bottom):
//   - Full-width hero image with back / share / heart buttons overlaid
//   - Name, location, price badge, price range pill
//   - 3 stats (rating, reviews, open-now)
//   - Optional contact row (phone / website)
//   - About paragraph
//   - Horizontal gallery (3 extra photos)
//   - Reviews list (hardcoded sample)
//   - Sticky footer: "Directions" (opens Maps app) + "Add to itinerary"
// All buttons are wired to real actions via the store / phone APIs.
// ============================================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing } from '../theme/colors';
import { useStore, useT } from '../store';

// Two demo reviews shown at the bottom of every place.
// In a real app these would come from a backend (one row per review in a DB).
const reviews = [
  {
    id: 'r1',
    name: 'Sarra M.',
    time: '2 days ago',
    rating: 5,
    text: 'Amazing spot! The food was outstanding and the view from the terrace was unreal.',
  },
  {
    id: 'r2',
    name: 'Youssef B.',
    time: '1 week ago',
    rating: 4,
    text: 'Great atmosphere and friendly staff. Will definitely come back.',
  },
];

export default function PlaceDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const place = route.params?.place;
  const { isFavorite, toggleFavorite, addToItinerary, userItinerary } = useStore();
  if (!place) return null;

  const fav = isFavorite(place.id);
  const inItinerary = userItinerary.some((i) => i.placeId === place.id);

  // Open the phone's native Maps app centered on this place's coordinates.
  // iOS uses the 'maps:' scheme (Apple Maps); Android uses 'geo:' (any maps app).
  // If both fail we fall back to opening Google Maps in the browser.
  const openDirections = () => {
    if (!place.latitude || !place.longitude) {
      Alert.alert('No coordinates', 'This place has no saved location.');
      return;
    }
    const { latitude, longitude, name } = place;
    const label = encodeURIComponent(name);    // spaces -> %20 for URLs
    const url = Platform.select({
      ios:     `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`)
    );
  };

  // Native share sheet - WhatsApp, Messages, email, copy, etc.
  // React Native's Share API returns a promise so we `await` it.
  const share = async () => {
    try {
      await Share.share({
        title: place.name,
        message: `${place.name} in Bizerte — ${place.location}. Rating ${place.rating}/5.`,
      });
    } catch (e) {
      Alert.alert('Share failed', e.message);
    }
  };

  // 'tel:' URL triggers the phone's dialer. We strip spaces first.
  const callPhone = () => {
    if (place.phone) Linking.openURL(`tel:${place.phone.replace(/\s/g, '')}`);
  };

  // Open the place's website in the default browser.
  // If the stored website misses 'http://', we prepend 'https://'.
  const openWebsite = () => {
    if (place.website) {
      const url = place.website.startsWith('http')
        ? place.website
        : `https://${place.website}`;
      Linking.openURL(url);
    }
  };

  const handleAddToItinerary = () => {
    if (inItinerary) {
      Alert.alert(t('detail.alreadyTitle'), `${place.name} ${t('detail.alreadyMsg')}`);
      return;
    }
    addToItinerary(place);
    Alert.alert(t('detail.addedTitle'), `${place.name} ${t('detail.addedMsg')}`, [
      { text: t('detail.viewItinerary'), onPress: () => navigation.navigate('Main', { screen: 'Itinerary' }) },
      { text: t('detail.ok'), style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <Image
            source={typeof place.image === 'string' ? { uri: place.image } : place.image}
            style={styles.hero}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroTopRow}>
            <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.heroBtn} onPress={share}>
                <Ionicons name="share-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroBtn} onPress={() => toggleFavorite(place.id)}>
                <Ionicons
                  name={fav ? 'heart' : 'heart-outline'}
                  size={20}
                  color={fav ? colors.danger : '#fff'}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{place.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{place.location}</Text>
              </View>
            </View>
            {place.price ? (
              <View style={styles.priceBubble}>
                <Text style={styles.priceText}>{place.price}</Text>
              </View>
            ) : null}
          </View>

          {place.priceRange ? (
            <View style={styles.rangeRow}>
              <Ionicons name="wallet-outline" size={14} color={colors.primary} />
              <Text style={styles.rangeText}>{place.priceRange}</Text>
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="star" size={14} color={colors.star} />
              <Text style={styles.statText}>{place.rating}</Text>
              <Text style={styles.statSub}>{t('detail.rating')}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
              <Text style={styles.statText}>{place.reviews}</Text>
              <Text style={styles.statSub}>{t('list.reviews')}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={14} color={colors.success} />
              <Text style={styles.statText}>{t('detail.open')}</Text>
              <Text style={styles.statSub}>{t('detail.now')}</Text>
            </View>
          </View>

          {(place.phone || place.website) && (
            <View style={styles.contactRow}>
              {place.phone ? (
                <TouchableOpacity style={styles.contactBtn} onPress={callPhone}>
                  <Ionicons name="call-outline" size={16} color={colors.primary} />
                  <Text style={styles.contactText}>{place.phone}</Text>
                </TouchableOpacity>
              ) : null}
              {place.website ? (
                <TouchableOpacity style={styles.contactBtn} onPress={openWebsite}>
                  <Ionicons name="globe-outline" size={16} color={colors.primary} />
                  <Text style={styles.contactText}>{place.website}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          <Text style={styles.sectionHeading}>{t('detail.about')}</Text>
          <Text style={styles.desc}>{place.description}</Text>

          <Text style={styles.sectionHeading}>{t('detail.gallery')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {(place.gallery && place.gallery.length
              ? place.gallery
              : [place.image, place.image, place.image]
            ).map((img, i) => (
              <Image
                key={i}
                source={typeof img === 'string' ? { uri: img } : img}
                style={styles.galleryImg}
              />
            ))}
          </ScrollView>

          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionHeading}>{t('detail.reviews')}</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{r.name[0]}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.reviewName}>{r.name}</Text>
                  <Text style={styles.reviewTime}>{r.time}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name="star"
                      size={12}
                      color={i < r.rating ? colors.star : colors.border}
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewText}>{r.text}</Text>
            </View>
          ))}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={openDirections}>
          <Ionicons name="map-outline" size={18} color={colors.primary} />
          <Text style={styles.secondaryText}>{t('detail.directions')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, inItinerary && styles.primaryBtnDone]}
          onPress={handleAddToItinerary}
        >
          <Ionicons
            name={inItinerary ? 'checkmark' : 'add'}
            size={18}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.primaryText}>
            {inItinerary ? t('detail.added') : t('detail.addItinerary')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroWrap: { position: 'relative' },
  hero: { width: '100%', height: 300, backgroundColor: colors.surface },
  heroOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 100,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroTopRow: {
    position: 'absolute', top: spacing.md, left: spacing.xl, right: spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  heroBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroDots: {
    position: 'absolute', bottom: 14, alignSelf: 'center',
    flexDirection: 'row', gap: 5,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    marginHorizontal: 3, backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: { width: 18, backgroundColor: '#fff' },
  body: {
    padding: spacing.xl, backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  metaText: { fontSize: 12, color: colors.textMuted, marginLeft: 4 },
  priceBubble: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.pill, backgroundColor: colors.primarySoft,
  },
  priceText: { color: colors.primary, fontWeight: '700' },
  rangeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.pill, backgroundColor: colors.primarySoft,
    alignSelf: 'flex-start',
  },
  rangeText: { fontSize: 12, fontWeight: '600', color: colors.primary, marginLeft: 6 },
  statsRow: {
    flexDirection: 'row', marginTop: spacing.lg,
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, justifyContent: 'space-around',
  },
  stat: { alignItems: 'center' },
  statText: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 4 },
  statSub: { fontSize: 11, color: colors.textMuted },
  contactRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md,
  },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.pill,
  },
  contactText: { color: colors.primary, fontSize: 12, fontWeight: '600', marginLeft: 6 },
  sectionHeading: {
    fontSize: 15, fontWeight: '700', color: colors.text,
    marginTop: spacing.xl, marginBottom: spacing.sm,
  },
  desc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  galleryImg: {
    width: 130, height: 90, borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  reviewsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  seeAll: { color: colors.primary, fontWeight: '600', fontSize: 12, marginTop: spacing.xl },
  reviewCard: {
    backgroundColor: colors.card, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 6,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700' },
  reviewName: { fontSize: 13, fontWeight: '700', color: colors.text },
  reviewTime: { fontSize: 11, color: colors.textMuted },
  reviewText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  footer: {
    flexDirection: 'row', padding: spacing.lg, gap: 10,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card,
  },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.primarySoft,
  },
  secondaryText: { color: colors.primary, fontWeight: '600', marginLeft: 6 },
  primaryBtn: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.primary,
  },
  primaryBtnDone: { backgroundColor: colors.success },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
