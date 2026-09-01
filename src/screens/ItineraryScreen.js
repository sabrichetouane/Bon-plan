// ============================================================================
// ItineraryScreen.js - YOUR DAY PLAN (Itinerary tab)
//
// Shows one day-plan as a vertical timeline: a time on the left, an activity
// card on the right, joined by a line.
//
// WHAT CHANGED - this screen had the most "looks real, does nothing" parts:
//
// 1. THE WEEKDAY STRIP WAS FAKE. It showed Mon-Sun with the dates hardcoded to
//    10..16, `const active = i === 2` (so Wednesday was ALWAYS highlighted),
//    and no onPress at all. It now shows the real current week, and tapping a
//    day loads that day's plan from the database.
//
// 2. "Wednesday, April 12" WAS A HARDCODED STRING. It is now the real date of
//    the selected day, formatted in the user's language.
//
// 3. ACTIVITIES COULD NOT BE EDITED. "Add activity" created a row saying "Tap
//    to edit" - but nothing was tappable. There is now a real edit form.
//
// 4. NO REORDERING. Rows appeared in the order they were added, forever.
//    Up/down arrows now move them.
//
// 5. THE TOTAL IGNORED MINUTES. The old sum used a pattern that required an
//    'h', so a 45-minute activity counted as zero. Fixed in planRepo.
//
// 6. "Clear all" fired one state update per row, over a stale list. It is now
//    a single database statement.
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, radius, spacing, hitSlopFor } from '../theme/colors';
import { useRTL } from '../theme/rtl';
import { useStore, useT } from '../store';
import * as planRepo from '../db/planRepo';

import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import FormField from '../components/FormField';
import IconButton from '../components/IconButton';
import { PrimaryButton, SecondaryButton, PressableText, ButtonRow } from '../components/Buttons';
import { EmptyState, Loading } from '../components/Feedback';

// ---------------------------------------------------------------------------
// buildWeek(language) - the seven days of the CURRENT week, as real dates.
//
// Returns entries like { key: '2026-09-01', weekday: 'Mon', dayNumber: 1 }.
// Intl.DateTimeFormat is built into JavaScript and knows how to write a
// weekday name in any language, so the strip translates for free.
// ---------------------------------------------------------------------------
function buildWeek(language) {
  const today = new Date();

  // getDay() gives 0 for Sunday, 1 for Monday... We want the week to start on
  // Monday, so Sunday (0) has to count as day 7.
  const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();

  // Step back to this week's Monday.
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek - 1));

  const week = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);   // Monday + i days

    week.push({
      // 'YYYY-MM-DD' - the exact format the database stores in plans.day_date.
      // toISOString() gives UTC; slicing the first 10 characters gives the date.
      key: date.toISOString().slice(0, 10),
      weekday: new Intl.DateTimeFormat(language, { weekday: 'short' }).format(date),
      dayNumber: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
    });
  }
  return week;
}

// formatLongDate(dateKey, language) - '2026-09-01' -> 'Monday, 1 September'.
function formatLongDate(dateKey, language) {
  // Adding 'T00:00:00' makes the browser read it as local time rather than
  // UTC, which otherwise shifts the date by a day in some time zones.
  const date = new Date(dateKey + 'T00:00:00');
  return new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export default function ItineraryScreen({ navigation }) {
  const { colors } = useTheme();
  // useRTL gives back small style objects that mirror the layout when the
  // language is Arabic. In English and French every one of them is null, so
  // adding them to a style array changes nothing there.
  const rtl = useRTL();
  const t = useT();
  const {
    userId,
    isLoggedIn,
    language,
    plan,
    openPlan,
    addBlankActivity,
    removeFromItinerary,
    updateItineraryItem,
    moveItineraryItem,
    clearItinerary,
    refreshPlan,
  } = useStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // The week strip. useMemo so the dates are computed once per language change,
  // not on every render.
  const week = useMemo(() => buildWeek(language), [language]);

  // Which day is selected. Starts on today.
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  // --- The edit form -------------------------------------------------------
  // `editing` holds the activity being edited, or null when the form is closed.
  const [editing, setEditing] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDuration, setFormDuration] = useState('');

  // -------------------------------------------------------------------------
  // Load the plan for whichever day is selected.
  // -------------------------------------------------------------------------
  const loadDay = useCallback(
    async (dateKey) => {
      if (!userId) return;
      setLoading(true);
      try {
        // Find an existing plan for that date, or make an empty one.
        const plans = await planRepo.listPlans(userId);
        const match = plans.find((p) => p.dayDate === dateKey);

        if (match) {
          await openPlan(match.id);
        } else {
          const created = await planRepo.createPlan({
            userId,
            title: 'My day in Bizerte',
            dayDate: dateKey,
          });
          await openPlan(created.id);
        }
      } catch (e) {
        console.warn('[ItineraryScreen] loadDay failed:', e);
      } finally {
        setLoading(false);
      }
    },
    [userId, openPlan]
  );

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) refreshPlan();
    }, [isLoggedIn, refreshPlan])
  );

  // Tapping a day in the strip.
  const handleSelectDay = (dateKey) => {
    setSelectedDay(dateKey);
    loadDay(dateKey);
  };

  // The activities of the open plan. `?? []` gives an empty list rather than
  // undefined, so .map below never crashes.
  const items = plan?.items ?? [];

  // The day's total length, worked out by the helpers in planRepo.
  const totalLabel = planRepo.formatDuration(planRepo.totalMinutes(items));

  // -------------------------------------------------------------------------
  // Opening and saving the edit form.
  // -------------------------------------------------------------------------
  const startEditing = (item) => {
    setEditing(item);
    // Copy the current values into the form's own state, so typing does not
    // change the list until Save is pressed.
    setFormTitle(item.title);
    setFormTime(item.time);
    setFormDuration(item.duration);
  };

  const saveEdit = async () => {
    await updateItineraryItem(editing.id, {
      title: formTitle,
      time: formTime,
      duration: formDuration,
    });
    setEditing(null);       // close the form
  };

  const confirmRemove = (item) => {
    Alert.alert(t('itin.removeTitle'), t('itin.removeMsg').replace('%s', item.title), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('itin.remove'), style: 'destructive', onPress: () => removeFromItinerary(item.id) },
    ]);
  };

  const openOptions = () => {
    Alert.alert(t('itin.optionsTitle'), t('itin.optionsMsg'), [
      { text: t('plan.myPlans'), onPress: () => navigation.navigate('MyPlans') },
      { text: t('itin.clearAll'), style: 'destructive', onPress: clearItinerary },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  // -------------------------------------------------------------------------
  // A guest has no plans to show - plans belong to an account.
  // -------------------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <Screen>
        <ScreenHeader title={t('itin.title')} />
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
    <Screen>
      <ScreenHeader
        title={t('itin.title')}
        rightIcon="ellipsis-horizontal"
        onRightPress={openOptions}
      />

      {/* ---------- THE WEEK STRIP - now real and tappable ---------- */}
      <View style={styles.weekWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          // rtl.row lays the seven days out starting from the right in Arabic.
          contentContainerStyle={[styles.weekRow, rtl.row]}
        >
          {week.map((day) => {
            const isSelected = day.key === selectedDay;
            return (
              <TouchableOpacity
                key={day.key}
                style={[styles.day, isSelected && styles.dayActive]}
                onPress={() => handleSelectDay(day.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                  {day.weekday}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>
                  {day.dayNumber}
                </Text>
                {/* A small dot marking today, so you can find your way back. */}
                {day.isToday && !isSelected && <View style={styles.todayDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ---------- SUMMARY ---------- */}
      {/* rtl.row mirrors this row in Arabic - the date moves to the right and
          the add button to the left. It does nothing in English. */}
      <View style={[styles.summary, rtl.row]}>
        <View style={styles.summaryText}>
          <Text style={[styles.summaryTitle, rtl.text]} numberOfLines={1}>
            {formatLongDate(selectedDay, language)}
          </Text>
          <Text style={[styles.summarySub, rtl.text]} numberOfLines={1}>
            {items.length} {t('itin.activities')} · {totalLabel}
          </Text>
        </View>
        <IconButton
          name="add"
          size={20}
          color="#fff"
          diameter={38}
          background={colors.primary}
          onPress={addBlankActivity}
          accessibilityLabel={t('itin.addActivity')}
        />
      </View>

      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title={t('itin.emptyTitle')}
              subtitle={t('itin.emptySub')}
              action={{
                label: t('fav.explore'),
                onPress: () => navigation.navigate('Main', { screen: 'Home' }),
              }}
            />
          ) : (
            items.map((item, index) => (
              <View key={item.id} style={[styles.row, rtl.row]}>
                {/* LEFT: the time, a coloured dot, and the connecting line.
                    rtl.row on the line above moves this whole column - and with
                    it the timeline - to the right edge in Arabic. The time text
                    itself deliberately gets no rtl.text: a clock reading like
                    "09:00" is written left to right in every language. */}
                <View style={styles.timeColumn}>
                  <Text style={styles.time}>{item.time}</Text>
                  <View style={[styles.timeDot, { backgroundColor: item.color }]} />
                  {/* Draw the line for every row except the last one. */}
                  {index < items.length - 1 && <View style={styles.timeLine} />}
                </View>

                {/* RIGHT: the activity card. Tapping it opens the edit form -
                    the thing "Tap to edit" used to promise but never did. */}
                <TouchableOpacity
                  // rtl.borderStart draws the 4px coloured bar on the edge the
                  // card starts at: the left in English, the right in Arabic.
                  // rtl.row then swaps the text and the up/down/delete controls.
                  style={[styles.card, rtl.borderStart(4, item.color), rtl.row]}
                  onPress={() => startEditing(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, rtl.text]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text style={[styles.cardSubtitle, rtl.text]} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}

                    {/* rtl.alignStart pins the badge to the side the text
                        starts from - still the left in English. */}
                    <View style={[styles.durationBadge, rtl.row, rtl.alignStart]}>
                      <Ionicons name="time-outline" size={11} color={colors.textSecondary} />
                      <Text style={styles.durationText}>{item.duration}</Text>
                    </View>
                  </View>

                  {/* The reorder and delete controls. */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => moveItineraryItem(item.id, 'up')}
                      // Greyed out and inert on the first row - there is
                      // nothing above it to swap with.
                      disabled={index === 0}
                      hitSlop={hitSlopFor(22)}
                      accessibilityLabel={t('plan.moveUp')}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={18}
                        color={index === 0 ? colors.border : colors.textMuted}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => moveItineraryItem(item.id, 'down')}
                      disabled={index === items.length - 1}
                      hitSlop={hitSlopFor(22)}
                      accessibilityLabel={t('plan.moveDown')}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={18}
                        color={index === items.length - 1 ? colors.border : colors.textMuted}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => confirmRemove(item)}
                      hitSlop={hitSlopFor(22)}
                      accessibilityLabel={t('itin.remove')}
                    >
                      <Ionicons name="trash-outline" size={17} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* The "add" row at the bottom of the list. */}
          <TouchableOpacity style={[styles.addRow, rtl.row]} onPress={addBlankActivity}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addRowText}>{t('itin.addActivity')}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ---------- THE EDIT FORM ----------
          Shown as a panel over the bottom of the screen when `editing` is set.
          A full modal would be heavier than this needs to be. */}
      {editing && (
        <View style={styles.editPanel}>
          <View style={styles.editHandle} />
          <Text style={[styles.editTitle, rtl.text]}>{t('plan.editActivity')}</Text>

          <FormField
            label={t('plan.activityTitle')}
            value={formTitle}
            onChangeText={setFormTitle}
            placeholder={t('itin.newActivity')}
          />

          {/* Two half-width fields side by side. */}
          <View style={[styles.editRow, rtl.row]}>
            <FormField
              label={t('plan.activityTime')}
              value={formTime}
              onChangeText={setFormTime}
              placeholder="09:00"
              style={styles.flexOne}
            />
            <FormField
              label={t('plan.activityDuration')}
              value={formDuration}
              onChangeText={setFormDuration}
              placeholder="1h"
              hint={t('plan.durationHint')}
              style={styles.flexOne}
            />
          </View>

          <ButtonRow>
            <SecondaryButton
              title={t('common.cancel')}
              onPress={() => setEditing(null)}
              full={false}
              style={styles.flexOne}
            />
            <PrimaryButton
              title={t('common.save')}
              onPress={saveEdit}
              disabled={formTitle.trim() === ''}
              full={false}
              style={styles.flexOne}
            />
          </ButtonRow>
        </View>
      )}
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    flexOne: { flex: 1 },

    weekWrap: { paddingBottom: spacing.sm },
    weekRow: { paddingHorizontal: spacing.xl, gap: 8 },
    day: {
      width: 54,
      paddingVertical: 10,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      alignItems: 'center',
      // minHeight so the numbers are never clipped at large text sizes.
      minHeight: 58,
      justifyContent: 'center',
    },
    dayActive: { backgroundColor: colors.primary },
    dayLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
    dayLabelActive: { color: 'rgba(255,255,255,0.85)' },
    dayNumber: { fontSize: 15, color: colors.text, fontWeight: '700', marginTop: 2 },
    dayNumberActive: { color: '#fff' },
    todayDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
      marginTop: 3,
    },

    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    summaryText: { flex: 1, minWidth: 0 },
    summaryTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    summarySub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

    list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },

    row: { flexDirection: 'row', gap: spacing.md },
    timeColumn: { width: 52, alignItems: 'center' },
    time: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    timeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
    // flex:1 makes the line stretch down to whatever height the card next to
    // it happens to be, so the timeline never has gaps.
    timeLine: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 },

    card: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      // No borderLeftWidth here any more: the 4px coloured edge bar is applied
      // in the JSX with rtl.borderStart(4, ...) so it can sit on the left in
      // English and the right in Arabic. Nothing changes for an English user.
      padding: spacing.md,
      marginBottom: 12,
    },
    cardText: { flex: 1, minWidth: 0 },
    cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    cardSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    durationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surface,
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      marginTop: 8,
    },
    durationText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
    cardActions: { alignItems: 'center', gap: 10, flexShrink: 0 },

    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
      marginTop: spacing.sm,
      minHeight: 48,
    },
    addRowText: { color: colors.primary, fontWeight: '600', fontSize: 14 },

    editPanel: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.xl,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 12,
    },
    editHandle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    editTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.lg,
    },
    editRow: { flexDirection: 'row', gap: spacing.md },
  });
