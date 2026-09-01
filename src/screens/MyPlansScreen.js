// ============================================================================
// MyPlansScreen.js - ALL YOUR DAY PLANS
//
// The Itinerary tab shows ONE day. This screen lists every plan you have made,
// lets you create a new one, rename it, delete it, and choose whether to share
// it publicly.
//
// SHARING AND MODERATION:
// A plan starts private. Turning "Share publicly" on sends it to the admin
// queue with status 'pending'; once approved it becomes visible to others.
// Turning sharing back off makes it private again immediately.
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, radius, spacing } from '../theme/colors';
import { useStore, useT } from '../store';
import * as planRepo from '../db/planRepo';

import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import FormField from '../components/FormField';
import IconButton from '../components/IconButton';
import { PrimaryButton, SecondaryButton, ButtonRow } from '../components/Buttons';
import { Loading, EmptyState, StatusBadge } from '../components/Feedback';

export default function MyPlansScreen({ navigation }) {
  const { colors } = useTheme();
  const t = useT();
  const { userId, isAdmin, isLoggedIn, openPlan, language } = useStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // The "new plan" form: closed until the user asks for it.
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setPlans(await planRepo.listPlans(userId));
    } catch (e) {
      console.warn('[MyPlansScreen] load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // -------------------------------------------------------------------------
  // Create a new plan for today.
  // -------------------------------------------------------------------------
  const handleCreate = async () => {
    const result = await planRepo.createPlan({ userId, title: newTitle });
    if (result.ok) {
      setNewTitle('');
      setCreating(false);
      load();
    }
  };

  // Open a plan in the Itinerary tab, which is where activities get edited.
  const handleOpen = async (plan) => {
    await openPlan(plan.id);
    navigation.navigate('Main', { screen: 'Itinerary' });
  };

  // Turn public sharing on or off.
  const handleShare = async (plan, shouldBePublic) => {
    const result = await planRepo.setPlanVisibility({
      planId: plan.id,
      isPublic: shouldBePublic,
      isAdmin,
    });

    // Explain what just happened, because "pending" is not obvious: the plan
    // is shared but nobody else can see it yet.
    if (shouldBePublic && result.status === 'pending') {
      Alert.alert(t('plan.share'), t('plan.shareHint'));
    }
    load();
  };

  const handleDelete = (plan) => {
    Alert.alert(t('plan.deleteTitle'), t('plan.deleteMsg').replace('%s', plan.title), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await planRepo.deletePlan(plan.id);
          load();
        },
      },
    ]);
  };

  // Turn '2026-09-01' into a readable date in the user's language.
  const formatDate = (dateKey) => {
    // The 'T00:00:00' makes JavaScript read it as local time; without it the
    // date can shift by a day depending on the phone's time zone.
    const date = new Date(dateKey + 'T00:00:00');
    return new Intl.DateTimeFormat(language, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  if (!isLoggedIn) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader title={t('plan.myPlans')} onBack={() => navigation.goBack()} />
        <EmptyState
          icon="calendar-outline"
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
        title={t('plan.myPlans')}
        onBack={() => navigation.goBack()}
        rightIcon="add"
        onRightPress={() => setCreating(!creating)}
      />

      {/* The "new plan" form, shown only when the + is tapped. */}
      {creating && (
        <View style={styles.createBox}>
          <FormField
            label={t('plan.title')}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder={t('plan.titlePlaceholder')}
            icon="calendar-outline"
          />
          <ButtonRow>
            <SecondaryButton
              title={t('common.cancel')}
              onPress={() => setCreating(false)}
              full={false}
              style={styles.flexOne}
            />
            <PrimaryButton
              title={t('plan.newPlan')}
              onPress={handleCreate}
              full={false}
              style={styles.flexOne}
            />
          </ButtonRow>
        </View>
      )}

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={t('plan.emptyPlans')}
              subtitle={t('plan.emptyPlansSub')}
              action={{ label: t('plan.newPlan'), onPress: () => setCreating(true) }}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Tapping the top part opens the plan. */}
              <TouchableOpacity
                style={styles.cardHead}
                onPress={() => handleOpen(item)}
                activeOpacity={0.85}
              >
                <View style={styles.icon}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                </View>

                {/* flex:1 + minWidth:0 so a long plan name shrinks rather than
                    pushing the delete button off the right edge. */}
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {formatDate(item.dayDate)} · {item.itemCount} {t('plan.activities')}
                  </Text>
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

              {/* The share row: a switch, plus a badge showing the review state. */}
              <View style={styles.shareRow}>
                <View style={styles.shareText}>
                  <Text style={styles.shareLabel} numberOfLines={1}>
                    {t('plan.share')}
                  </Text>
                  {/* Only show the moderation badge when the plan is actually
                      public - a private plan is not waiting for anything. */}
                  {item.isPublic === 1 ? (
                    <StatusBadge status={item.status} t={t} style={styles.badge} />
                  ) : (
                    <Text style={styles.privateLabel}>{t('plan.private')}</Text>
                  )}
                </View>

                {/* Switch is React Native's built-in on/off toggle.
                    `value` must be a real true/false, and SQLite stores 1/0,
                    so we compare with === 1 to convert. */}
                <Switch
                  value={item.isPublic === 1}
                  onValueChange={(next) => handleShare(item, next)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
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
    flexOne: { flex: 1 },

    createBox: {
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
    },

    list: { padding: spacing.xl, paddingTop: spacing.sm, gap: 12, paddingBottom: spacing.xxl },

    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    icon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardText: { flex: 1, minWidth: 0 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    cardMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

    shareRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      minHeight: 52,
    },
    shareText: { flex: 1, minWidth: 0, gap: 4 },
    shareLabel: { fontSize: 13, color: colors.text, fontWeight: '600' },
    privateLabel: { fontSize: 11, color: colors.textMuted },
    badge: { marginTop: 0 },
  });
