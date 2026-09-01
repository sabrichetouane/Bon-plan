// ============================================================================
// MyPlacesScreen.js - THE PLACES YOU SUBMITTED, AND THEIR STATUS
//
// When a user adds a place it does not appear straight away - an admin has to
// approve it first. Without this screen that submission would just vanish,
// which feels broken even though it is working correctly.
//
// So each card carries a badge:
//   Pending   an admin has not looked at it yet
//   Approved  it is live and everyone can see it
//   Hidden    an admin took it down
//
// The user can edit or delete their own submissions from here.
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, radius, spacing } from '../theme/colors';
import { useStore, useT } from '../store';
import { resolveImage } from '../data/assetRegistry';
import * as placeRepo from '../db/placeRepo';

import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import IconButton from '../components/IconButton';
import { Loading, EmptyState, StatusBadge } from '../components/Feedback';

export default function MyPlacesScreen({ navigation }) {
  const { colors } = useTheme();
  const t = useT();
  const { userId, isLoggedIn } = useStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setPlaces(await placeRepo.listPlacesByUser(userId));
    } catch (e) {
      console.warn('[MyPlacesScreen] load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // useFocusEffect, not useEffect: coming back after adding a place should
  // show it, and coming back after an admin approved one should show the new
  // badge.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = (place) => {
    Alert.alert(t('admin.deleteTitle'), t('admin.deletePlaceMsg').replace('%s', place.name), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await placeRepo.deletePlace(place.id);
          load();
        },
      },
    ]);
  };

  // A one-line explanation under each badge, so the state is not just a colour.
  const statusHint = (status) => {
    if (status === 'pending') return t('place.submittedMsg');
    if (status === 'hidden') return t('status.hidden');
    return t('place.publishedMsg');
  };

  if (!isLoggedIn) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader title={t('place.myPlaces')} onBack={() => navigation.goBack()} />
        <EmptyState
          icon="lock-closed-outline"
          title={t('auth.loginRequired')}
          subtitle={t('auth.loginRequiredMsg')}
          action={{ label: t('auth.logIn'), onPress: () => navigation.navigate('Login') }}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title={t('place.myPlaces')}
        onBack={() => navigation.goBack()}
        rightIcon="add"
        onRightPress={() => navigation.navigate('AddPlace')}
      />

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="business-outline"
              title={t('place.myPlacesEmpty')}
              subtitle={t('place.submittedMsg')}
              action={{ label: t('place.addOne'), onPress: () => navigation.navigate('AddPlace') }}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardBody}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
              >
                <Image source={resolveImage(item.image)} style={styles.image} />

                {/* flex:1 + minWidth:0 lets these lines shrink instead of
                    pushing the delete button off the right edge. */}
                <View style={styles.text}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {t('cat.' + item.categoryId)}
                    {item.location ? ` · ${item.location}` : ''}
                  </Text>

                  <View style={styles.badgeRow}>
                    <StatusBadge status={item.status} t={t} />
                  </View>
                </View>

                <IconButton
                  name="trash-outline"
                  size={18}
                  color={colors.textMuted}
                  diameter={34}
                  background="transparent"
                  onPress={() => handleDelete(item)}
                  accessibilityLabel={t('common.delete')}
                />
              </TouchableOpacity>

              {/* The plain-language explanation of what the badge means. */}
              <View style={styles.hintRow}>
                <Ionicons
                  name={
                    item.status === 'pending'
                      ? 'time-outline'
                      : item.status === 'hidden'
                      ? 'eye-off-outline'
                      : 'checkmark-circle-outline'
                  }
                  size={13}
                  color={colors.textMuted}
                />
                <Text style={styles.hintText} numberOfLines={2}>
                  {statusHint(item.status)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    list: { padding: spacing.xl, gap: 12, paddingBottom: spacing.xxl },

    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    cardBody: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    image: {
      width: 64,
      height: 64,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
    },
    text: { flex: 1, minWidth: 0 },
    name: { fontSize: 14, fontWeight: '700', color: colors.text },
    meta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    badgeRow: { marginTop: 6, flexDirection: 'row' },

    hintRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    hintText: { flex: 1, fontSize: 11, color: colors.textMuted },
  });
