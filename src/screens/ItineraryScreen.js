// ============================================================================
// ItineraryScreen.js - YOUR DAY PLAN (Itinerary tab)
// Renders the list of activities from the store (`userItinerary`). Each row
// is a time + title + duration with a trash button. Users can add blank
// activities or remove existing ones. The app total duration is computed on
// the fly from each row's `duration` string.
// ============================================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing } from '../theme/colors';
import { useStore, useT } from '../store';

export default function ItineraryScreen({ navigation }) {
  const { colors } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { userItinerary, addBlankActivity, removeFromItinerary } = useStore();

  // Sum up every row's duration (e.g. '1h 30m') into a single total string.
  // .reduce iterates the list and accumulates minutes; a regex extracts the
  // hours and optional minutes from each duration string.
  const totalMins = userItinerary.reduce((acc, it) => {
    const m = (it.duration || '1h').match(/(\d+)\s*h\s*(\d+)?/);
    if (!m) return acc;                                         // skip badly-formatted rows
    return acc + Number(m[1]) * 60 + (Number(m[2]) || 0);        // h*60 + optional m
  }, 0);
  // Format back to "Xh Ym" for display.
  const totalLabel = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('itin.title')}</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() =>
            Alert.alert(t('itin.optionsTitle'), t('itin.optionsMsg'), [
              { text: t('itin.share'), onPress: () => null },
              { text: t('itin.clearAll'), style: 'destructive', onPress: () => userItinerary.forEach((i) => removeFromItinerary(i.id)) },
              { text: t('itin.cancel'), style: 'cancel' },
            ])
          }
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysRow}
      >
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => {
          const active = i === 2;
          return (
            <TouchableOpacity
              key={d}
              style={[styles.day, active && styles.dayActive]}
            >
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>
                {d}
              </Text>
              <Text style={[styles.dayNum, active && styles.dayNumActive]}>
                {10 + i}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryTitle}>Wednesday, April 12</Text>
          <Text style={styles.summarySub}>
            {userItinerary.length} {t('itin.activities')} · {totalLabel}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={addBlankActivity}>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {userItinerary.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{t('itin.emptyTitle')}</Text>
            <Text style={styles.emptySub}>{t('itin.emptySub')}</Text>
          </View>
        )}

        {userItinerary.map((item, i) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.timeCol}>
              <Text style={styles.time}>{item.time}</Text>
              <View style={[styles.timeDot, { backgroundColor: item.color }]} />
              {i < userItinerary.length - 1 && <View style={styles.timeLine} />}
            </View>
            <View style={[styles.activityCard, { borderLeftColor: item.color }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.actTitle}>{item.title}</Text>
                <Text style={styles.actSub} numberOfLines={1}>
                  {item.subtitle}
                </Text>
                <View style={styles.actBottom}>
                  <View style={styles.durBadge}>
                    <Ionicons
                      name="time-outline"
                      size={11}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.durText}>{item.duration}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(t('itin.removeTitle'), t('itin.removeMsg').replace('%s', item.title), [
                    { text: t('itin.cancel'), style: 'cancel' },
                    {
                      text: t('itin.remove'),
                      style: 'destructive',
                      onPress: () => removeFromItinerary(item.id),
                    },
                  ])
                }
                hitSlop={10}
              >
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addActivity} onPress={addBlankActivity}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.addActivityText}>{t('itin.addActivity')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  daysRow: {
    paddingHorizontal: spacing.xl, gap: 10, paddingBottom: spacing.md,
  },
  day: {
    width: 54, paddingVertical: 10, borderRadius: radius.md,
    backgroundColor: colors.surface, alignItems: 'center', marginRight: 8,
  },
  dayActive: { backgroundColor: colors.primary },
  dayLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  dayLabelActive: { color: 'rgba(255,255,255,0.85)' },
  dayNum: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
  dayNumActive: { color: '#fff' },
  summary: {
    marginHorizontal: spacing.xl, backgroundColor: colors.primary,
    borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.lg, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  summaryTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  summarySub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 3 },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  row: { flexDirection: 'row', marginBottom: 10 },
  timeCol: { width: 60, alignItems: 'center' },
  time: {
    fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginBottom: 6,
  },
  timeDot: { width: 12, height: 12, borderRadius: 6 },
  timeLine: { width: 2, flex: 1, marginTop: 2, backgroundColor: colors.border },
  activityCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, marginBottom: 6,
  },
  actTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  actSub: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  actBottom: { flexDirection: 'row', marginTop: 8, gap: 6 },
  durBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.pill, backgroundColor: colors.surface,
  },
  durText: { fontSize: 11, color: colors.textSecondary, marginLeft: 4, fontWeight: '500' },
  addActivity: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6, marginTop: spacing.md, paddingVertical: 14,
    borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  addActivityText: { color: colors.primary, fontWeight: '600', marginLeft: 8 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyTitle: {
    fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 12,
  },
  emptySub: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 6 },
});
