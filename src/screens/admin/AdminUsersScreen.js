// ============================================================================
// AdminUsersScreen.js - MANAGE ACCOUNTS (admin only)
//
// What an admin can do here:
//   - CREATE a new account, and choose whether it is a user or an admin
//   - promote a user to admin, or demote an admin back to user
//   - delete an account
//   - search the list by name or email
//
// TWO BUGS THIS SCREEN USED TO HAVE, both worth understanding:
//
// 1. THERE WAS NO WAY TO ADD ANYONE. The only function for making an account
//    was signUp(), which logs you IN as the new account - so an admin using it
//    would be thrown out of their own session. There is now a separate
//    userRepo.createUser() that does not touch the session.
//
// 2. THE SCREEN LOOKED COMPLETELY DEAD ON A FRESH INSTALL. It hid every button
//    on your own row, and on a new database the seeded admin is the ONLY
//    account - so you saw one row with nothing to press.
//    Now: you can still never DELETE yourself (that would be a trapdoor), but
//    you can demote yourself as long as another admin exists, and the reason is
//    written on screen instead of the buttons silently vanishing.
// ============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme, radius, spacing } from '../../theme/colors';
import { useStore, useT } from '../../store';
import * as userRepo from '../../db/userRepo';

import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import SearchField from '../../components/SearchField';
import FormField from '../../components/FormField';
import IconButton from '../../components/IconButton';
import Chip from '../../components/Chip';
import { PrimaryButton, SecondaryButton, ButtonRow } from '../../components/Buttons';
import { Loading, EmptyState } from '../../components/Feedback';

// useRTL() reports which way the language reads. Arabic runs right to left, so
// rows have to be mirrored and text right-aligned. Every helper it returns is
// null in English and French, so using them below is free in those languages.
// The shared components above already mirror themselves, so only this screen's
// OWN rows and texts are touched.
import { useRTL } from '../../theme/rtl';

export default function AdminUsersScreen({ navigation }) {
  const { colors } = useTheme();
  const t = useT();

  // The mirroring helpers used in the JSX below. They only do something when
  // the chosen language is Arabic.
  const rtl = useRTL();

  // `userId` is the admin currently logged in - we compare against it to find
  // their own row in the list.
  const { userId, isAdmin } = useStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [users, setUsers] = useState([]);
  const [adminCount, setAdminCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // --- The "create account" form. Closed until the + button is pressed. ------
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // -------------------------------------------------------------------------
  // load() - read the account list and how many admins exist.
  //
  // useCallback keeps this the same function between renders, so the
  // useFocusEffect below does not restart it endlessly.
  // -------------------------------------------------------------------------
  const load = useCallback(async () => {
    try {
      // Promise.all runs both reads at the same time instead of one after the other.
      const [rows, admins] = await Promise.all([userRepo.listUsers(), userRepo.countAdmins()]);
      setUsers(rows);
      setAdminCount(admins);
    } catch (e) {
      console.warn('[AdminUsersScreen] load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // useFocusEffect re-runs every time the screen comes back into view, so a
  // change made elsewhere shows up when you return.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // -------------------------------------------------------------------------
  // The visible list, after the search box.
  //
  // useMemo means the filtering only re-runs when the list or the text
  // changes, rather than on every unrelated re-render.
  // -------------------------------------------------------------------------
  const visible = useMemo(() => {
    // .trim() BEFORE .toLowerCase(), so typing "sabri " with a trailing space
    // still matches. Forgetting the trim is a classic silent search bug.
    const needle = query.trim().toLowerCase();
    if (!needle) return users;

    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle)
    );
  }, [users, query]);

  // =========================================================================
  // CREATE AN ACCOUNT
  // =========================================================================
  const handleCreate = async () => {
    setErrors({});
    setSaving(true);
    try {
      const result = await userRepo.createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });

      if (!result.ok) {
        // Put the message under the field that caused it.
        const field =
          result.error === 'nameTooShort'
            ? 'name'
            : result.error === 'passwordTooShort'
            ? 'password'
            : 'email';
        setErrors({ [field]: 'error.' + result.error });
        return;
      }

      // Empty the form and close it, then reload so the new account appears.
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      setCreating(false);
      load();
    } catch (e) {
      console.warn('[AdminUsersScreen] create failed:', e);
      setErrors({ email: 'common.error' });
    } finally {
      setSaving(false);
    }
  };

  // =========================================================================
  // CHANGE A ROLE
  // =========================================================================
  const handleToggleRole = async (row) => {
    // If they are an admin we are demoting them, otherwise promoting.
    const nextRole = row.role === 'admin' ? 'user' : 'admin';

    // Demoting yourself is a one-way door - once you are a plain user you
    // cannot open this screen again. So confirm it explicitly.
    if (row.id === userId && nextRole === 'user') {
      Alert.alert(t('admin.removeAdmin'), t('admin.demoteSelfMsg'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), style: 'destructive', onPress: () => applyRole(row, nextRole) },
      ]);
      return;
    }

    applyRole(row, nextRole);
  };

  const applyRole = async (row, nextRole) => {
    const result = await userRepo.setUserRole({ userId: row.id, role: nextRole });

    if (!result.ok) {
      // The database refuses to remove the last admin - otherwise nobody
      // could ever moderate the app again.
      Alert.alert(t('common.error'), t('error.' + result.error));
      return;
    }
    load();
  };

  // =========================================================================
  // DELETE AN ACCOUNT
  // =========================================================================
  const handleDelete = (row) => {
    Alert.alert(
      t('admin.deleteTitle'),
      t('admin.deleteUserMsg').replace('%s', row.name || row.email),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const result = await userRepo.deleteUser(row.id);
            if (!result.ok) {
              Alert.alert(t('common.error'), t('error.' + result.error));
              return;
            }
            load();
          },
        },
      ]
    );
  };

  // Anyone who is not an admin should never see this screen. The tab is hidden
  // for them, but checking here too means no route can sneak them in.
  if (!isAdmin) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader title={t('admin.users')} onBack={() => navigation.goBack()} />
        <EmptyState icon="lock-closed-outline" title={t('error.notAllowed')} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title={t('admin.users')}
        subtitle={`${users.length} · ${adminCount} ${t('admin.roleAdmin')}`}
        onBack={() => navigation.goBack()}
        // The + opens and closes the create form.
        rightIcon={creating ? 'close' : 'person-add'}
        onRightPress={() => setCreating(!creating)}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
      >
        {/* ---------- CREATE ACCOUNT FORM ---------- */}
        {creating && (
          <View style={styles.createBox}>
            {/* rtl.text right-aligns the heading in Arabic and is null in
                English, so nothing moves for an English user. */}
            <Text style={[styles.createTitle, rtl.text]}>{t('admin.newUser')}</Text>

            <FormField
              label={t('auth.name')}
              icon="person-outline"
              value={newName}
              onChangeText={setNewName}
              placeholder={t('auth.namePlaceholder')}
              error={errors.name && t(errors.name)}
            />

            <FormField
              label={t('auth.email')}
              icon="mail-outline"
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              error={errors.email && t(errors.email)}
            />

            <FormField
              label={t('auth.password')}
              icon="lock-closed-outline"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('auth.passwordPlaceholder')}
              secure
              error={errors.password && t(errors.password)}
            />

            {/* Role picker. The chip ids are the English values stored in the
                database; only the LABELS are translated. Storing the translated
                label would break the comparison in French. */}
            <Text style={[styles.fieldLabel, rtl.text]}>{t('admin.role')}</Text>
            {/* rtl.row starts the two chips from the right in Arabic. */}
            <View style={[styles.roleRow, rtl.row]}>
              <Chip
                label={t('admin.roleUser')}
                active={newRole === 'user'}
                onPress={() => setNewRole('user')}
              />
              <Chip
                label={t('admin.roleAdmin')}
                icon="shield-checkmark"
                active={newRole === 'admin'}
                onPress={() => setNewRole('admin')}
              />
            </View>

            <ButtonRow>
              <SecondaryButton
                title={t('common.cancel')}
                onPress={() => setCreating(false)}
                full={false}
                style={styles.flexOne}
              />
              <PrimaryButton
                title={t('admin.createUser')}
                onPress={handleCreate}
                loading={saving}
                disabled={!newName.trim() || !newEmail.trim() || !newPassword}
                full={false}
                style={styles.flexOne}
              />
            </ButtonRow>
          </View>
        )}

        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={t('common.search')}
          onClear={() => setQuery('')}
          style={styles.search}
        />

        {loading ? (
          <Loading />
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                title={t('list.empty')}
                subtitle={t('admin.nothingPendingSub')}
              />
            }
            renderItem={({ item }) => {
              const isMe = item.id === userId;
              const isAdminRow = item.role === 'admin';

              // You may demote yourself only if somebody else can still
              // moderate. You may never delete yourself.
              const canDemoteSelf = isMe && isAdminRow && adminCount > 1;
              const canChangeRole = !isMe || canDemoteSelf;

              return (
                <View style={styles.card}>
                  {/* rtl.row mirrors the head in Arabic: avatar on the right,
                      role badge on the left. It is null in English. */}
                  <View style={[styles.cardHead, rtl.row]}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {/* The first letter of the name, as a simple avatar.
                            The ?. chain stops a missing name from crashing. */}
                        {item.name?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>

                    {/* flex:1 + minWidth:0 lets a long email shrink instead of
                        pushing the role badge off the right edge. */}
                    <View style={styles.cardText}>
                      <View style={[styles.nameRow, rtl.row]}>
                        <Text style={[styles.name, rtl.text]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {isMe && <Text style={styles.youLabel}>({t('comment.you')})</Text>}
                      </View>
                      <Text style={[styles.email, rtl.text]} numberOfLines={1}>
                        {item.email}
                      </Text>
                    </View>

                    {/* flexShrink: 0 keeps the badge fully readable - the name
                        and email are the parts that give way. */}
                    <View style={[styles.roleBadge, isAdminRow && styles.roleBadgeAdmin]}>
                      <Text style={[styles.roleText, isAdminRow && styles.roleTextAdmin]}>
                        {isAdminRow ? t('admin.roleAdmin') : t('admin.roleUser')}
                      </Text>
                    </View>
                  </View>

                  {/* ---------- ACTIONS ---------- */}
                  {/* The wide button and the trash circle swap ends in Arabic. */}
                  <View style={[styles.actions, rtl.row]}>
                    <SecondaryButton
                      title={isAdminRow ? t('admin.removeAdmin') : t('admin.makeAdmin')}
                      icon={isAdminRow ? 'person-outline' : 'shield-checkmark-outline'}
                      onPress={() => handleToggleRole(item)}
                      disabled={!canChangeRole}
                      full={false}
                      style={styles.flexOne}
                    />

                    {/* Deleting yourself is never offered - it would lock you
                        out of your own account with no way back. */}
                    <IconButton
                      name="trash-outline"
                      size={19}
                      color={isMe ? colors.border : colors.danger}
                      onPress={() => handleDelete(item)}
                      disabled={isMe}
                      accessibilityLabel={t('common.delete')}
                    />
                  </View>

                  {/* Say WHY a button is greyed out, instead of leaving the
                      admin guessing. This is the part that made the screen
                      feel broken before. */}
                  {isMe && (
                    // Icon then sentence, so this row mirrors too. The 6pt gap
                    // comes from `gap`, not a margin, so it stays correct once
                    // the order is reversed.
                    <View style={[styles.hintRow, rtl.row]}>
                      <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
                      <Text style={[styles.hintText, rtl.text]}>
                        {canDemoteSelf ? t('admin.selfHint') : t('admin.selfLastAdminHint')}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    flexOne: { flex: 1 },

    createBox: {
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
    },
    createTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.lg,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    roleRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },

    search: { marginHorizontal: spacing.xl, marginBottom: spacing.sm },

    // flexGrow lets the empty state fill and centre in the leftover space.
    list: { padding: spacing.xl, paddingTop: spacing.sm, gap: 12, flexGrow: 1 },

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
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },

    cardText: { flex: 1, minWidth: 0 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { fontSize: 14, fontWeight: '700', color: colors.text, flexShrink: 1 },
    youLabel: { fontSize: 11, color: colors.textMuted, flexShrink: 0 },
    email: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

    roleBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.chipIdle,
      flexShrink: 0,
    },
    roleBadgeAdmin: { backgroundColor: colors.primary },
    roleText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
    roleTextAdmin: { color: '#fff' },

    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },

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
