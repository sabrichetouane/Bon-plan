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
// ABOUT THE PHOTO: a normal app would open the camera roll here. That needs
// expo-image-picker plus permission handling, so instead the user picks from
// the photos already bundled with the app. The database column holds a text
// key either way, so swapping in a real picker later changes only this screen.
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, radius, spacing } from '../theme/colors';
// useRTL mirrors the layout when the language is Arabic. Every value it
// returns is null in English and French, so using it costs nothing there.
import { useRTL } from '../theme/rtl';
import { useStore, useT } from '../store';
import { listAssetKeys, resolveImage } from '../data/assetRegistry';
import * as placeRepo from '../db/placeRepo';

import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import FormField from '../components/FormField';
import Chip from '../components/Chip';
import { PrimaryButton } from '../components/Buttons';

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
  const [image, setImage] = useState(null);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // The bundled photos the user can pick from. useMemo so the list is built
  // once rather than on every keystroke elsewhere in the form.
  const photoChoices = useMemo(() => listAssetKeys('real/'), []);

  useFocusEffect(
    useCallback(() => {
      placeRepo
        .listCategories()
        .then(setCategories)
        .catch((e) => console.warn('[AddPlaceScreen] categories failed:', e));
    }, [])
  );

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
        image,
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

          {/* PHOTO PICKER - a horizontal strip of the bundled photos. */}
          <Text style={[styles.label, styles.spaced, rtl.text]}>{t('place.photo')}</Text>
          <Text style={[styles.hint, rtl.text]}>{t('place.choosePhoto')}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoRow}
          >
            {photoChoices.map((key) => {
              const isSelected = key === image;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setImage(key)}
                  style={[styles.photoTile, isSelected && styles.photoTileActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Image source={resolveImage(key)} style={styles.photo} />
                  {/* A tick over the chosen one. */}
                  {isSelected && (
                    <View style={styles.photoCheck}>
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* A plain explanation of what happens after Submit. */}
          <View style={[styles.note, rtl.row]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.noteText, rtl.text]}>
              {isAdmin ? t('place.publishedMsg') : t('place.submittedMsg')}
            </Text>
          </View>

          <PrimaryButton
            title={t('place.submit')}
            onPress={handleSubmit}
            loading={saving}
            disabled={name.trim() === '' || !categoryId}
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
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

    photoRow: { gap: 10, paddingVertical: 4, paddingBottom: spacing.lg },
    photoTile: {
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: 'transparent',
      overflow: 'hidden',
    },
    photoTileActive: { borderColor: colors.primary },
    photo: {
      width: 96,
      // aspectRatio rather than a fixed height keeps every thumbnail the same
      // shape whatever the source photo's proportions are.
      aspectRatio: 4 / 3,
      backgroundColor: colors.surface,
    },
    photoCheck: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: '#fff',
      borderRadius: 11,
    },

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

    submit: { marginTop: spacing.sm },

    guest: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
      padding: spacing.xl,
    },
    guestText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  });
