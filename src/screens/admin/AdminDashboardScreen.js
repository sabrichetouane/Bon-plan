// ============================================================
// AdminDashboardScreen.js - THE ADMIN HOME (a bottom-tab screen)
// The first thing an administrator sees. It answers one question:
// "is there anything waiting for me right now?"
// It reads four counters straight from the SQLite database, shows them as
// cards, then offers four rows that open the real moderation screens
// (places, shared plans, reviews, users).
// Nothing is edited here - this screen only COUNTS and NAVIGATES.
// ============================================================

// A "hook" is any function whose name starts with `use`. Hooks are what let a
// plain function remember things between renders (useState), keep a stable
// function around (useCallback), or avoid redoing expensive work (useMemo).
import React, { useCallback, useMemo, useState } from 'react';

// React Native has no <div> and no CSS file. Every box is a <View>, and any
// piece of text MUST sit inside a <Text> or the app crashes.
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl, // the "pull down to reload" spinner attached to a ScrollView
} from 'react-native';

// Ionicons is the ONLY icon family this app uses. Mixing families would make
// the line weights disagree and the app would stop looking like one product.
import { Ionicons } from '@expo/vector-icons';

// useFocusEffect comes from React Navigation. Plain useEffect runs once when
// the component is first created; because tab screens stay alive in the
// background, that would leave stale numbers on screen forever. useFocusEffect
// runs again EVERY time the screen comes back into view - so approving a place
// on another screen is reflected the moment you come back here.
import { useFocusEffect } from '@react-navigation/native';

// ---- shared UI, so this screen cannot drift from the rest of the app ----
import Screen from '../../components/Screen';
import { Loading, EmptyState } from '../../components/Feedback';
import { useTheme, radius, spacing } from '../../theme/colors';
import { useStore, useT } from '../../store';

// `import * as placeRepo` collects EVERY exported function of that file into
// one object, so below we write placeRepo.countByStatus(). It keeps the call
// site obvious: you can always see which table a number came from.
import * as placeRepo from '../../db/placeRepo';
import * as planRepo from '../../db/planRepo';
import * as commentRepo from '../../db/commentRepo';
import * as userRepo from '../../db/userRepo';

// Every counter starts at 0 rather than undefined. If the very first render
// happens before the database has answered, `0` still renders fine, whereas
// `undefined` would print nothing and make the cards look broken.
const EMPTY_COUNTS = {
  placesPending: 0,
  placesHidden: 0,
  placesTotal: 0,
  plansPending: 0,
  plansTotal: 0,
  comments: 0,
  users: 0,
};

export default function AdminDashboardScreen({ navigation }) {
  // The current palette (light or dark). It changes when the user flips the
  // theme in Profile, and this component re-renders automatically.
  const { colors } = useTheme();

  // makeStyles() lives at the bottom of the file and needs `colors`, so the
  // stylesheet has to be built inside the component. useMemo caches the result
  // and only rebuilds it when the palette actually changes - without it we
  // would create a brand new StyleSheet object on every single render.
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // t('some.key') returns the string in the user's chosen language.
  // Never hard-code an English word that the user will read.
  const t = useT();

  // The logged-in account. `isAdmin` is computed once in the store as
  // (user.role === 'admin'), so every screen agrees on what admin means.
  const { user, isAdmin } = useStore();

  // ---------------------------------------------------------------
  // STATE
  // useState returns a pair: the current value, and a function to change it.
  // Calling that function is what tells React "re-draw this screen".
  // ---------------------------------------------------------------
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);        // first load -> big spinner
  const [refreshing, setRefreshing] = useState(false); // pull-to-refresh spinner

  // ---------------------------------------------------------------
  // LOADING THE NUMBERS
  // `async` marks a function that does something slow (here: reading SQLite).
  // `await` pauses inside it until the answer arrives, so the code reads
  // top-to-bottom instead of nesting callbacks.
  // useCallback returns the SAME function object between renders. That matters
  // because useFocusEffect below depends on it - a fresh function on every
  // render would restart the effect endlessly.
  // ---------------------------------------------------------------
  const load = useCallback(async () => {
    // A non-admin has nothing to load. Stop before touching the database.
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Promise.all fires all four queries AT THE SAME TIME and waits for the
      // slowest one. Four separate `await` lines would run them one after
      // another and take roughly four times as long.
      const [placeCounts, planCounts, comments, users] = await Promise.all([
        placeRepo.countByStatus(),     // { approved, pending, hidden }
        planRepo.countPlanStatuses(),  // same shape, public plans only
        commentRepo.listAllComments(), // an ARRAY - we only need its length
        userRepo.listUsers(),          // an ARRAY - ditto
      ]);

      // Build one plain object and store it in a single setCounts call.
      // Keeping the counters in one piece of state means the screen can never
      // show three fresh numbers next to one stale one.
      setCounts({
        placesPending: placeCounts.pending,
        placesHidden: placeCounts.hidden,
        placesTotal: placeCounts.approved + placeCounts.pending + placeCounts.hidden,
        plansPending: planCounts.pending,
        plansTotal: planCounts.approved + planCounts.pending + planCounts.hidden,
        comments: comments.length,
        users: users.length,
      });
    } catch (e) {
      // Never let a database hiccup crash the whole app. Warn in the console
      // (visible in the Expo terminal) and leave the previous numbers alone.
      console.warn('[AdminDashboardScreen] load failed:', e);
    } finally {
      // `finally` runs whether the try succeeded or threw, so the spinner is
      // guaranteed to stop. Without it, one error would spin forever.
      setLoading(false);
    }
  }, [isAdmin]);

  // Re-run load() every time this tab becomes visible.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Pull-to-refresh. It calls the exact same load(), so there is only one
  // place where the numbers are fetched. `refreshing` drives the small spinner
  // that RefreshControl draws at the top of the scroll view.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // ---------------------------------------------------------------
  // THE FOUR STAT CARDS, described as data instead of copy-pasted JSX.
  // Writing them as an array means the card markup exists once, below, and
  // adding a fifth card later is a one-line change.
  // useMemo rebuilds the array only when a number, the palette or the
  // language actually changed.
  // ---------------------------------------------------------------
  const statCards = useMemo(
    () => [
      {
        key: 'placesPending',
        icon: 'time-outline',
        color: colors.warning, // orange = someone is waiting on you
        value: counts.placesPending,
        label: t('admin.pendingPlaces'),
      },
      {
        key: 'placesHidden',
        icon: 'eye-off-outline',
        color: colors.textMuted, // grey = parked, not urgent
        value: counts.placesHidden,
        // Two existing translation keys glued together, so this label is
        // translated in all three languages without inventing a new key.
        label: t('admin.hiddenPlaces'),
      },
      {
        key: 'plansPending',
        icon: 'calendar-outline',
        color: colors.primary,
        value: counts.plansPending,
        label: t('admin.pendingPlans'),
      },
      {
        key: 'users',
        icon: 'people-outline',
        color: colors.success,
        value: counts.users,
        label: t('admin.users'),
      },
    ],
    [counts, colors, t]
  );

  // ---------------------------------------------------------------
  // THE FOUR NAVIGATION ROWS.
  // `route` is the name registered in AppNavigator.js - it must match exactly,
  // because React Navigation looks the screen up by that string.
  // `badge` = how many items are waiting for a decision (orange pill).
  // `total` = how many exist in total (grey, shown when nothing is waiting).
  // Reviews and users have no "pending" state in the database - a review is
  // only approved or hidden - so those two rows always show the grey total.
  // ---------------------------------------------------------------
  const navRows = useMemo(
    () => [
      {
        key: 'places',
        icon: 'location-outline',
        label: t('admin.places'),
        route: 'AdminPlaces',
        badge: counts.placesPending,
        total: counts.placesTotal,
      },
      {
        key: 'plans',
        icon: 'map-outline',
        label: t('admin.plans'),
        route: 'AdminPlans',
        badge: counts.plansPending,
        total: counts.plansTotal,
      },
      {
        key: 'comments',
        icon: 'chatbubble-ellipses-outline',
        label: t('admin.comments'),
        route: 'AdminComments',
        badge: 0,
        total: counts.comments,
      },
      {
        key: 'users',
        icon: 'people-outline',
        label: t('admin.users'),
        route: 'AdminUsers',
        badge: 0,
        total: counts.users,
      },
    ],
    [counts, t]
  );

  // ---------------------------------------------------------------
  // THE GUARD.
  // IMPORTANT: this early return sits AFTER every hook above, never before.
  // React matches hooks up by the ORDER in which they are called, so a
  // `return` placed in the middle would change that order between renders and
  // React would throw "rendered fewer hooks than expected". Rule of thumb:
  // all hooks first, then any conditional return.
  // ---------------------------------------------------------------
  if (!isAdmin) {
    return (
      <Screen>
        <EmptyState icon="lock-closed-outline" title={t('error.notAllowed')} />
      </Screen>
    );
  }

  return (
    // No `edges` prop on purpose: this is a TAB screen, and Screen already
    // defaults to ['top','left','right']. The tab bar handles the bottom -
    // padding it twice would leave a dead grey strip above the bar.
    <Screen>
      {/* A tab root has nothing to go back to, so there is no back button and
          no <ScreenHeader>. We draw a plain title row instead. It sits OUTSIDE
          the ScrollView so it stays put while the content scrolls. */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {t('admin.title')}
        </Text>

        {/* `?.` is optional chaining: if `user` is null this reads as undefined
            instead of crashing. `||` then falls back to the next option. */}
        <Text style={styles.subtitle} numberOfLines={1}>
          {user?.name || user?.email || ''}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        // refreshControl is what makes the whole page draggable-to-reload.
        // It has to live on the ScrollView itself, which is why the ScrollView
        // is always rendered - even while the first load is still running.
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary} // iOS spinner colour
            colors={[colors.primary]}  // Android spinner colour (an array)
          />
        }
      >
        {/* `condition ? a : b` is how you branch inside JSX: a plain `if`
            statement is not allowed in the middle of markup.
            We hide the big spinner during a pull-to-refresh, because
            RefreshControl is already showing its own - swapping the content
            for a spinner under the user's finger looks like a glitch. */}
        {loading && !refreshing ? (
          <Loading style={styles.loadingBox} />
        ) : (
          // <> ... </> is a "Fragment": it groups siblings without adding a
          // real extra View to the layout.
          <>
            {/* ---- STAT CARDS ---- */}
            {/* flexWrap:'wrap' + width '48%' is what makes this a 2-column
                grid that adapts to any phone width. A fixed pixel width would
                overflow on a small screen and leave a gap on a big one. */}
            <View style={styles.grid}>
              {statCards.map((card) => (
                // `key` must be unique and stable. React uses it to tell the
                // cards apart when the list changes, so it can update one card
                // instead of throwing all four away and rebuilding them.
                <View key={card.key} style={styles.statCard}>
                  {/* The array form of `style` merges styles, and later entries
                      win. The inline part is computed at runtime so it cannot
                      live in the StyleSheet. Appending '22' to a hex colour is
                      its alpha channel (~13% opacity): a soft tint made from
                      the very same colour as the icon, so it always matches. */}
                  <View style={[styles.statIcon, { backgroundColor: card.color + '22' }]}>
                    <Ionicons name={card.icon} size={20} color={card.color} />
                  </View>

                  <Text style={styles.statNumber}>{card.value}</Text>

                  {/* Up to 2 lines: translated labels run longer in French,
                      and cutting one to a single line would hide its meaning. */}
                  <Text style={styles.statLabel} numberOfLines={2}>
                    {card.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* ---- NAVIGATION ROWS ---- */}
            {/* One card holds all four rows; hairlines separate them, and the
                last row gets none so the line never doubles up with the card
                border. overflow:'hidden' keeps the pressed highlight inside
                the rounded corners. */}
            <View style={styles.card}>
              {navRows.map((row, index) => (
                <TouchableOpacity
                  key={row.key}
                  // The last row is the one whose index is length - 1. `&&` in
                  // a style array means "add this style only if the test
                  // passed"; a false value is simply ignored by the merger.
                  style={[styles.row, index < navRows.length - 1 && styles.rowBorder]}
                  onPress={() => navigation.navigate(row.route)}
                  // Tells VoiceOver / TalkBack that this is a button and reads
                  // the label out loud. One line, and the app works blind.
                  accessibilityRole="button"
                  accessibilityLabel={row.label}
                >
                  <Ionicons name={row.icon} size={20} color={colors.primary} />

                  {/* flex:1 lets the label take the leftover width, and
                      minWidth:0 lets it SHRINK below its natural size - without
                      that, a long word would push the badge and the chevron
                      off the right edge of the screen. */}
                  <Text style={styles.rowLabel} numberOfLines={1}>
                    {row.label}
                  </Text>

                  {row.badge > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{row.badge}</Text>
                    </View>
                  ) : (
                    <Text style={styles.rowCount}>{row.total}</Text>
                  )}

                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// makeStyles(colors) - the stylesheet as a FUNCTION of the palette.
// It must never be a module-level StyleSheet.create that mentions colors:
// that would run once at import time and freeze the light theme in place, so
// switching to dark mode would leave every border and background unchanged.
// ---------------------------------------------------------------------------
const makeStyles = (colors) =>
  StyleSheet.create({
    // ---- header ----
    header: {
      paddingHorizontal: spacing.xl, // xl (24) is the standard screen edge padding
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    title: { fontSize: 22, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

    // Extra room at the bottom so the last row clears the tab bar comfortably.
    scrollContent: { paddingBottom: 30 },

    // Vertical breathing room while the first load runs, so the spinner is not
    // glued to the header.
    loadingBox: { paddingVertical: spacing.xxl * 2 },

    // ---- stat cards ----
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap', // once two cards fill the row, the next one wraps down
      gap: 12,          // the space between cards, horizontally and vertically
      paddingHorizontal: spacing.xl,
    },
    statCard: {
      width: '48%', // a PERCENTAGE, so the grid fits every screen width
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border, // flat + hairline: this app never uses shadows
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    statIcon: {
      width: 44,
      height: 44,
      borderRadius: 22, // exactly half the width, which is what makes it a circle
      alignItems: 'center',
      justifyContent: 'center',
      // backgroundColor is applied inline per card (the icon colour + '22').
    },
    statNumber: { fontSize: 24, fontWeight: '700', color: colors.text },
    statLabel: {
      fontSize: 12,
      color: colors.textMuted,
      // lineHeight must stay above ~1.6x the font size, otherwise the second
      // line of a wrapped label sits too close and the text looks cramped.
      lineHeight: 20,
    },

    // ---- navigation rows ----
    card: {
      marginTop: spacing.xl,
      marginHorizontal: spacing.xl,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      overflow: 'hidden', // clips the pressed highlight to the rounded corners
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      // minHeight, NEVER height: a fixed height on a box that contains text
      // would clip the label when the user turns up the system font size.
      minHeight: 52,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLabel: {
      flex: 1,     // eat the leftover space, pushing the badge to the right
      minWidth: 0, // ...but still allow shrinking below the text's own width
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    // flexShrink: 0 means "never squash me". The number on the right must stay
    // readable; the label on the left is the side allowed to give way.
    rowCount: { fontSize: 13, color: colors.textMuted, flexShrink: 0 },
    badge: {
      minWidth: 22,       // keeps a single digit from looking like a slit
      paddingHorizontal: 7,
      paddingVertical: 3, // padding, not a fixed height, so digits never clip
      borderRadius: radius.pill,
      backgroundColor: colors.warning + '22',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    badgeText: { fontSize: 12, fontWeight: '700', color: colors.warning },
  });
