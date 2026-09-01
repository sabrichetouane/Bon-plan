// ============================================================================
// AdminPlacesScreen.js - THE MODERATION QUEUE FOR PLACES
//
// Only admins reach this screen (the navigator hides the Admin tab otherwise).
// It lists every place in the database, filtered by its status, and lets the
// admin approve a submission, hide it, put a hidden one back, or delete it for
// good. A place stays invisible to normal users until it is 'approved'.
// It is PUSHED on top of the tabs, so it gets a back arrow and it must pad its
// own bottom edge - there is no tab bar underneath it here.
// ============================================================================

// React itself, plus the three hooks this screen needs.
//   useState    -> remember a value between renders. When you change it with
//                  its setter, React re-runs the component and redraws.
//   useMemo     -> compute something once and reuse it until its inputs change.
//   useCallback -> the same idea, but for FUNCTIONS: it hands back the very
//                  same function object on every render, which matters below.
import React, { useCallback, useMemo, useState } from 'react';

// The raw building blocks of React Native. There is no <div> here: a View is a
// box, a Text is text, an Image is a picture, and a FlatList is a scrolling
// list that only renders the rows currently on screen (so a 500-row list stays
// fast). Alert shows the phone's own native confirmation dialog.
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';

// useFocusEffect comes from React Navigation. A normal useEffect runs once when
// the screen is CREATED - but this screen stays alive in memory while you push
// another screen over it. useFocusEffect runs again every time it comes back
// into view, which is exactly what a moderation list needs.
import { useFocusEffect } from '@react-navigation/native';

// --- Shared UI. Never re-style these; that is the whole point of them. ------
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import IconButton from '../../components/IconButton';
import Chip from '../../components/Chip';
import { PrimaryButton, SecondaryButton, ButtonRow } from '../../components/Buttons';
import { Loading, EmptyState, StatusBadge } from '../../components/Feedback';

// The database stores a photo as a short TEXT key ('real/corniche-1').
// resolveImage turns that key back into something <Image> can display.
import { resolveImage } from '../../data/assetRegistry';

// useT gives us the translator function: t('admin.places') -> 'Lieux' in French.
import { useT } from '../../store';

// `import * as placeRepo` grabs EVERY exported function of that file in one
// object, so we call them as placeRepo.listPlacesForModeration(...). All of
// them talk to SQLite, so all of them are async and must be awaited.
import * as placeRepo from '../../db/placeRepo';

// Design tokens. Using these instead of raw numbers is what keeps this screen
// looking like it was drawn by the same hand as all the others.
import { useTheme, radius, spacing } from '../../theme/colors';

export default function AdminPlacesScreen({ navigation }) {
  const { colors } = useTheme();
  const t = useT();

  // Styles depend on the palette, so they are built inside the component.
  // useMemo rebuilds the StyleSheet only when `colors` actually changes - i.e.
  // when the user flips dark mode - instead of on every single render.
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  // Which bucket of places we are looking at. This holds an ENGLISH ID.
  const [filter, setFilter] = useState('pending');

  // The rows we got back from the database. Starts empty because the first
  // render happens BEFORE the database has answered - React cannot wait.
  const [rows, setRows] = useState([]);

  // True while the query is in flight, so we can show a spinner rather than a
  // misleading "nothing here" message.
  const [loading, setLoading] = useState(true);

  // The id of the place whose button was just tapped. We keep it so that ONE
  // row can show a spinner and refuse further taps, instead of freezing the
  // whole screen. null = nothing is busy.
  const [busyId, setBusyId] = useState(null);

  // --------------------------------------------------------------------------
  // THE FILTER CHIPS
  //
  // WHY `id` AND `label` ARE TWO SEPARATE THINGS - this is the important bit:
  // the LABEL is what the human reads, so it must be translated ("En attente"
  // in French). The ID is what we compare against and what we send to the
  // database, so it must NEVER be translated - the SQL column really does
  // contain the English word 'pending'. If we stored the label in state, then
  // switching the app to French would make filter === 'pending' false forever
  // and the list would silently go empty. Keeping the two apart makes that
  // whole class of bug impossible.
  //
  // useMemo with [t] rebuilds this list when the language changes, so the chips
  // are re-translated, while the ids stay put.
  // --------------------------------------------------------------------------
  const filters = useMemo(
    () => [
      { id: 'pending', label: t('status.pending') },
      { id: 'approved', label: t('status.approved') },
      { id: 'hidden', label: t('status.hidden') },
      { id: 'all', label: t('list.all') },
    ],
    [t]
  );

  // --------------------------------------------------------------------------
  // LOADING THE DATA
  //
  // useCallback keeps the SAME function object between renders as long as
  // `filter` is unchanged. useFocusEffect below depends on `load`, so without
  // useCallback a brand-new function would be created on every render, the
  // effect would see a "changed" dependency and restart the query in an endless
  // loop. This is the classic React Native infinite-fetch bug.
  // --------------------------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      // `await` pauses this function until SQLite replies, without blocking the
      // UI thread - the app keeps animating while the query runs.
      const data = await placeRepo.listPlacesForModeration(filter);
      setRows(data);
    } catch (e) {
      // A failed read must not crash the app. We log it and simply keep
      // whatever was on screen before.
      console.warn('[AdminPlacesScreen] load failed:', e);
    } finally {
      // `finally` runs whether the try succeeded or threw, so the spinner can
      // never get stuck on forever after an error.
      setLoading(false);
    }
  }, [filter]);

  // Runs when the screen appears AND every time it is focused again - so if the
  // admin opens a place, comes back, the list already shows the new status.
  // Changing the chip changes `load`, which re-runs this too, so this single
  // hook covers both cases.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------

  // Approve / hide / restore. `status` is one of the three English ids.
  // After the write we call load() again so the row moves to its new bucket
  // (and disappears from this one) instead of showing stale information.
  const changeStatus = async (place, status) => {
    setBusyId(place.id);
    try {
      await placeRepo.setPlaceStatus({ id: place.id, status });
      await load();
    } catch (e) {
      console.warn('[AdminPlacesScreen] setPlaceStatus failed:', e);
    } finally {
      setBusyId(null);
    }
  };

  // The actual delete, only ever reached after the admin confirms below.
  const doDelete = async (place) => {
    setBusyId(place.id);
    try {
      await placeRepo.deletePlace(place.id);
      await load();
    } catch (e) {
      console.warn('[AdminPlacesScreen] deletePlace failed:', e);
    } finally {
      setBusyId(null);
    }
  };

  // Deleting cannot be undone, so we always ask first. Alert.alert is the
  // phone's own dialog: title, message, then an array of buttons.
  // style 'cancel' puts it in the safe position, 'destructive' paints it red on
  // iOS. The message has a %s placeholder that we fill with the real name -
  // that way ONE translated sentence works for every place, in every language.
  const confirmDelete = (place) => {
    Alert.alert(t('admin.deleteTitle'), t('admin.deletePlaceMsg').replace('%s', place.name), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => doDelete(place) },
    ]);
  };

  // --------------------------------------------------------------------------
  // ONE ROW OF THE LIST
  //
  // FlatList calls renderItem for each visible row and hands us { item }.
  // We rename it to `place` so the code below reads like English.
  // --------------------------------------------------------------------------
  const renderPlace = ({ item: place }) => {
    // True while THIS row is being written to the database.
    const busy = busyId === place.id;

    // Category and location joined into one grey line. filter(Boolean) throws
    // away anything null or empty, so we never print a stray separator for a
    // place that has no location saved.
    const subtitle = [place.category, place.location].filter(Boolean).join('  ·  ');

    return (
      <View style={styles.card}>
        {/* THE TAPPABLE BODY. It is a TouchableOpacity wrapping only the photo
            and the text - the buttons underneath are separate components, so
            tapping "Approve" never accidentally opens the place as well. */}
        <TouchableOpacity
          style={styles.body}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('PlaceDetail', { placeId: place.id })}
          accessibilityRole="button"
          accessibilityLabel={place.name}
        >
          {/* resolveImage may return undefined for an unknown key; <Image> then
              just shows its own background, which is why the thumbnail has a
              grey `surface` colour behind it. */}
          <Image source={resolveImage(place.image)} style={styles.thumb} />

          {/* flex:1 lets this column take the leftover width, and minWidth:0 is
              what actually PERMITS it to shrink below its content size. Without
              minWidth:0 a long name pushes the row off the edge of the screen. */}
          <View style={styles.info}>
            {/* numberOfLines={1} turns anything too long into "Restaurant du..."
                instead of wrapping and making rows different heights. */}
            <Text style={styles.name} numberOfLines={1}>
              {place.name}
            </Text>

            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              {/* The coloured Pending / Approved / Hidden pill. It needs the
                  translator passed in so the word itself is localised. */}
              <StatusBadge status={place.status} t={t} />

              {/* The places that shipped with the app have no author, so we only
                  render this when there is a name to show. `x ? y : null` is how
                  you write "render this only if" inside JSX. */}
              {place.authorName ? (
                <Text style={styles.author} numberOfLines={1}>
                  {t('admin.by')} {place.authorName}
                </Text>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>

        {/* THE ACTIONS. ButtonRow is just a row with a 10pt gap; each text
            button gets flex:1 so they share the width evenly, and full={false}
            so they do not each try to stretch to the whole row on their own. */}
        <ButtonRow style={styles.actions}>
          {/* WHICH BUTTONS APPEAR DEPENDS ON THE CURRENT STATUS. Showing
              "Approve" on an already-approved place would be confusing, so we
              branch on place.status and render only the moves that make sense
              from where this place is right now. */}
          {place.status === 'pending' ? (
            // <>...</> is a Fragment: it groups two elements without adding a
            // real View to the layout, so both stay direct children of the row
            // and keep their flex:1 share of the width.
            <>
              <PrimaryButton
                title={t('admin.approve')}
                icon="checkmark"
                full={false}
                style={styles.action}
                loading={busy}
                disabled={busy}
                onPress={() => changeStatus(place, 'approved')}
              />
              {/* "Reject" does not delete anything - it just hides the place, so
                  the submission is still there if the admin changes their mind. */}
              <SecondaryButton
                title={t('admin.reject')}
                icon="close"
                full={false}
                style={styles.action}
                disabled={busy}
                onPress={() => changeStatus(place, 'hidden')}
              />
            </>
          ) : null}

          {place.status === 'approved' ? (
            <SecondaryButton
              title={t('admin.hide')}
              icon="eye-off-outline"
              full={false}
              style={styles.action}
              disabled={busy}
              onPress={() => changeStatus(place, 'hidden')}
            />
          ) : null}

          {place.status === 'hidden' ? (
            <PrimaryButton
              title={t('admin.unhide')}
              icon="eye-outline"
              full={false}
              style={styles.action}
              loading={busy}
              disabled={busy}
              onPress={() => changeStatus(place, 'approved')}
            />
          ) : null}

          {/* The permanent delete. IconButton already gives us a 44pt tap area
              even though the red circle looks smaller, which is why we use it
              here instead of a bare TouchableOpacity. It is deliberately NOT
              given flex:1 - it should stay a square at the end of the row. */}
          <IconButton
            name="trash-outline"
            size={20}
            color={colors.danger}
            diameter={38}
            disabled={busy}
            onPress={() => confirmDelete(place)}
            accessibilityLabel={t('common.delete')}
          />
        </ButtonRow>
      </View>
    );
  };

  // --------------------------------------------------------------------------
  // THE SCREEN
  // --------------------------------------------------------------------------
  return (
    // This screen is pushed on top of the tabs, so nothing covers its bottom
    // edge - it has to keep the home-indicator area clear itself.
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={t('admin.places')} onBack={() => navigation.goBack()} />

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
            onPress={() => setFilter(f.id)}
          />
        ))}
      </View>

      {loading ? (
        // First paint after opening or after a filter change: a spinner is
        // honest, showing an empty list would be a lie.
        <Loading />
      ) : (
        <FlatList
          data={rows}
          // keyExtractor is the `key` prop for list rows. String() because ids
          // arrive from SQLite as numbers and React wants a string here.
          keyExtractor={(place) => String(place.id)}
          renderItem={renderPlace}
          // contentContainerStyle pads the CONTENT inside the scroll area.
          // Putting the padding on the list itself instead would clip the rows
          // as they scroll past.
          contentContainerStyle={styles.listContent}
          // Rendered in place of the rows when `data` is empty.
          ListEmptyComponent={
            <EmptyState
              icon="folder-open-outline"
              title={t('admin.nothingPending')}
              subtitle={t('admin.nothingPendingSub')}
            />
          }
          // Hides the scrollbar flash on iOS; purely cosmetic.
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

// ============================================================================
// STYLES
//
// This is a FACTORY, not a plain StyleSheet: it takes the current palette and
// returns a fresh sheet. It has to work this way because a module-level
// StyleSheet.create is evaluated once, when the file is first imported - that
// would freeze the light-mode colours in place and dark mode would do nothing.
// ============================================================================
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

    // The tappable top half: photo on the left, text column on the right.
    body: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },

    thumb: {
      width: 64,
      height: 64,
      borderRadius: radius.md,
      // Shows while the image loads, and stays visible if the photo key is
      // unknown - so the row never looks broken.
      backgroundColor: colors.surface,
    },

    // flex:1 takes the remaining width; minWidth:0 allows it to shrink, so a
    // long name truncates instead of shoving the layout sideways.
    info: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },

    name: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },

    subtitle: {
      fontSize: 11,
      color: colors.textMuted,
    },

    // Badge + author on one line. The badge sizes itself to its own text, the
    // author name takes whatever is left over.
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 2,
      flexWrap: 'wrap', // if both are long, the name drops to its own line
    },

    // flexShrink:1 + numberOfLines:1 = a long author name is truncated rather
    // than pushing the status badge out of view.
    author: {
      fontSize: 11,
      color: colors.textMuted,
      flexShrink: 1,
      minWidth: 0,
    },

    actions: {
      alignItems: 'center', // keeps the round trash button centred on the row
    },

    // Every text button in the row shares the width equally.
    action: { flex: 1 },
  });
