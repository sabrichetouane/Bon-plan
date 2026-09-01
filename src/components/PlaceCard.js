// ============================================================================
// components/PlaceCard.js - THE PLACE CARD, IN ITS THREE SHAPES
//
// The same card was written four times across the app, with four sets of
// styles. Here it is once, with a `variant` prop choosing the shape:
//
//   'carousel'  tall card for the Home screen's horizontal "Popular" row
//   'grid'      square-ish card for the 2-column Category list
//   'row'       wide horizontal card for the Home screen's "Nearby" list
//
// RESPONSIVE FIXES BUILT IN:
//  - the carousel card's width is a fraction of the screen, not a hard 170pt,
//    so it does not become a postage stamp on a tablet
//  - images use aspectRatio instead of a fixed height, so they keep their
//    shape at any width
//  - every text has numberOfLines and can shrink, so long French and Arabic
//    names do not push the price off the edge
// ============================================================================

import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing } from '../theme/colors';
import { resolveImage } from '../data/assetRegistry';
import IconButton from './IconButton';

// ---------------------------------------------------------------------------
// Props:
//   place        the place object from the database
//   variant      'carousel' | 'grid' | 'row'
//   onPress      open the detail screen
//   isFavorite   true -> filled red heart
//   onToggleFavorite  if given, a heart button appears on the photo
//   showStatus   true -> show a Pending/Hidden badge (used on "my places")
//   t            the translator function, for the word "reviews"
// ---------------------------------------------------------------------------
export default function PlaceCard({
  place,
  variant = 'grid',
  onPress,
  isFavorite = false,
  onToggleFavorite,
  showStatus = false,
  t = (k) => k,
  style,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // useWindowDimensions re-runs whenever the screen size changes - on rotation,
  // on a foldable opening, in Android split-screen. The old code read the size
  // once when the app loaded, so it never updated.
  const { width } = useWindowDimensions();

  // Carousel cards: about 46% of the screen, so you always see roughly two
  // and a bit - the visual hint that says "this scrolls sideways".
  // Math.min/Math.max stop it becoming silly on very small or very large screens.
  const carouselWidth = Math.min(240, Math.max(150, width * 0.46));

  // The image, turned from a stored text key back into something <Image> can
  // show. See data/assetRegistry.js for why this step exists.
  const imageSource = resolveImage(place.image);

  // ---- The horizontal "row" shape, used by the Nearby list ----------------
  if (variant === 'row') {
    return (
      <TouchableOpacity style={[styles.rowCard, style]} onPress={onPress} activeOpacity={0.85}>
        <Image source={imageSource} style={styles.rowImage} />

        <View style={styles.rowBody}>
          <Text style={styles.rowName} numberOfLines={1}>
            {place.name}
          </Text>

          <View style={styles.metaLine}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {place.location}
            </Text>
          </View>

          <View style={styles.rowBottom}>
            {/* flexShrink:1 lets this half give way when space runs out... */}
            <View style={styles.stars}>
              <Ionicons name="star" size={12} color={colors.star} />
              <Text style={styles.starsText} numberOfLines={1}>
                {place.rating} · {place.reviews} {t('list.reviews')}
              </Text>
            </View>
            {/* ...while flexShrink:0 keeps the price fully readable. */}
            <Text style={styles.price} numberOfLines={1}>
              {place.price}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ---- The 'carousel' and 'grid' shapes share almost everything ------------
  const isCarousel = variant === 'carousel';

  return (
    <TouchableOpacity
      style={[styles.card, isCarousel ? { width: carouselWidth } : styles.gridCard, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View>
        <Image
          source={imageSource}
          style={isCarousel ? styles.carouselImage : styles.gridImage}
        />

        {/* The rating badge, floating on the photo. */}
        <View style={styles.ratingTag}>
          <Ionicons name="star" size={11} color={colors.star} />
          <Text style={styles.ratingTagText}>{place.rating}</Text>
        </View>

        {/* The heart, only when the screen passed a handler for it. */}
        {onToggleFavorite && (
          <IconButton
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={16}
            diameter={28}
            background="rgba(0,0,0,0.4)"
            color={isFavorite ? colors.danger : '#fff'}
            onPress={onToggleFavorite}
            style={styles.favouritePosition}
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          />
        )}

        {/* Pending / hidden badge, for a user looking at their own submissions. */}
        {showStatus && place.status !== 'approved' && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: place.status === 'pending' ? colors.warning : colors.textMuted },
            ]}
          >
            <Text style={styles.statusText}>
              {place.status === 'pending' ? t('status.pending') : t('status.hidden')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>

        {isCarousel ? (
          <View style={styles.metaLine}>
            <Ionicons name="location-outline" size={11} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {place.location}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.metaLine}>
              <Ionicons name="star" size={11} color={colors.star} />
              <Text style={styles.metaText} numberOfLines={1}>
                {place.rating} ({place.reviews})
              </Text>
            </View>
            <Text style={styles.categoryLine} numberOfLines={1}>
              {place.category} · {place.price}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    // --- shared card shell ---
    card: {
      borderRadius: radius.lg,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',      // clips the photo to the rounded corners
    },
    // In a 2-column FlatList each card takes half the row. maxWidth: '48%'
    // is what stops a lone card on an odd-numbered last row from stretching
    // across the whole width - the bug where 7 food places looked wrong.
    gridCard: { flex: 1, maxWidth: '48%' },

    // aspectRatio instead of a fixed height: the image keeps its proportions
    // whatever width the card ends up being.
    carouselImage: { width: '100%', aspectRatio: 17 / 11, backgroundColor: colors.surface },
    gridImage: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.surface },

    body: { padding: 10 },
    name: { fontSize: 13, fontWeight: '700', color: colors.text },

    metaLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    metaText: { fontSize: 11, color: colors.textMuted, flexShrink: 1 },
    categoryLine: { fontSize: 11, color: colors.textMuted, marginTop: 3 },

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
    ratingTagText: { fontSize: 11, fontWeight: '600', color: '#0F1226' },

    // The heart's TAP BOX is 44pt, so we pull it up and right by the extra
    // space to keep the visible 28pt circle exactly where it was designed.
    favouritePosition: { position: 'absolute', top: 0, right: 0 },

    statusBadge: {
      position: 'absolute',
      bottom: 8,
      left: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    // --- the wide horizontal row ---
    rowCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowImage: {
      width: 78,
      height: 78,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
    },
    // minWidth: 0 is the piece people forget. Without it a flex child refuses
    // to shrink below the width of its own content, so numberOfLines never
    // gets a chance to cut the text and it overflows instead.
    rowBody: { flex: 1, marginLeft: 12, minWidth: 0 },
    rowName: { fontSize: 14, fontWeight: '700', color: colors.text },
    rowBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
    },
    stars: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, minWidth: 0 },
    starsText: { fontSize: 11, color: colors.textSecondary, flexShrink: 1 },
    price: { fontSize: 12, color: colors.primary, fontWeight: '700', flexShrink: 0 },
  });
