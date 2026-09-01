// ============================================================
// AdminPlansScreen.js - MODERATION OF SHARED DAY-PLANS
// A user can build a day-plan ("Saturday in Bizerte") and tick
// "share it". Sharing does not publish it straight away: it puts
// the plan in a waiting queue. This screen IS that queue. The
// admin filters by status, peeks inside a plan to see the
// activities it holds, then approves, rejects, hides or deletes it.
// ============================================================

// React gives us the "hooks" used below. A hook is just a function whose name
// starts with `use`, and it lets a component remember things and react to events.
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// useFocusEffect comes from React Navigation. Unlike useEffect (which runs once
// when the screen is first created), this one runs EVERY time the screen becomes
// visible again - so coming back from another screen always shows fresh data.
import { useFocusEffect } from '@react-navigation/native';

// Design tokens. Never hard-code a colour, a padding or a corner radius:
// everything below reads from these, so light and dark mode both work for free.
import { useTheme, radius, spacing } from '../../theme/colors';

// The shared building blocks. Using them is what makes this screen look
// identical to the rest of the app instead of "a page someone bolted on".
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import IconButton from '../../components/IconButton';
import Chip from '../../components/Chip';
import { PrimaryButton, SecondaryButton, ButtonRow } from '../../components/Buttons';
import { Loading, EmptyState, StatusBadge } from '../../components/Feedback';

// useT() returns the translate function. t('admin.plans') gives "Shared plans"
// in English, "Plans partages" in French, and the Arabic wording in Arabic.
import { useT } from '../../store';

// The database layer. `* as planRepo` imports every exported function at once,
// so we call them as planRepo.listPlansForModeration(...). Every one of them is
// async: it talks to SQLite, which takes time, so it hands back a Promise.
import * as planRepo from '../../db/planRepo';

export default function AdminPlansScreen({ navigation }) {
  // Read the palette that is active right now, then build the stylesheet FROM
  // it. useMemo caches the result: the styles are only rebuilt when `colors`
  // really changes (the user flipping dark mode), not on every render.
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useT();

  // ----------------------------------------------------------
  // STATE
  //
  // useState gives a component a memory. It returns a pair: the current value,
  // and a function that changes it. Calling that function is also how you tell
  // React "something changed, please draw this screen again".
  // ----------------------------------------------------------

  // Which chip is selected. It starts on 'pending' because that is the queue
  // where the admin actually has work waiting.
  const [filter, setFilter] = useState('pending');

  // ----- THE FILTER CHIPS -----------------------------------------------
  // Note the split between the two fields:
  //   id     the English word the DATABASE understands ('pending'). Never shown.
  //   label  the translated text the USER reads.
  // Keeping them apart is what prevents the classic bug of comparing a
  // translated French label against an English constant and never matching.
  //
  // useMemo rebuilds this array only when `t` changes - i.e. when the user
  // switches language - instead of on every single render.
  const filters = useMemo(
    () => [
      { id: 'pending', label: t('status.pending') },
      { id: 'approved', label: t('status.approved') },
      { id: 'hidden', label: t('status.hidden') },
      { id: 'all', label: t('list.all') },
    ],
    [t]
  );

  // The plans currently on screen. It starts as an empty ARRAY, not null, so
  // that FlatList never crashes on the very first render, before data arrives.
  const [rows, setRows] = useState([]);

  // True while we are waiting for SQLite. It starts true so the first thing
  // painted is a spinner instead of a flash of "nothing waiting".
  const [loading, setLoading] = useState(true);

  // The id of the plan whose preview is open, or null when they are all shut.
  // Storing ONE id (rather than a true/false per row) is what makes the list
  // behave like an accordion: opening a card closes the previous one by itself.
  const [expandedId, setExpandedId] = useState(null);

  // ----- THE CACHE ------------------------------------------------------
  // A plain object used as a lookup table:  { 12: [item, item], 15: [item] }
  // The key is a plan id, the value is that plan's list of activities.
  //
  // WHY CACHE AT ALL? The list query only COUNTS the activities, it does not
  // carry them, so opening a card needs a second database read. Without this
  // object, closing and re-opening the same card would hit SQLite again every
  // single time. With it we read once per plan and every later open is instant.
  //
  // The cache is deliberately thrown away when the filter changes or a plan is
  // deleted, so it can never show activities that no longer exist.
  const [itemsByPlanId, setItemsByPlanId] = useState({});

  // Which plan is fetching its activities right now (for the small spinner
  // inside that one card), and which plan has an action running.
  const [loadingItemsId, setLoadingItemsId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // ----------------------------------------------------------
  // LOADING THE LIST
  // ----------------------------------------------------------

  // useCallback hands back the SAME function object between renders for as long
  // as its dependencies ([filter]) stay the same. That matters because
  // useFocusEffect below depends on `load`: a brand-new function on every render
  // would look like a change to the effect and make it re-run endlessly.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      // `await` pauses this function until the database answers, WITHOUT
      // freezing the app - the rest of the UI keeps responding meanwhile.
      const data = await planRepo.listPlansForModeration(filter);
      setRows(data);
    } catch (e) {
      // A database error must never crash the screen. We log it for the
      // developer and quietly leave whatever was already on screen.
      console.warn('[AdminPlansScreen] load failed:', e);
    } finally {
      // `finally` runs whether the try succeeded or threw, so the spinner can
      // never get stuck on screen after a failure.
      setLoading(false);
    }
  }, [filter]);

  // Re-run `load` every time this screen comes back into view, so a plan
  // approved elsewhere - or one a user has just shared - shows up on return.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ----------------------------------------------------------
  // CHANGING THE FILTER
  // ----------------------------------------------------------
  // Setting `filter` alone would already reload the list, because `load`
  // depends on it. But the open card and the cached activities belong to the
  // OLD list, so we clear them too - otherwise a card could stay expanded
  // showing a plan that is not even in the new list.
  const changeFilter = (id) => {
    setFilter(id);
    setExpandedId(null);
    setItemsByPlanId({});
  };

  // ----------------------------------------------------------
  // OPENING / CLOSING A CARD
  // ----------------------------------------------------------
  const toggleExpand = async (plan) => {
    // Tapping the card that is already open simply closes it.
    if (expandedId === plan.id) {
      setExpandedId(null);
      return;
    }

    // Open it right away, so the tap feels instant even if the read is slow.
    setExpandedId(plan.id);

    // THE CACHE CHECK. If this plan's activities were fetched once already we
    // stop here: no spinner, no database call, the rows are still in memory.
    if (itemsByPlanId[plan.id]) return;

    setLoadingItemsId(plan.id);
    try {
      // getPlan returns the plan with its items attached, or null if the row
      // disappeared between reading the list and tapping the card.
      const full = await planRepo.getPlan(plan.id);

      // Store the items under this plan's id. We build a NEW object with the
      // spread operator (...) instead of writing prev[plan.id] = ..., because
      // React compares objects by identity: editing the old one in place keeps
      // the same reference, and the screen would simply not redraw.
      // `full?.items` - the ?. stops a crash when full is null.
      setItemsByPlanId((prev) => ({ ...prev, [plan.id]: full?.items || [] }));
    } catch (e) {
      console.warn('[AdminPlansScreen] getPlan failed:', e);
      // Cache an empty list, so a plan that failed does not retry on every tap.
      setItemsByPlanId((prev) => ({ ...prev, [plan.id]: [] }));
    } finally {
      setLoadingItemsId(null);
    }
  };

  // ----------------------------------------------------------
  // MODERATION ACTIONS
  // ----------------------------------------------------------
  // One function covers approve / reject / hide / show again, because all four
  // are the very same database call with a different status word.
  const changeStatus = async (plan, status) => {
    setBusyId(plan.id); // disables this card's buttons and shows a spinner
    try {
      await planRepo.setPlanStatus({ planId: plan.id, status });

      // We reload instead of patching the row in memory. On the "pending"
      // filter an approved plan must DISAPPEAR from the list, and only a fresh
      // query knows that. It also keeps the screen honest if the write failed.
      await load();
    } catch (e) {
      console.warn('[AdminPlansScreen] setPlanStatus failed:', e);
    } finally {
      setBusyId(null);
    }
  };

  // Deleting cannot be undone, so we always ask first. Alert.alert is React
  // Native's built-in dialog: (title, message, array of buttons).
  const confirmDelete = (plan) => {
    Alert.alert(
      t('admin.deleteTitle'),
      // '%s' is a placeholder sitting inside the translated sentence. .replace
      // swaps it for the real title, so each language keeps its own word order.
      t('plan.deleteMsg').replace('%s', plan.title),
      [
        // style 'cancel' puts this button in the safe spot on both platforms;
        // 'destructive' paints the other one red on iOS.
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => doDelete(plan) },
      ]
    );
  };

  const doDelete = async (plan) => {
    setBusyId(plan.id);
    try {
      await planRepo.deletePlan(plan.id);

      // The plan is gone, so drop everything still pointing at it: the open
      // preview and its cached activities. A stale cache entry would waste
      // memory and could even resurface if SQLite reused that id later.
      if (expandedId === plan.id) setExpandedId(null);
      setItemsByPlanId((prev) => {
        const next = { ...prev }; // copy first - never edit state in place
        delete next[plan.id];
        return next;
      });

      await load();
    } catch (e) {
      console.warn('[AdminPlansScreen] deletePlan failed:', e);
    } finally {
      setBusyId(null);
    }
  };

  // ----------------------------------------------------------
  // ONE ACTIVITY ROW INSIDE AN OPEN CARD -> "09:00  Breakfast  ·  1h"
  // ----------------------------------------------------------
  const renderItemRow = (item) => (
    // `key` tells React which row is which when the list changes, so it can
    // reuse the rows that stayed put instead of rebuilding every one of them.
    <View key={item.id} style={styles.itemRow}>
      {/* flexShrink:0 - the time must stay fully readable, so it never shrinks. */}
      <Text style={styles.itemTime} numberOfLines={1}>
        {item.time}
      </Text>

      {/* flex:1 + minWidth:0 - the title is the flexible side and takes the
          leftover width. Without minWidth:0 a flex child refuses to shrink
          below the width of its own text and pushes the duration off the card. */}
      <Text style={styles.itemTitle} numberOfLines={1}>
        {item.title}
      </Text>

      <Text style={styles.itemDot}>·</Text>

      <Text style={styles.itemDuration} numberOfLines={1}>
        {item.duration}
      </Text>
    </View>
  );

  // ----------------------------------------------------------
  // ONE PLAN CARD
  //
  // FlatList calls this once per row. Destructuring `{ item: plan }` renames
  // FlatList's generic `item` to the clearer name `plan`.
  // ----------------------------------------------------------
  const renderPlan = ({ item: plan }) => {
    const isOpen = expandedId === plan.id;
    const isBusy = busyId === plan.id;
    const cachedItems = itemsByPlanId[plan.id]; // undefined until fetched once

    return (
      <View style={styles.card}>
        {/* --- HEADER: tapping anywhere in here opens or closes the preview --- */}
        <TouchableOpacity
          style={styles.cardHead}
          onPress={() => toggleExpand(plan)}
          // These two tell a screen reader that this is a button and whether
          // it is currently open. One line each, and the app becomes usable
          // by someone who cannot see it.
          accessibilityRole="button"
          accessibilityState={{ expanded: isOpen }}
        >
          {/* The tinted circle. A fixed width/height is safe here because it
              holds an ICON, not text - it can never be clipped by a big font. */}
          <View style={styles.iconCircle}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
          </View>

          {/* The flexible middle column: title on top, meta line underneath. */}
          <View style={styles.headText}>
            <Text style={styles.title} numberOfLines={1}>
              {plan.title}
            </Text>

            {/* All three facts on ONE line so they shrink as a single block.
                The separators are part of the text rather than separate Text
                elements, which lets numberOfLines={1} cut at a natural place. */}
            <Text style={styles.meta} numberOfLines={1}>
              {plan.dayDate}
              {'  ·  '}
              {plan.itemCount} {t('plan.activities')}
              {'  ·  '}
              {t('admin.by')} {plan.authorName}
            </Text>
          </View>

          {/* The right column must stay fully readable, so it never shrinks -
              the title is the part that truncates instead. */}
          <View style={styles.headRight}>
            <StatusBadge status={plan.status} t={t} />
            <Ionicons
              // The chevron flips to point up while the card is open: a small
              // hint that tapping again will close it.
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textMuted}
            />
          </View>
        </TouchableOpacity>

        {/* --- THE PREVIEW ---
            `condition ? <A /> : null` is how JSX shows something only
            sometimes. Rendering null simply draws nothing at all. */}
        {isOpen ? (
          <View style={styles.preview}>
            {loadingItemsId === plan.id ? (
              // A small inline spinner, not the full-screen <Loading />: only
              // this one card is waiting, the rest of the list still works.
              <ActivityIndicator size="small" color={colors.primary} />
            ) : cachedItems && cachedItems.length > 0 ? (
              // .map turns the array of activities into an array of rows.
              cachedItems.map(renderItemRow)
            ) : (
              <Text style={styles.previewEmpty}>0 {t('plan.activities')}</Text>
            )}
          </View>
        ) : null}

        {/* THE ACTIONS. ButtonRow is just a row with a 10pt gap; each text
            button gets flex:1 so they share the width evenly, and full={false}
            so they do not each try to stretch to the whole row on their own. */}
        <ButtonRow style={styles.actions}>
          {/* WHICH BUTTONS APPEAR DEPENDS ON THE CURRENT STATUS. Offering
              "Approve" on an already-approved plan would be confusing, so we
              branch on plan.status and render only the moves that make sense
              from where this plan is right now. */}
          {plan.status === 'pending' ? (
            // <>...</> is a Fragment: it groups two elements without adding a
            // real View to the layout, so both stay direct children of the row
            // and their flex:1 keeps working.
            <>
              <PrimaryButton
                title={t('admin.approve')}
                icon="checkmark"
                full={false}
                style={styles.action}
                loading={isBusy}
                disabled={isBusy}
                onPress={() => changeStatus(plan, 'approved')}
              />
              <SecondaryButton
                title={t('admin.reject')}
                icon="close"
                full={false}
                style={styles.action}
                disabled={isBusy}
                onPress={() => changeStatus(plan, 'hidden')}
              />
            </>
          ) : plan.status === 'approved' ? (
            <SecondaryButton
              title={t('admin.hide')}
              icon="eye-off-outline"
              full={false}
              style={styles.action}
              disabled={isBusy}
              onPress={() => changeStatus(plan, 'hidden')}
            />
          ) : (
            <PrimaryButton
              title={t('admin.unhide')}
              icon="eye-outline"
              full={false}
              style={styles.action}
              loading={isBusy}
              disabled={isBusy}
              onPress={() => changeStatus(plan, 'approved')}
            />
          )}

          {/* The permanent delete. IconButton already gives us a 44pt tap area
              even though the red circle looks smaller, which is why we use it
              here instead of a bare TouchableOpacity. It is deliberately NOT
              given flex:1 - it should stay a square at the end of the row. */}
          <IconButton
            name="trash-outline"
            size={20}
            color={colors.danger}
            diameter={38}
            disabled={isBusy}
            onPress={() => confirmDelete(plan)}
            accessibilityLabel={t('common.delete')}
          />
        </ButtonRow>
      </View>
    );
  };

  // ----------------------------------------------------------
  // THE SCREEN ITSELF
  // ----------------------------------------------------------
  return (
    // This screen is PUSHED onto the navigation stack - it has a back arrow and
    // no tab bar beneath it - so it has to pad its own bottom edge. Otherwise
    // the last card sits under the phone's home indicator.
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={t('admin.plans')} onBack={() => navigation.goBack()} />

      {/* THE FILTER ROW. flexWrap 'wrap' lets the chips drop to a second line on
          a narrow phone, or in a language with longer words, instead of being
          squashed or pushed off the edge. */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          // `key` is required whenever you build elements from an array. React
          // uses it to tell the items apart between renders so it can reuse the
          // right ones instead of rebuilding them all. The id is stable and
          // unique, which is exactly what a key needs to be.
          <Chip
            key={f.id}
            label={f.label}
            active={filter === f.id} // compare IDS, never the translated labels
            onPress={() => changeFilter(f.id)}
          />
        ))}
      </View>

      {loading ? (
        // The first paint, and every filter change: one centred spinner.
        <Loading />
      ) : (
        <FlatList
          data={rows}
          // The key has to be a STRING, and SQLite ids are numbers, so String()
          // converts them. Keys are how React tracks rows between renders.
          keyExtractor={(plan) => String(plan.id)}
          renderItem={renderPlan}
          contentContainerStyle={styles.listContent}
          // Rendered automatically when `data` is empty - no `if` needed here.
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={t('admin.nothingPending')}
              subtitle={t('admin.nothingPendingSub')}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

// ============================================================
// STYLES
//
// This is a FUNCTION of `colors`, not a StyleSheet.create sitting at the top of
// the file. A module-level stylesheet is built once when the app starts, which
// would freeze the light-mode colours in place and leave dark mode broken.
// ============================================================
const makeStyles = (colors) =>
  StyleSheet.create({
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap', // wrap to a second line rather than overflow
      gap: spacing.sm, // 8pt between chips, horizontally and vertically
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },

    listContent: {
      padding: spacing.xl,
      gap: 12, // vertical space between cards
      // Extra room at the very bottom so the last card scrolls comfortably
      // clear of the screen edge and the gesture bar.
      paddingBottom: spacing.xxl,
      // Lets the EmptyState centre itself in the leftover space when the list
      // has no rows, instead of hugging the top.
      flexGrow: 1,
    },

    // The standard card of this app: flat, hairline border, large radius.
    // No shadow - shadows are reserved for things floating over the map.
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.md,
    },

    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },

    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22, // exactly half the width, or it is not a circle
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0, // never squashed by a long title next to it
    },

    // The flexible column. minWidth:0 is the important half: without it a flex
    // child will not shrink below the natural width of the text inside it.
    headText: { flex: 1, minWidth: 0, gap: 3 },

    title: { fontSize: 15, fontWeight: '700', color: colors.text },

    meta: {
      fontSize: 11,
      color: colors.textMuted,
      // Roughly 1.6x the font size. Anything tighter clips French accents
      // and the marks above Arabic letters.
      lineHeight: 18,
    },

    // The badge plus the chevron, kept whole so the title truncates instead.
    headRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },

    // The expanded activity list, separated from the header by a hairline.
    preview: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
      gap: spacing.sm,
    },

    itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

    itemTime: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      // minWidth, never a fixed width: the times line up in a neat column but
      // the box can still grow when the user has large text turned on.
      minWidth: 44,
      flexShrink: 0,
      lineHeight: 19,
    },
    itemTitle: { fontSize: 12, color: colors.textSecondary, flex: 1, minWidth: 0, lineHeight: 19 },
    itemDot: { fontSize: 12, color: colors.textMuted, flexShrink: 0 },
    itemDuration: { fontSize: 12, color: colors.textMuted, flexShrink: 0, lineHeight: 19 },

    previewEmpty: { fontSize: 12, color: colors.textMuted, lineHeight: 19 },

    actions: {
      alignItems: 'center', // keeps the round trash button centred on the row
    },

    // Every text button in the row shares the width equally.
    action: { flex: 1 },
  });
