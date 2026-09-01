// ============================================================================
// PlaceDetailScreen.js - ONE PLACE, IN FULL
//
// Layout, top to bottom:
//   - a big photo with back / share / heart buttons floating on it
//   - name, address, price
//   - three stats: rating, number of reviews, open now
//   - phone and website buttons (only when the place has them)
//   - the About paragraph
//   - a horizontal photo gallery
//   - REAL REVIEWS written by real users, with a form to add your own
//   - a fixed footer: Directions + Add to itinerary
//
// WHAT CHANGED:
//   - the place is now LOADED BY ID from the database. The old code was handed
//     the whole place object through navigation, which happened to work but
//     breaks the moment a link, a notification or saved state sends only an id.
//   - the reviews were two fake entries ("Sarra M.", "Youssef B.") shown on
//     ALL 30 places. Now they come from the comments table, anyone logged in
//     can write one, and the place's star rating is recalculated from them.
//   - the "See all" next to Reviews did nothing. There is now a real form.
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
  Share,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, radius, spacing } from '../theme/colors';
import { useStore, useT } from '../store';
import { resolveImage } from '../data/assetRegistry';
import * as placeRepo from '../db/placeRepo';
import * as commentRepo from '../db/commentRepo';

import Screen from '../components/Screen';
import IconButton from '../components/IconButton';
import FormField from '../components/FormField';
import { PrimaryButton, SecondaryButton, PressableText, ButtonRow } from '../components/Buttons';
import { Loading, EmptyState, StatusBadge } from '../components/Feedback';

export default function PlaceDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const t = useT();
  const {
    userId,
    isAdmin,
    isLoggedIn,
    isFavorite,
    toggleFavorite,
    addToItinerary,
    userItinerary,
  } = useStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // The hero photo is sized from the real screen width so it keeps its shape
  // on any device, instead of a hardcoded 300pt that looks wrong on a tablet.
  const { width } = useWindowDimensions();
  const heroHeight = Math.min(width * 0.78, 340);

  // Accept either a placeId (the new way) or a whole place object (in case any
  // older navigation call is still around). This is a "graceful upgrade".
  const placeId = route.params?.placeId || route.params?.place?.id;

  const [place, setPlace] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- The review form -----------------------------------------------------
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // -------------------------------------------------------------------------
  // load() - fetch the place and its reviews together.
  // -------------------------------------------------------------------------
  const load = useCallback(async () => {
    if (!placeId) {
      setLoading(false);
      return;
    }
    try {
      const [placeRow, commentRows] = await Promise.all([
        placeRepo.getPlaceById(placeId),
        commentRepo.listComments(placeId),
      ]);
      setPlace(placeRow);
      setComments(commentRows);

      // If this user already reviewed the place, pre-fill the form so the
      // button reads "Edit your review" and their words are already there.
      if (userId) {
        const mine = await commentRepo.getUserComment(userId, placeId);
        if (mine) {
          setRating(mine.rating);
          setReviewText(mine.text);
        }
      }
    } catch (e) {
      console.warn('[PlaceDetailScreen] load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [placeId, userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // =========================================================================
  // ACTIONS
  // =========================================================================

  // openDirections - hand the coordinates to the phone's own maps app.
  const openDirections = () => {
    if (!place?.latitude || !place?.longitude) {
      Alert.alert(t('common.error'), t('place.address'));
      return;
    }

    const label = encodeURIComponent(place.name);   // spaces -> %20, safe in a URL
    const { latitude, longitude } = place;

    // A web link that works everywhere, used as the fallback below.
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    // Platform.select picks a value per platform.
    // NOTE the `default:` entry - without it, `url` was undefined on web and
    // Linking.openURL(undefined) threw BEFORE the .catch below could run.
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
      default: webUrl,
    });

    // If the native maps app is missing, fall back to the browser.
    Linking.openURL(url).catch(() => Linking.openURL(webUrl));
  };

  // share - the phone's native share sheet (WhatsApp, Messages, email...).
  const share = async () => {
    try {
      await Share.share({
        title: place.name,
        message: `${place.name} — ${place.location}. ${t('detail.rating')} ${place.rating}/5.`,
      });
    } catch (e) {
      // The user cancelling the share sheet also lands here; nothing to report.
      console.warn('[PlaceDetailScreen] share cancelled or failed:', e);
    }
  };

  // callPhone - 'tel:' opens the dialer. .replace removes spaces from the
  // stored number, which some dialers refuse.
  const callPhone = () => {
    if (!place?.phone) return;
    // .catch matters: a tablet with no phone app would otherwise throw an
    // error nothing handles. The old code had no catch here.
    Linking.openURL(`tel:${place.phone.replace(/\s/g, '')}`).catch(() =>
      Alert.alert(t('common.error'), place.phone)
    );
  };

  const openWebsite = () => {
    if (!place?.website) return;
    // Add https:// when the stored address has no protocol, or it will not open.
    const url = place.website.startsWith('http') ? place.website : `https://${place.website}`;
    Linking.openURL(url).catch(() => Alert.alert(t('common.error'), place.website));
  };

  // Heart. Guests are asked to log in, because a favorite belongs to an account.
  const handleFavorite = () => {
    if (!isLoggedIn) {
      navigation.navigate('Login');
      return;
    }
    toggleFavorite(place.id);
  };

  // Add this place to today's plan.
  const handleAddToItinerary = async () => {
    if (!isLoggedIn) {
      navigation.navigate('Login');
      return;
    }

    const result = await addToItinerary(place);

    if (!result.ok) {
      // The most likely reason is that it is already in the plan.
      Alert.alert(t('detail.alreadyTitle'), `${place.name} ${t('detail.alreadyMsg')}`);
      return;
    }

    Alert.alert(t('detail.addedTitle'), `${place.name} ${t('detail.addedMsg')}`, [
      {
        text: t('detail.viewItinerary'),
        onPress: () => navigation.navigate('Main', { screen: 'Itinerary' }),
      },
      { text: t('detail.ok'), style: 'cancel' },
    ]);
  };

  // Save a review.
  const handleSubmitReview = async () => {
    setReviewError('');
    setSavingReview(true);
    try {
      const result = await commentRepo.addComment({
        userId,
        placeId: place.id,
        rating,
        text: reviewText,
      });

      if (!result.ok) {
        setReviewError('error.' + result.error);
        return;
      }

      setShowForm(false);
      // Reload so the new review appears AND the star rating at the top
      // updates - the database recalculated the average when we saved.
      await load();
    } catch (e) {
      console.warn('[PlaceDetailScreen] review failed:', e);
      setReviewError('common.error');
    } finally {
      setSavingReview(false);
    }
  };

  // Delete a review. A user may delete their own; an admin may delete any.
  const handleDeleteComment = (comment) => {
    Alert.alert(t('comment.deleteTitle'), t('comment.deleteMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await commentRepo.deleteComment({ commentId: comment.id, userId, isAdmin });
          await load();
        },
      },
    ]);
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  // The place was deleted, or we were opened with a bad id.
  if (!place) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title={t('common.error')}
          action={{ label: t('common.back'), onPress: () => navigation.goBack() }}
        />
      </Screen>
    );
  }

  const favorite = isFavorite(place.id);
  // .some() returns true if ANY activity in the plan points at this place.
  const inItinerary = userItinerary.some((item) => item.placeId === place.id);
  // Has this user already written a review here?
  const myComment = comments.find((c) => c.userId === userId);

  // The gallery: the place's own photos, or the main photo repeated if it has none.
  const gallery = place.gallery?.length ? place.gallery : [place.image];

  return (
    // edges is ['bottom'] only: we WANT the photo to run up under the status
    // bar, edge to edge. The buttons on top of it get their own padding below.
    <Screen edges={['bottom']} style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ---------- HERO PHOTO ---------- */}
        <View>
          <Image
            source={resolveImage(place.image)}
            style={[styles.hero, { height: heroHeight }]}
          />
          {/* A dark gradient-ish overlay so the white buttons stay readable
              even on a bright photo. */}
          <View style={styles.heroScrim} />

          {/* The floating buttons. `insetTop` pushes them below the status bar,
              which the old code did not do - on Android they sat 12pt from the
              physical top edge, right under the clock. */}
          <View style={styles.heroTopRow}>
            <IconButton
              name="chevron-back"
              size={22}
              color="#fff"
              diameter={40}
              background="rgba(0,0,0,0.35)"
              onPress={() => navigation.goBack()}
            />
            <View style={styles.heroActions}>
              <IconButton
                name="share-outline"
                size={20}
                color="#fff"
                diameter={40}
                background="rgba(0,0,0,0.35)"
                onPress={share}
              />
              <IconButton
                name={favorite ? 'heart' : 'heart-outline'}
                size={20}
                color={favorite ? colors.danger : '#fff'}
                diameter={40}
                background="rgba(0,0,0,0.35)"
                onPress={handleFavorite}
              />
            </View>
          </View>
        </View>

        {/* ---------- BODY ---------- */}
        <View style={styles.body}>
          {/* A badge for the owner/admin when the place is not publicly visible. */}
          {place.status !== 'approved' && (
            <StatusBadge status={place.status} t={t} style={styles.statusBadge} />
          )}

          <View style={styles.titleRow}>
            <View style={styles.titleText}>
              <Text style={styles.name}>{place.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText} numberOfLines={2}>
                  {place.location}
                </Text>
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
              <Text style={styles.rangeText} numberOfLines={2}>
                {place.priceRange}
              </Text>
            </View>
          ) : null}

          {/* THREE STATS */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="star" size={14} color={colors.star} />
              <Text style={styles.statText}>{place.rating || '—'}</Text>
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

          {/* CONTACT - only rendered when there is something to contact. */}
          {(place.phone || place.website) && (
            <View style={styles.contactRow}>
              {place.phone ? (
                <TouchableOpacity style={styles.contactBtn} onPress={callPhone}>
                  <Ionicons name="call-outline" size={16} color={colors.primary} />
                  <Text style={styles.contactText} numberOfLines={1}>
                    {place.phone}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {place.website ? (
                <TouchableOpacity style={styles.contactBtn} onPress={openWebsite}>
                  <Ionicons name="globe-outline" size={16} color={colors.primary} />
                  <Text style={styles.contactText} numberOfLines={1}>
                    {place.website}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* ABOUT */}
          {place.description ? (
            <>
              <Text style={styles.heading}>{t('detail.about')}</Text>
              <Text style={styles.description}>{place.description}</Text>
            </>
          ) : null}

          {/* GALLERY */}
          <Text style={styles.heading}>{t('detail.gallery')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryRow}
          >
            {gallery.map((image, index) => (
              // The index is acceptable as a key here because this list never
              // reorders or has items removed - it is drawn once and left alone.
              <Image key={index} source={resolveImage(image)} style={styles.galleryImage} />
            ))}
          </ScrollView>

          {/* ---------- REVIEWS ---------- */}
          <View style={styles.reviewsHeader}>
            <Text style={styles.heading}>{t('detail.reviews')}</Text>
            {isLoggedIn ? (
              <PressableText
                title={myComment ? t('comment.edit') : t('comment.write')}
                onPress={() => setShowForm(!showForm)}
              />
            ) : (
              <PressableText title={t('auth.logIn')} onPress={() => navigation.navigate('Login')} />
            )}
          </View>

          {/* THE REVIEW FORM - shown only when the user asked for it. */}
          {showForm && isLoggedIn && (
            <View style={styles.reviewForm}>
              <Text style={styles.formLabel}>{t('comment.yourRating')}</Text>

              {/* Five tappable stars. [...Array(5)] makes an array of 5 empty
                  slots purely so we can .map over it and draw five icons. */}
              <View style={styles.starPicker}>
                {[...Array(5)].map((_, index) => {
                  const starValue = index + 1;   // 1..5, because index starts at 0
                  return (
                    <TouchableOpacity
                      key={starValue}
                      onPress={() => setRating(starValue)}
                      // A generous tap area - the stars themselves are only 28pt.
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      accessibilityRole="button"
                      accessibilityLabel={`${starValue}`}
                    >
                      <Ionicons
                        name={starValue <= rating ? 'star' : 'star-outline'}
                        size={30}
                        color={starValue <= rating ? colors.star : colors.border}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <FormField
                value={reviewText}
                onChangeText={setReviewText}
                placeholder={t('comment.placeholder')}
                multiline
                error={reviewError && t(reviewError)}
              />

              <ButtonRow>
                <SecondaryButton
                  title={t('common.cancel')}
                  onPress={() => setShowForm(false)}
                  full={false}
                  style={styles.flexOne}
                />
                <PrimaryButton
                  title={t('comment.publish')}
                  onPress={handleSubmitReview}
                  loading={savingReview}
                  disabled={reviewText.trim().length < 3}
                  full={false}
                  style={styles.flexOne}
                />
              </ButtonRow>
            </View>
          )}

          {/* THE REVIEW LIST */}
          {comments.length === 0 ? (
            <EmptyState
              icon="chatbubble-outline"
              title={t('comment.empty')}
              subtitle={t('comment.emptySub')}
            />
          ) : (
            comments.map((comment) => {
              const isMine = comment.userId === userId;
              return (
                <View key={comment.id} style={styles.reviewCard}>
                  <View style={styles.reviewHead}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {/* The author's first letter, as a simple avatar. */}
                        {comment.authorName?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>

                    <View style={styles.reviewWho}>
                      <Text style={styles.reviewName} numberOfLines={1}>
                        {isMine ? t('comment.you') : comment.authorName}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {/* .slice(0, 10) cuts '2026-09-01T14:32:05.123Z' down
                            to just '2026-09-01'. */}
                        {comment.createdAt?.slice(0, 10)}
                      </Text>
                    </View>

                    <View style={styles.reviewStars}>
                      {[...Array(5)].map((_, i) => (
                        <Ionicons
                          key={i}
                          name="star"
                          size={12}
                          color={i < comment.rating ? colors.star : colors.border}
                        />
                      ))}
                    </View>
                  </View>

                  <Text style={styles.reviewText}>{comment.text}</Text>

                  {/* The delete button appears only for your own review, or
                      for an admin. The database checks this again anyway. */}
                  {(isMine || isAdmin) && (
                    <PressableText
                      title={t('common.delete')}
                      tone="danger"
                      onPress={() => handleDeleteComment(comment)}
                      style={styles.deleteReview}
                    />
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ---------- FIXED FOOTER ---------- */}
      <View style={styles.footer}>
        <SecondaryButton
          title={t('detail.directions')}
          icon="map-outline"
          onPress={openDirections}
          full={false}
          style={styles.flexOne}
        />
        <PrimaryButton
          title={inItinerary ? t('detail.added') : t('detail.addItinerary')}
          icon={inItinerary ? 'checkmark' : 'add'}
          onPress={handleAddToItinerary}
          full={false}
          style={styles.flexOne}
        />
      </View>
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { backgroundColor: colors.background },
    scroll: { paddingBottom: 20 },
    flexOne: { flex: 1 },

    hero: { width: '100%', backgroundColor: colors.surface },
    heroScrim: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 120,
      backgroundColor: 'rgba(0,0,0,0.22)',
    },
    heroTopRow: {
      position: 'absolute',
      // 44 clears the status bar on both platforms. The old value was 12,
      // which on Android put the back button under the clock.
      top: 44,
      left: spacing.md,
      right: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroActions: { flexDirection: 'row', gap: 4 },

    body: {
      padding: spacing.xl,
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      // Pull the body up over the bottom of the photo for the rounded-sheet
      // look. The old value was -20 which covered the photo's pagination dots;
      // there are no dots now, so this is purely decorative.
      marginTop: -24,
    },
    statusBadge: { marginBottom: spacing.md },

    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    titleText: { flex: 1, minWidth: 0 },
    name: { fontSize: 20, fontWeight: '700', color: colors.text },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    metaText: { fontSize: 13, color: colors.textMuted, flex: 1 },
    priceBubble: {
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      flexShrink: 0,
    },
    priceText: { color: colors.primary, fontWeight: '700', fontSize: 13 },

    rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
    rangeText: { fontSize: 13, color: colors.primary, fontWeight: '600', flex: 1 },

    statsRow: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      marginTop: spacing.lg,
    },
    stat: { flex: 1, alignItems: 'center', gap: 2 },
    statText: { fontSize: 14, fontWeight: '700', color: colors.text },
    statSub: { fontSize: 11, color: colors.textMuted },

    contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.lg },
    contactBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primarySoft,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: radius.md,
      // minHeight not height, so the label is never clipped at large text sizes.
      minHeight: 44,
      flexShrink: 1,
    },
    contactText: { color: colors.primary, fontWeight: '600', fontSize: 13, flexShrink: 1 },

    heading: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },

    galleryRow: { gap: 10, paddingVertical: 4 },
    galleryImage: {
      width: 140,
      // aspectRatio instead of a fixed height keeps the photo's proportions.
      aspectRatio: 3 / 2,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
    },

    reviewsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },

    reviewForm: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    formLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
    starPicker: { flexDirection: 'row', gap: 6, marginBottom: spacing.lg },

    reviewCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: 10,
    },
    reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
    reviewWho: { flex: 1, minWidth: 0 },
    reviewName: { fontSize: 13, fontWeight: '700', color: colors.text },
    reviewDate: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    reviewStars: { flexDirection: 'row', gap: 2, flexShrink: 0 },
    reviewText: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
    deleteReview: { alignSelf: 'flex-start', marginTop: 4 },

    footer: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
