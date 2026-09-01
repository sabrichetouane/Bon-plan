// ============================================================
// AdminUsersScreen.js - THE ADMIN "USER ACCOUNTS" SCREEN
// Lists every account registered in the app so an administrator
// can search them, promote someone to admin, demote an admin
// back to a normal user, or delete an account completely.
// Two safety rules are enforced here: you can never act on your
// OWN row, and the database refuses to remove the last admin.
// ============================================================

// ------------------------------------------------------------------
// IMPORTS
// In React Native every screen is just a JavaScript function that
// returns a description of what to draw. Everything it needs -
// components, hooks, database helpers - has to be imported first.
// ------------------------------------------------------------------

// React itself, plus the three "hooks" this screen uses.
// A hook is a function starting with "use" that lets a plain function
// component remember things and react to events.
//   useState    -> remember a value between redraws (and redraw when it changes)
//   useCallback -> remember a FUNCTION so it is not rebuilt on every redraw
//   useMemo     -> remember a computed RESULT so we do not recompute it every redraw
import React, { useState, useCallback, useMemo } from 'react';

// The built-in building blocks of React Native.
//   View      = a box (like a <div>)
//   Text      = the ONLY thing allowed to display characters
//   FlatList  = a scrolling list that only renders the rows currently on screen
//   Alert     = the native "are you sure?" pop-up of iOS / Android
import { StyleSheet, View, Text, FlatList, Alert } from 'react-native';

// useFocusEffect runs code every time this screen becomes visible again.
// Unlike useEffect (which runs once when the screen is first created), this
// also fires when the user presses "back" from another screen, so the list
// is never stale.
import { useFocusEffect } from '@react-navigation/native';

// Shared design tokens. Using these constants instead of typing numbers
// like "24" by hand is what keeps every screen of the app looking identical.
import { useTheme, radius, spacing } from '../../theme/colors';

// Shared UI components - already written and used by the other screens.
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import SearchField from '../../components/SearchField';
import IconButton from '../../components/IconButton';
import { SecondaryButton } from '../../components/Buttons';
import { Loading, EmptyState } from '../../components/Feedback';

// The global store: who is logged in, and the translator function.
import { useStore, useT } from '../../store';

// The database layer. "* as userRepo" imports EVERY exported function of that
// file in one object, so we call them as userRepo.listUsers(), etc.
import * as userRepo from '../../db/userRepo';

// ------------------------------------------------------------------
// THE SCREEN COMPONENT
// React Navigation passes a `navigation` object to every screen it
// renders; we use it only to go back to the admin dashboard.
// ------------------------------------------------------------------
export default function AdminUsersScreen({ navigation }) {
  // The active palette (light or dark). It changes when the user flips the
  // theme switch in Profile, and this screen redraws itself automatically.
  const { colors } = useTheme();

  // makeStyles() is at the BOTTOM of this file. We must build the stylesheet
  // inside the component because the colours are only known at runtime.
  // useMemo caches the result and rebuilds it ONLY when `colors` changes -
  // without it we would create a brand-new StyleSheet on every keystroke.
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // t('some.key') turns a key into text in the user's language (EN / FR / AR).
  // We never hard-code an English string that a user can read.
  const t = useT();

  // The id of the person currently logged in. We need it to recognise the
  // admin's OWN row in the list and hide the dangerous buttons on it.
  const { userId } = useStore();

  // ----------------------------------------------------------------
  // STATE
  // useState returns a pair: [the current value, a function to change it].
  // Calling the setter is what tells React "redraw this screen".
  // Never modify these values directly (users.push(...) does nothing) -
  // always pass a NEW value to the setter, so React can see the difference.
  // ----------------------------------------------------------------

  // Every account read from SQLite. Starts as an empty array so that the
  // first render can already call .filter() and .map() on it without crashing.
  const [users, setUsers] = useState([]);

  // true while the database read is in flight -> we show a spinner.
  const [loading, setLoading] = useState(true);

  // What the admin typed in the search bar.
  const [query, setQuery] = useState('');

  // The id of the row whose button was just tapped, or null.
  // Writing to the database takes a moment; keeping this here lets us disable
  // that row's buttons so an impatient double-tap cannot fire the same
  // promotion (or deletion) twice.
  const [busyId, setBusyId] = useState(null);

  // ----------------------------------------------------------------
  // LOADING THE DATA
  // ----------------------------------------------------------------

  // `async` marks a function that does slow work; `await` pauses inside it
  // until the database answers, WITHOUT freezing the interface. The function
  // immediately returns a Promise, and the code after each await runs later.
  //
  // useCallback keeps the SAME function object between renders (its
  // dependency list is empty, so nothing can make it stale). That matters
  // because useFocusEffect below depends on it: a new function every render
  // would restart the effect endlessly.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userRepo.listUsers();
      setUsers(data);
    } catch (e) {
      // A crash inside a screen would show a red error page to the user.
      // Logging instead means the app survives and we still see the reason.
      console.warn('[AdminUsersScreen] load failed:', e);
    } finally {
      // `finally` runs whether the try succeeded or threw, so the spinner
      // can never get stuck on screen after a failure.
      setLoading(false);
    }
  }, []);

  // Re-read the list every time the screen comes back into view, so a role
  // changed elsewhere (or a user who signed up meanwhile) shows up here.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ----------------------------------------------------------------
  // SEARCH FILTERING
  // The filtering happens in plain JavaScript, not in SQL: the account list
  // of a student project is small, and doing it here means results update
  // instantly on every keystroke with no database round-trip.
  // ----------------------------------------------------------------
  const visibleUsers = useMemo(() => {
    // .trim() removes spaces at both ends. Without it, typing "ali " (the
    // space phones insert automatically after a word) would match nothing.
    // .toLowerCase() on BOTH sides is what makes the search case-insensitive.
    const needle = query.trim().toLowerCase();

    // Empty search box -> show everybody, no filtering work at all.
    if (!needle) return users;

    // .filter() builds a NEW array with only the rows that pass the test;
    // the original `users` array is left untouched, which is exactly what
    // React wants (state must never be edited in place).
    return users.filter((row) => {
      // `|| ''` guards against a null column: null.toLowerCase() would crash.
      const name = (row.name || '').toLowerCase();
      const email = (row.email || '').toLowerCase();
      // Matching name OR email means "ahmed" and "ahmed@" both find the row.
      return name.includes(needle) || email.includes(needle);
    });
  }, [users, query]); // recompute only when the data or the search text change

  // ----------------------------------------------------------------
  // ACTION 1 - PROMOTE OR DEMOTE
  // ----------------------------------------------------------------
  const toggleRole = useCallback(
    async (row) => {
      // A tiny state machine: an admin becomes a user, a user becomes an admin.
      const nextRole = row.role === 'admin' ? 'user' : 'admin';

      setBusyId(row.id); // grey this row's buttons out while we write
      try {
        const result = await userRepo.setUserRole({ userId: row.id, role: nextRole });

        // WHY THIS GUARD EXISTS:
        // The database refuses to demote the LAST remaining administrator.
        // If it allowed it, there would be nobody left who can approve places,
        // hide abusive comments or promote anyone else - the moderation side
        // of the app would be locked forever with no way back in.
        // In that case the repository returns { ok:false, error:'lastAdmin' }
        // and has changed NOTHING, so we simply explain and stop here.
        if (!result || !result.ok) {
          Alert.alert(
            t('common.error'),
            result && result.error === 'lastAdmin' ? t('error.lastAdmin') : t('common.error')
          );
          return; // returning early skips the reload - nothing changed
        }

        // Success: re-read the list so the pill and the button label update.
        await load();
      } catch (e) {
        console.warn('[AdminUsersScreen] setUserRole failed:', e);
        Alert.alert(t('common.error'), t('common.error'));
      } finally {
        setBusyId(null); // re-enable the buttons whatever happened
      }
    },
    [load, t] // rebuild this function only if the loader or the language changes
  );

  // ----------------------------------------------------------------
  // ACTION 2 - DELETE AN ACCOUNT (the actual database call)
  // ----------------------------------------------------------------
  const doDelete = useCallback(
    async (row) => {
      setBusyId(row.id);
      try {
        const result = await userRepo.deleteUser(row.id);

        // Same protection as above: deleting the last admin would leave the
        // app with no moderator at all, so the repository blocks it and
        // returns { ok:false, error:'lastAdmin' } without touching the data.
        if (!result || !result.ok) {
          Alert.alert(
            t('common.error'),
            result && result.error === 'lastAdmin' ? t('error.lastAdmin') : t('common.error')
          );
          return;
        }

        await load();
      } catch (e) {
        console.warn('[AdminUsersScreen] deleteUser failed:', e);
        Alert.alert(t('common.error'), t('common.error'));
      } finally {
        setBusyId(null);
      }
    },
    [load, t]
  );

  // Deleting is irreversible (the account's comments, plans and favourites go
  // with it), so we always ask first. Alert.alert takes a title, a message and
  // an array of buttons; `style: 'destructive'` paints the label red on iOS.
  const confirmDelete = useCallback(
    (row) => {
      Alert.alert(
        t('admin.deleteTitle'),
        // The message contains "%s"; .replace() drops the real name into it,
        // which keeps the sentence grammatical in every language.
        t('admin.deleteUserMsg').replace('%s', row.name || row.email || ''),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.delete'), style: 'destructive', onPress: () => doDelete(row) },
        ]
      );
    },
    [doDelete, t]
  );

  // ----------------------------------------------------------------
  // ONE ROW OF THE LIST
  // FlatList calls this for every visible item and hands us { item }.
  // Defining it with useCallback avoids rebuilding it on each render.
  // ----------------------------------------------------------------
  const renderUser = useCallback(
    ({ item }) => {
      // Is this row the logged-in administrator looking at themselves?
      // If so we hide both action buttons: demoting yourself would lock you
      // out of the admin area instantly, and deleting yourself would erase
      // the account you are signed in with.
      const isMe = item.id === userId;

      const isAdminRow = item.role === 'admin';

      // Disable the buttons of the row that is currently being saved.
      const isBusy = busyId === item.id;

      // The avatar shows a single big letter instead of a photo (accounts have
      // no picture in this app). charAt(0) is safe on an empty string - it
      // returns '' rather than crashing - and '?' covers a nameless account.
      const initial = (item.name || item.email || '?').trim().charAt(0).toUpperCase();

      return (
        <View style={styles.card}>
          {/* --- TOP: avatar, identity, role pill --- */}
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>

            {/* flex:1 lets this column take the leftover width, and
                minWidth:0 is the part people forget: without it a very long
                email refuses to shrink and pushes the role pill off screen. */}
            <View style={styles.identity}>
              {/* numberOfLines={1} truncates with "..." instead of wrapping,
                  so every card keeps the same height in the list. */}
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {item.email}
              </Text>
            </View>

            {/* The role pill. It must stay fully readable, so flexShrink:0
                (set in the stylesheet) stops flexbox from squashing it. */}
            <View style={[styles.rolePill, isAdminRow ? styles.rolePillAdmin : styles.rolePillUser]}>
              <Text
                style={[styles.roleText, isAdminRow ? styles.roleTextAdmin : styles.roleTextUser]}
                numberOfLines={1}
              >
                {isAdminRow ? t('admin.roleAdmin') : t('admin.roleUser')}
              </Text>
            </View>
          </View>

          {/* --- BOTTOM: the actions, or the "(you)" note --- */}
          {isMe ? (
            // Your own row: no buttons at all, just a quiet reminder of why.
            <Text style={styles.selfLabel}>({t('comment.you')})</Text>
          ) : (
            <View style={styles.actions}>
              {/* full={false} + flex:1 makes the button fill the row's free
                  width while leaving room for the delete circle beside it. */}
              <SecondaryButton
                title={isAdminRow ? t('admin.removeAdmin') : t('admin.makeAdmin')}
                icon={isAdminRow ? 'person-outline' : 'shield-checkmark-outline'}
                onPress={() => toggleRole(item)}
                disabled={isBusy}
                full={false}
                style={styles.actionButton}
              />

              {/* IconButton is used rather than a bare TouchableOpacity because
                  it already gives the icon an invisible 44pt tap area, the
                  minimum size a finger can hit reliably. */}
              <IconButton
                name="trash-outline"
                size={20}
                color={colors.danger}
                diameter={38}
                onPress={() => confirmDelete(item)}
                disabled={isBusy}
                accessibilityLabel={t('common.delete')}
              />
            </View>
          )}
        </View>
      );
    },
    [styles, colors, t, userId, busyId, toggleRole, confirmDelete]
  );

  // ----------------------------------------------------------------
  // WHAT GETS DRAWN
  // ----------------------------------------------------------------
  return (
    // This screen is PUSHED on top of the stack (it is not a tab), so nothing
    // else protects its bottom edge from the home indicator - we add 'bottom'
    // to the safe-area edges ourselves.
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={t('admin.users')} onBack={() => navigation.goBack()} />

      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder={t('common.search')}
        // Passing onClear makes the little X appear once there is text.
        onClear={() => setQuery('')}
        style={{ marginHorizontal: spacing.xl }}
      />

      {/* Ternary in JSX: spinner while the first read is running, real list
          afterwards. `cond ? a : b` is used because JSX cannot hold an if. */}
      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={visibleUsers}
          // keyExtractor gives React a stable identity per row. With it, React
          // can move an existing row instead of throwing it away and building
          // a new one - faster, and it keeps scroll position sane.
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUser}
          // Padding belongs on the CONTENT container, not on the list itself:
          // put it on the list and the rows would be clipped while scrolling.
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          // Shown in place of the rows when `data` is empty - either the app
          // has no accounts, or the search matched nothing.
          ListEmptyComponent={
            <EmptyState icon="people-outline" title={t('list.empty')} />
          }
        />
      )}
    </Screen>
  );
}

// ============================================================
// STYLES
// A factory function, NOT a module-level StyleSheet.create: the colours are
// only known once the component is running and the user's theme is read, so
// the sheet has to be built inside the component (see useMemo above).
// ============================================================
const makeStyles = (colors) =>
  StyleSheet.create({
    // spacing.xl (24) is the standard screen edge padding of the whole app.
    // The extra bottom padding lets the last card scroll clear of the edge.
    listContent: {
      padding: spacing.xl,
      gap: 12,
      paddingBottom: spacing.xxl,
      // Lets the EmptyState centre itself in the leftover space when the list
      // has no rows, instead of hugging the top - same as the other admin lists.
      flexGrow: 1,
    },

    // The standard flat card of this app: card background, hairline border,
    // large radius, and deliberately NO shadow.
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.md,
    },

    identityRow: {
      flexDirection: 'row',  // avatar | identity | pill, side by side
      alignItems: 'center',
      gap: spacing.md,
    },

    // A perfect circle needs borderRadius = half the width.
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,         // never let flexbox squash the circle into an egg
    },
    avatarLetter: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.primary,
    },

    // flex:1 = take the leftover width. minWidth:0 = and you are allowed to
    // become narrower than your text, which is what lets numberOfLines
    // truncate a long email instead of overflowing the card.
    identity: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    name: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    email: {
      fontSize: 12,
      color: colors.textMuted,
    },

    // The role pill on the right.
    rolePill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      flexShrink: 0,         // this label must stay readable at any width
    },
    rolePillAdmin: { backgroundColor: colors.primary },
    rolePillUser: { backgroundColor: colors.chipIdle },
    roleText: { fontSize: 11, fontWeight: '700' },
    // White on the solid blue pill; muted grey on the idle one.
    roleTextAdmin: { color: '#fff' },
    roleTextUser: { color: colors.textSecondary },

    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    // The role button takes all the width the delete circle does not need.
    actionButton: { flex: 1, minWidth: 0 },

    selfLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
  });
