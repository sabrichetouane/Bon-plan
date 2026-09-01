// ============================================================
// AdminCommentsScreen.js - REVIEW MODERATION (ADMIN ONLY)
// The admin reads every review users wrote about every place.
// A review can be hidden (it then disappears from the place page
// and stops counting in the average rating), shown again, or
// deleted for good. Tapping a card opens the place it talks about.
// Reached from the Admin dashboard, so it is PUSHED on the stack.
// ============================================================

// React gives us the "hooks" used below. A hook is just a function whose name
// starts with `use`, and that lets a component remember things or react to
// events:
//   useState    -> remember a value between renders (and redraw when it changes)
//   useMemo     -> remember a COMPUTED value so it is not recalculated for nothing
//   useCallback -> remember a FUNCTION so it keeps the same identity between renders
import React, { useCallback, useMemo, useState } from 'react';

// The building blocks React Native draws on screen. There is no <div> here:
//   View             = a box (the equivalent of a div)
//   Text             = the only element allowed to display words
//   FlatList         = a scrolling list that renders only the visible rows
//   TouchableOpacity = anything tappable
//   Alert            = the phone's own confirmation popup
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';

// The single icon family used across the whole app. Never mix icon packs: the
// line weights differ and the screens immediately stop looking related.
import { Ionicons } from '@expo/vector-icons';

// useFocusEffect runs code every time this screen becomes VISIBLE again.
// A plain useEffect would run only once, when the screen is first created -
// not enough here, because the screen stays alive in memory underneath the
// screens pushed on top of it.
import { useFocusEffect } from '@react-navigation/native';

// ---- Shared UI pieces. Using these instead of hand-made views is exactly ----
// ---- what makes this new screen look identical to the rest of the app.  ----
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import IconButton from '../../components/IconButton';
import Chip from '../../components/Chip';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Loading, EmptyState, StatusBadge } from '../../components/Feedback';

// Design tokens: the colours, spacings and corner radii of the app.
import { useTheme, radius, spacing } from '../../theme/colors';

// Global state: `useT` is the translator, `useStore` holds the logged-in user.
import { useStore, useT } from '../../store';

// The database layer. `import * as commentRepo` grabs EVERY exported function
// of that file in one object, so we call them as commentRepo.listAllComments().
import * as commentRepo from '../../db/commentRepo';

export default function AdminCommentsScreen({ navigation }) {
  // The active palette (light or dark). It changes when the user flips the
  // theme switch in Profile, and this screen re-renders on its own.
  const { colors } = useTheme();

  // t('some.key') returns that sentence in the language the user picked.
  // We never write a raw English string that a user will read.
  const t = useT();

  // We need the admin's own id: deleteComment() double-checks who is asking.
  const { userId } = useStore();

  // The stylesheet depends on the colours, so it is BUILT inside the component.
  // useMemo rebuilds it only when `colors` changes (a theme switch), not on
  // every render. A module-level StyleSheet.create could not do this: it would
  // capture the light palette once and stay light forever.
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // ----------------------------------------------------------------
  // STATE - the four things this screen has to remember
  // ----------------------------------------------------------------
  // rows    : every review read from SQLite (the complete, untouched list)
  // loading : true while the first read runs, so we can show a spinner
  // filter  : which chip is selected - 'all' | 'approved' | 'hidden'
  // busyId  : the id of the review whose button was just tapped, so that ONLY
  //           that button shows a spinner instead of the whole list flickering
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);

  // ----------------------------------------------------------------
  // LOADING THE DATA
  // ----------------------------------------------------------------
  // `async` marks a function that does something slow - here, reading the
  // database. `await` pauses inside that function until the answer arrives,
  // without freezing the interface: the user can still scroll while it waits.
  //
  // useCallback keeps the SAME function object between renders. That matters
  // because useFocusEffect below depends on it: a brand-new function on every
  // render would make the effect restart in an endless loop.
  // The dependency array is empty because listAllComments() takes no argument -
  // it returns every review, and we narrow the list down in JavaScript.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await commentRepo.listAllComments();
      setRows(data);
    } catch (e) {
      // If the read fails we log it instead of crashing the app. The list stays
      // empty and the EmptyState below explains that there is nothing to show.
      console.warn('[AdminCommentsScreen] load failed:', e);
    } finally {
      // `finally` runs whether the code worked or blew up, so the spinner can
      // never get stuck on screen forever.
      setLoading(false);
    }
  }, []);

  // Re-run `load` every time the screen comes back into view. So if a user
  // posts a review, or the admin deletes a place on another screen, coming
  // back here shows the truth instead of a stale copy.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ----------------------------------------------------------------
  // THE FILTER CHIPS
  // ----------------------------------------------------------------
  // `id` is an internal English word we compare against - it is NEVER shown.
  // `label` is the translated text the admin actually reads. Keeping the two
  // apart is what prevents the classic bug of comparing a translated label
  // against an English constant, which breaks the moment you switch language.
  const FILTERS = [
    { id: 'all', label: t('list.all') },
    { id: 'approved', label: t('status.approved') },
    { id: 'hidden', label: t('status.hidden') },
  ];

  // listAllComments() already returned EVERY row, so the filtering happens here
  // in JavaScript rather than through a second SQL query: it is instant and it
  // saves a database round-trip every time a chip is tapped.
  //
  // Why useMemo? This screen re-renders for many unrelated reasons - a button
  // becoming busy, the theme changing, the spinner starting. Without useMemo we
  // would walk through the whole array again on every one of those renders.
  // With it, the filtering only runs when `rows` or `filter` really change.
  const visibleRows = useMemo(() => {
    if (filter === 'all') return rows;
    return rows.filter((row) => row.status === filter);
  }, [rows, filter]);

  // ----------------------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------------------

  // Hide an approved review, or bring a hidden one back.
  // The repo also recomputes the place average, because a hidden review must
  // stop counting. That rule lives in the database layer, so no screen can
  // forget to apply it.
  const toggleStatus = async (row) => {
    const nextStatus = row.status === 'hidden' ? 'approved' : 'hidden';
    setBusyId(row.id);
    try {
      await commentRepo.setCommentStatus({ commentId: row.id, status: nextStatus });
      // We re-read from the database instead of patching the array by hand:
      // the database is the source of truth, and this way our copy can never
      // drift away from it.
      await load();
    } catch (e) {
      console.warn('[AdminCommentsScreen] setCommentStatus failed:', e);
    } finally {
      setBusyId(null);
    }
  };

  // The actual deletion - called only once the admin has confirmed.
  const doDelete = async (row) => {
    setBusyId(row.id);
    try {
      // isAdmin: true is what allows deleting a review written by someone else.
      // The repo refuses otherwise: that permission check lives there, not here,
      // so it cannot be skipped by a screen.
      const result = await commentRepo.deleteComment({
        commentId: row.id,
        userId,
        isAdmin: true,
      });

      // The repos return a plain object like { ok: true } instead of throwing,
      // so a refusal is a normal value we have to test for.
      if (!result || !result.ok) {
        Alert.alert(t('common.error'), t('error.notAllowed'), [{ text: t('detail.ok') }]);
      }

      await load();
    } catch (e) {
      console.warn('[AdminCommentsScreen] deleteComment failed:', e);
    } finally {
      setBusyId(null);
    }
  };

  // Deleting cannot be undone, so we always ask first. Alert.alert is React
  // Native's native popup: the third argument is the list of buttons. The
  // 'cancel' / 'destructive' styles are what make the phone render them the
  // way users expect (grey on the left, red on the right).
  const confirmDelete = (row) => {
    Alert.alert(t('comment.deleteTitle'), t('comment.deleteMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => doDelete(row) },
    ]);
  };

  // ----------------------------------------------------------------
  // ONE CARD IN THE LIST
  // ----------------------------------------------------------------
  // FlatList calls this once per row. `item` is one review object, exactly as
  // commentRepo.listAllComments() returned it.
  const renderItem = ({ item }) => {
    // The avatar shows the author's initial. The SQL JOIN guarantees a name
    // exists, but the fallback protects us anyway: reading [0] of undefined
    // would crash the whole list, and one bad row must never kill a screen.
    const initial = (item.authorName || '?').charAt(0).toUpperCase();

    // True while THIS row's own button is working.
    const isBusy = busyId === item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        // Tapping the card opens the place the review is about, so the admin
        // can read it in context before deciding what to do with it.
        onPress={() => navigation.navigate('PlaceDetail', { placeId: item.placeId })}
        accessibilityRole="button"
      >
        {/* ---- TOP ROW: avatar | author + place | stars ---- */}
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter} numberOfLines={1}>
              {initial}
            </Text>
          </View>

          {/* flex:1 lets this column take the leftover width, and minWidth:0
              lets it SHRINK below the width of its own content. Without
              minWidth:0 a long name would push the stars off the right edge
              instead of being cut with an ellipsis - a classic flexbox trap. */}
          <View style={styles.identity}>
            <Text style={styles.author} numberOfLines={1}>
              {item.authorName}
            </Text>

            {/* Which place this review is about, with a small pin in front. */}
            <View style={styles.placeRow}>
              <Ionicons name="location-outline" size={11} color={colors.textMuted} />
              <Text style={styles.placeName} numberOfLines={1}>
                {item.placeName}
              </Text>
            </View>
          </View>

          {/* The 5 stars. [...Array(5)] builds an array of five empty slots we
              can map over - the short way to repeat something a fixed number
              of times. `key` is required by React on every mapped element: it
              uses the key to tell the items apart, so it does not redraw all
              five stars each time. A star is gold while its index is below the
              rating, otherwise it is drawn in the border colour, which reads
              as "empty" without needing a second icon. */}
          <View style={styles.stars}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name="star"
                size={12}
                color={i < item.rating ? colors.star : colors.border}
              />
            ))}
          </View>
        </View>

        {/* ---- THE REVIEW ITSELF ----
            numberOfLines={4} stops a very long rant from making one card as
            tall as the whole screen; the full text is on the place page. */}
        <Text style={styles.reviewText} numberOfLines={4}>
          {item.text}
        </Text>

        {/* ---- BOTTOM ROW: status pill on the left, actions on the right ---- */}
        <View style={styles.actionsRow}>
          <StatusBadge status={item.status} t={t} />

          <View style={styles.actions}>
            {item.status === 'hidden' ? (
              // A hidden review: the useful action is putting it back, so it
              // gets the solid (primary) button.
              <PrimaryButton
                title={t('admin.unhide')}
                icon="eye-outline"
                onPress={() => toggleStatus(item)}
                loading={isBusy}
                full={false}
              />
            ) : (
              // A visible review: hiding is the softer, rarer choice, so it
              // uses the outlined button.
              <SecondaryButton
                title={t('admin.hide')}
                icon="eye-off-outline"
                onPress={() => toggleStatus(item)}
                disabled={isBusy}
                full={false}
              />
            )}

            {/* IconButton already provides a 44pt tap area around a smaller
                visible circle, which is why we use it here instead of wrapping
                an icon in a bare TouchableOpacity. */}
            <IconButton
              name="trash-outline"
              size={20}
              color={colors.danger}
              diameter={38}
              disabled={isBusy}
              onPress={() => confirmDelete(item)}
              accessibilityLabel={t('common.delete')}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ----------------------------------------------------------------
  // THE SCREEN ITSELF
  // ----------------------------------------------------------------
  return (
    // This screen is PUSHED on top of the tab navigator, so no tab bar is
    // padding the bottom for us - we ask the safe area to protect all four
    // edges, including the home indicator area at the bottom.
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={t('admin.comments')} onBack={() => navigation.goBack()} />

      {/* The filter chips. There are only three, so a plain row is enough -
          no horizontal scroll needed. */}
      <View style={styles.chipsRow}>
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            active={filter === f.id}
            onPress={() => setFilter(f.id)}
          />
        ))}
      </View>

      {loading ? (
        // First read in progress: a centred spinner, so the screen never looks
        // broken or empty while the database is being opened.
        <Loading />
      ) : (
        <FlatList
          data={visibleRows}
          // keyExtractor tells React which row is which, so removing one review
          // makes that row disappear instead of redrawing the entire list.
          // Ids from SQLite are numbers, and a key has to be a string.
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          // Rendered in place of the rows when the filtered array is empty -
          // for example the "Hidden" chip while nothing has been hidden yet.
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-outline"
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
// makeStyles is a FUNCTION that receives the current palette and returns the
// stylesheet. That is the whole trick behind dark mode here: a plain
// module-level StyleSheet.create would capture the light colours once, when
// the file is first imported, and would never update afterwards.
// ============================================================
const makeStyles = (colors) =>
  StyleSheet.create({
    // The chips sit between the header and the list. `gap` spaces them out
    // without needing a margin on every child.
    chipsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.md,
    },

    // The padding goes on the CONTENT container, not on the FlatList itself,
    // so the scrollbar still runs along the true edge of the screen. The extra
    // bottom padding lets the last card scroll clear of the bottom edge.
    listContent: {
      padding: spacing.xl,
      paddingTop: 0,
      paddingBottom: spacing.xxl,
      gap: 12,
      flexGrow: 1, // lets the EmptyState fill and centre itself in an empty list
    },

    // The standard card of this app: flat, hairline border, large radius.
    // No shadow - shadows are reserved for things floating over the map.
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.md,
    },

    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },

    // A circle MUST have a fixed width and height, with a radius of exactly
    // half of that, or it turns into an egg. It is safe here because it holds
    // a single letter, so it cannot overflow the way a box of real text would.
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0, // never let flexbox squash the circle into an oval
    },
    avatarLetter: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
    },

    // The flexible middle column - see the explanation next to it in the JSX.
    identity: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    author: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    placeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    placeName: {
      flex: 1,
      minWidth: 0,
      fontSize: 11,
      color: colors.textMuted,
    },

    // flexShrink:0 keeps the five stars intact: they are the part that must
    // stay readable, so the author name is the side that gets truncated.
    stars: {
      flexDirection: 'row',
      gap: 1,
      flexShrink: 0,
    },

    reviewText: {
      fontSize: 13,
      color: colors.text,
      // About 1.6x the font size. Anything tighter turns into a wall of text,
      // and a smaller fixed value would clip accents and Arabic descenders.
      lineHeight: 21,
    },

    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      // flexWrap lets the buttons drop to a second line on a narrow phone, or
      // when the user has large system text, instead of being squeezed.
      flexWrap: 'wrap',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
  });
