// ============================================================================
// AddPlaceScreen.js - LET A USER SUBMIT A NEW PLACE
//
// This is the heart of the "users contribute, admins moderate" feature.
//
// HOW MODERATION WORKS HERE:
//   - a normal user's submission is saved with status 'pending', so it is
//     invisible to everyone except its author and the admins
//   - an admin's submission is saved as 'approved' and appears immediately
//   - the admin screen lists the pending ones and approves or rejects them
// The decision is made inside placeRepo.createPlace, NOT in this screen, so
// no future screen can accidentally skip it.
//
// PHOTOS: the user adds their OWN pictures, from the phone's gallery or its
// camera. Each one is copied into the app's private storage and belongs to
// this place alone - see media/photoStorage.js for why the copy matters.
// The first photo is the main picture; the rest become the gallery.
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, radius, spacing } from '../theme/colors';
// useRTL mirrors the layout when the language is Arabic. Every value it
// returns is null in English and French, so using it costs nothing there.
import { useRTL } from '../theme/rtl';
import { useStore, useT } from '../store';
import { resolveImage } from '../data/assetRegistry';
import * as photoStorage from '../media/photoStorage';
import * as placeRepo from '../db/placeRepo';

import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import FormField from '../components/FormField';
import Chip from '../components/Chip';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';

// The price levels a user can choose. `tier` is the NUMBER stored for sorting;
// `label` is only what gets shown. Keeping them apart is what fixed the old
// "Free sorts as more expensive than $$$" bug.
const PRICE_LEVELS = [
  { tier: 0, label: 'Free', labelKey: 'place.priceFree' },
  { tier: 1, label: '$' },
  { tier: 2, label: '$$' },
  { tier: 3, label: '$$$' },
];

export default function AddPlaceScreen({ navigation }) {
  const { colors } = useTheme();
  const rtl = useRTL();
  const t = useT();
  const { userId, isAdmin, isLoggedIn } = useStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // The categories the place can belong to, loaded from the database.
  const [categories, setCategories] = useState([]);

  // --- The form ------------------------------------------------------------
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [priceTier, setPriceTier] = useState(0);
  // The user's chosen photos, as permanent file:// paths. The FIRST one is
  // the main picture; the others become the place's gallery.
  const [photos, setPhotos] = useState([]);
  // True while the picker or the camera is open, so the buttons cannot be
  // pressed twice and the empty box can show a spinner.
  const [busyPhotos, setBusyPhotos] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useFocusEffect(
    useCallback(() => {
      placeRepo
        .listCategories()
        .then(setCategories)
        .catch((e) => console.warn('[AddPlaceScreen] categories failed:', e));
    }, [])
  );

  // =========================================================================
  // PHOTOS
  // =========================================================================

  // addPhotos(result) - shared ending for both the gallery and the camera.
  const addPhotos = (result) => {
    if (!result.ok) {
      // The only failure either one reports is the user refusing permission.
      Alert.alert(t('place.photoPermissionTitle'), t('place.photoPermissionMsg'));
      return;
    }
    // result.uris is empty when the user simply backed out - not an error.
    if (result.uris.length === 0) return;

    // Append, keeping what was already chosen. The cap keeps a submission
    // reasonable and matches the 1 main + 3 gallery shape the app displays.
    setPhotos((current) => [...current, ...result.uris].slice(0, 4));
  };

  const handlePickFromGallery = async () => {
    setBusyPhotos(true);
    try {
      addPhotos(await photoStorage.pickFromLibrary({ limit: 4 - photos.length }));
    } catch (e) {
      console.warn('[AddPlaceScreen] gallery failed:', e);
      Alert.alert(t('common.error'), t('error.saveFailed'));
    } finally {
      setBusyPhotos(false);
    }
  };

  const handleTakePhoto = async () => {
    setBusyPhotos(true);
    try {
      addPhotos(await photoStorage.takePhoto());
    } catch (e) {
      console.warn('[AddPlaceScreen] camera failed:', e);
      Alert.alert(t('common.error'), t('error.saveFailed'));
    } finally {
      setBusyPhotos(false);
    }
  };

  // Remove a photo AND delete the copied file, so a picture the user changed
  // their mind about does not sit in the app's storage forever.
  const handleRemovePhoto = (uri) => {
    photoStorage.deletePhoto(uri);
    setPhotos((current) => current.filter((item) => item !== uri));
  };

  // Promote a photo to be the main one by moving it to the front of the list.
  const handleMakeMain = (uri) => {
    setPhotos((current) => [uri, ...current.filter((item) => item !== uri)]);
  };

  // -------------------------------------------------------------------------
  // handleSubmit - validate, save, then explain what happens next.
  // -------------------------------------------------------------------------
  const handleSubmit = async () => {
    // Check the form before touching the database, so mistakes get an instant
    // friendly message rather than a database error.
    const found = {};
    if (name.trim().length < 3) found.name = 'error.nameTooShort';
    if (!categoryId) found.category = 'error.categoryRequired';

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      // The chosen price level, so we can store both its number and its label.
      const price = PRICE_LEVELS.find((p) => p.tier === priceTier);

      const result = await placeRepo.createPlace({
        name,
        categoryId,
        subtitle,
        description,
        location,
        phone,
        website,
        priceTier,
        price: price.labelKey ? t(price.labelKey) : price.label,
        // The first photo is the main picture, the rest are the gallery.
        // .slice(1) is everything EXCEPT the first item.
        image: photos[0] || null,
        gallery: photos.slice(1),
        createdBy: userId,
        // This flag is what decides pending vs approved, inside the repository.
        isAdmin,
      });

      if (!result.ok) {
        setErrors({ name: 'error.' + result.error });
        return;
      }

      // Tell the truth about what just happened: an admin's place is live,
      // a user's is waiting. Nothing is more annoying than "Saved!" followed
      // by the thing not appearing.
      Alert.alert(
        t('place.submittedTitle'),
        result.status === 'approved' ? t('place.publishedMsg') : t('place.submittedMsg'),
        [{ text: t('detail.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      console.warn('[AddPlaceScreen] submit failed:', e);
      setErrors({ name: 'common.error' });
    } finally {
      setSaving(false);
    }
  };

  // Guests cannot submit - there would be nobody to attribute the place to.
  if (!isLoggedIn) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader title={t('place.addTitle')} onBack={() => navigation.goBack()} />
        <View style={styles.guest}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.textMuted} />
          <Text style={[styles.guestText, rtl.textCenter]}>{t('auth.loginRequiredMsg')}</Text>
          <PrimaryButton title={t('auth.logIn')} onPress={() => navigation.navigate('Login')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={t('place.addTitle')} onBack={() => navigation.goBack()} />

      {/* KeyboardAvoidingView lifts the form when the keyboard opens, so the
          field being typed into is never hidden behind it. */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          // Makes the Submit button work on the first tap while the keyboard
          // is open, instead of that tap only dismissing the keyboard.
          keyboardShouldPersistTaps="handled"
        >
          <FormField
            label={t('place.name')}
            value={name}
            onChangeText={setName}
            placeholder={t('place.namePlaceholder')}
            icon="business-outline"
            error={errors.name && t(errors.name)}
          />

          {/* CATEGORY - chips instead of a dropdown, because React Native has
              no built-in picker that looks the same on both platforms. */}
          <Text style={[styles.label, rtl.text]}>{t('place.category')}</Text>
          <View style={[styles.chipsRow, rtl.row]}>
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                label={t('cat.' + cat.id)}
                icon={cat.icon}
                active={cat.id === categoryId}
                onPress={() => setCategoryId(cat.id)}
              />
            ))}
          </View>
          {errors.category ? <Text style={[styles.error, rtl.text]}>{t(errors.category)}</Text> : null}

          <FormField
            label={t('place.subtitle')}
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder={t('place.subtitlePlaceholder')}
            hint={t('common.optional')}
            style={styles.spaced}
          />

          <FormField
            label={t('place.about')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('place.aboutPlaceholder')}
            multiline
            hint={t('common.optional')}
          />

          <FormField
            label={t('place.address')}
            value={location}
            onChangeText={setLocation}
            placeholder={t('place.addressPlaceholder')}
            icon="location-outline"
            hint={t('common.optional')}
          />

          <FormField
            label={t('place.phone')}
            value={phone}
            onChangeText={setPhone}
            placeholder="+216 ..."
            icon="call-outline"
            keyboardType="phone-pad"
            hint={t('common.optional')}
          />

          <FormField
            label={t('place.website')}
            value={website}
            onChangeText={setWebsite}
            placeholder="example.tn"
            icon="globe-outline"
            hint={t('common.optional')}
          />

          {/* PRICE LEVEL */}
          <Text style={[styles.label, rtl.text]}>{t('place.price')}</Text>
          <View style={[styles.chipsRow, rtl.row]}>
            {PRICE_LEVELS.map((level) => (
              <Chip
                key={level.tier}
                label={level.labelKey ? t(level.labelKey) : level.label}
                active={level.tier === priceTier}
                onPress={() => setPriceTier(level.tier)}
              />
            ))}
          </View>

          {/* ---------- PHOTOS ----------
              Your OWN photos, from your phone. Nothing is shared with another
              place: each picture is copied into the app's private storage and
              belongs to this place only.

              The first photo is the main one - the picture shown on the cards
              and at the top of the place's page. The rest become its gallery. */}
          <Text style={[styles.label, styles.spaced, rtl.text]}>{t('place.photos')}</Text>
          <Text style={[styles.hint, rtl.text]}>{t('place.photosHint')}</Text>

          {/* The two ways to add one. */}
          <View style={[styles.photoButtons, rtl.row]}>
            <SecondaryButton
              title={t('place.fromGallery')}
              icon="images-outline"
              onPress={handlePickFromGallery}
              disabled={busyPhotos}
              full={false}
              style={styles.flexOne}
            />
            <SecondaryButton
              title={t('place.takePhoto')}
              icon="camera-outline"
              onPress={handleTakePhoto}
              disabled={busyPhotos}
              full={false}
              style={styles.flexOne}
            />
          </View>

          {photos.length === 0 ? (
            // Nothing chosen yet. A dashed empty box reads as "something goes
            // here" rather than looking like a mistake.
            <TouchableOpacity
              style={styles.photoEmpty}
              onPress={handlePickFromGallery}
              disabled={busyPhotos}
            >
              {busyPhotos ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={30} color={colors.textMuted} />
                  <Text style={styles.photoEmptyText}>{t('place.noPhotos')}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            // The chosen photos, big enough to actually judge. Two per row on a
            // phone rather than the tiny 96pt thumbnails there were before.
            <View style={[styles.photoGrid, rtl.row]}>
              {photos.map((uri, index) => (
                <View key={uri} style={styles.photoCell}>
                  <Image source={resolveImage(uri)} style={styles.photoImage} />

                  {/* The first photo is the one used everywhere else. */}
                  {index === 0 && (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>{t('place.mainPhoto')}</Text>
                    </View>
                  )}

                  {/* Remove it. This also deletes the copied file, so a photo
                      the user changed their mind about does not sit on their
                      phone forever. */}
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => handleRemovePhoto(uri)}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.delete')}
                  >
                    <Ionicons name="close" size={15} color="#fff" />
                  </TouchableOpacity>

                  {/* Any photo can be promoted to main without re-picking. */}
                  {index !== 0 && (
                    <TouchableOpacity
                      style={styles.makeMain}
                      onPress={() => handleMakeMain(uri)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.makeMainText}>{t('place.makeMain')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* A plain explanation of what happens after Submit. */}
          <View style={[styles.note, rtl.row]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.noteText, rtl.text]}>
              {isAdmin ? t('place.publishedMsg') : t('place.submittedMsg')}
            </Text>
          </View>

        </ScrollView>

        {/* ---------- SUBMIT, PINNED TO THE BOTTOM ----------
            This sits OUTSIDE the ScrollView, so it is always on screen no
            matter how far down the form you are. It used to be the last thing
            inside the scrolling area, which meant you had to scroll past every
            field AND the photo strip to reach it - and while the photo strip
            was broken and enormous, you effectively never got there.

            A required action should never be something you have to hunt for. */}
        <View style={styles.footer}>
          {/* Say WHY the button is greyed out, rather than leaving the user
              tapping a dead button and wondering. */}
          {(name.trim() === '' || !categoryId) && (
            <Text style={[styles.footerHint, rtl.text]}>
              {name.trim() === '' ? t('error.nameTooShort') : t('error.categoryRequired')}
            </Text>
          )}

          <PrimaryButton
            title={t('place.submit')}
            icon="checkmark-circle-outline"
            onPress={handleSubmit}
            loading={saving}
            disabled={name.trim() === '' || !categoryId}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    flexOne: { flex: 1 },
    scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
    spaced: { marginTop: spacing.md },

    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    hint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
    error: { color: colors.danger, fontSize: 12, marginTop: -spacing.sm, marginBottom: spacing.md },

    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',   // let the chips flow onto a second line on a narrow phone
      gap: 8,
      marginBottom: spacing.lg,
    },

    // --- PHOTOS ---
    photoButtons: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },

    // The dashed box shown before any photo is chosen. Dashed borders read as
    // "something belongs here", where a solid one would look like a real card.
    photoEmpty: {
      height: 130,
      borderRadius: radius.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginBottom: spacing.lg,
    },
    photoEmptyText: { fontSize: 12, color: colors.textMuted },

    // Two photos per row. '48%' rather than a pixel width so it fits any
    // screen, and flexWrap moves the third and fourth onto a second row.
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: '4%',
      rowGap: spacing.md,
      marginBottom: spacing.lg,
    },
    photoCell: {
      width: '48%',
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    // A real height, not aspectRatio - see the note in the gallery styles of
    // PlaceDetailScreen for why. 4:3 at roughly half a phone's width, which is
    // big enough to actually see what the photo is.
    photoImage: { width: '100%', height: 120, backgroundColor: colors.surface },

    mainBadge: {
      position: 'absolute',
      bottom: 6,
      left: 6,
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    mainBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    photoRemove: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    makeMain: {
      position: 'absolute',
      bottom: 6,
      left: 6,
      backgroundColor: 'rgba(0,0,0,0.55)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    makeMainText: { color: '#fff', fontSize: 10, fontWeight: '600' },

    note: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    noteText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },

    // The fixed bar at the bottom holding the Submit button.
    footer: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    footerHint: { fontSize: 12, color: colors.textMuted },

    guest: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
      padding: spacing.xl,
    },
    guestText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  });
