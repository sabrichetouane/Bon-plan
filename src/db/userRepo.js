// ============================================================================
// db/userRepo.js - EVERYTHING ABOUT ACCOUNTS
//
// "Repo" is short for repository: a file that holds all the database queries
// for ONE subject. Keeping them here means screens never write SQL themselves -
// they just call signUp(), logIn(), and so on. If we ever swap SQLite for a
// real server, only this file changes and no screen notices.
//
// What lives here:
//   signUp / logIn / logOut          creating and using accounts
//   getCurrentUser / restoreSession  staying logged in after closing the app
//   resetPassword / changePassword   the "forgot password" flow
//   savePreferences                  remembering theme, language and city
//   admin helpers                    listing users, changing roles
// ============================================================================

import { getDb, nowIso } from './database';
import { hashPassword, verifyPassword } from './password';

// ---------------------------------------------------------------------------
// normaliseEmail(email) - clean up what the user typed.
//
// People type " Sabri@Mail.COM ". Without this, that would be treated as a
// different account from "sabri@mail.com" and they could never log back in.
//   .trim()       removes spaces at the start and end
//   .toLowerCase() makes the capitals irrelevant
// ---------------------------------------------------------------------------
function normaliseEmail(email) {
  return (email || '').trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// isValidEmail(email) - a light sanity check, not a guarantee.
// The pattern reads: some characters, an @, some characters, a dot, some more.
// ---------------------------------------------------------------------------
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normaliseEmail(email));
}

// ---------------------------------------------------------------------------
// PUBLIC_USER_COLUMNS - the columns we are willing to hand to the UI.
//
// Notice password_hash and password_salt are NOT in this list. Screens must
// never receive them, so we simply never select them. Writing the list once
// here means we cannot forget on some query later.
// ---------------------------------------------------------------------------
const PUBLIC_USER_COLUMNS =
  'id, name, email, role, language, theme_mode AS themeMode, city, created_at AS createdAt';
// "AS themeMode" renames the column on the way out, so JavaScript code can
// write user.themeMode (the JS style) while SQL keeps theme_mode (the SQL style).

// ===========================================================================
// SIGN UP
// ===========================================================================

// signUp({ name, email, password }) - create a new account and log into it.
//
// Returns { ok: true, user } when it works, or { ok: false, error: 'code' }
// when it does not. We return an error CODE rather than a sentence so the
// screen can translate it into English, French or Arabic itself.
export async function signUp({ name, email, password }) {
  const db = await getDb();

  const cleanName = (name || '').trim();
  const cleanEmail = normaliseEmail(email);

  // --- Validation. Check everything BEFORE touching the database. ---
  if (cleanName.length < 2) return { ok: false, error: 'nameTooShort' };
  if (!isValidEmail(cleanEmail)) return { ok: false, error: 'emailInvalid' };
  if (!password || password.length < 6) return { ok: false, error: 'passwordTooShort' };

  // Is this email already taken? We ask before inserting so we can give a
  // friendly message instead of letting the UNIQUE constraint throw.
  const existing = await db.getFirstAsync('SELECT id FROM users WHERE email = ?', [cleanEmail]);
  if (existing) return { ok: false, error: 'emailTaken' };

  // Scramble the password (see password.js).
  const { hash, salt } = await hashPassword(password);

  // Insert the row. runAsync is for statements that CHANGE data.
  const result = await db.runAsync(
    `INSERT INTO users (name, email, password_hash, password_salt, role, language, theme_mode, city, created_at)
     VALUES (?, ?, ?, ?, 'user', 'en', 'light', 'Bizerte', ?)`,
    [cleanName, cleanEmail, hash, salt, nowIso()]
  );

  // runAsync hands back lastInsertRowId - the id SQLite just generated for us.
  const userId = result.lastInsertRowId;

  // Sign-up logs you straight in, which is what people expect.
  await writeSession(db, userId);

  return { ok: true, user: await findUserById(userId) };
}

// ===========================================================================
// LOG IN / LOG OUT
// ===========================================================================

// logIn({ email, password }) - check the credentials and start a session.
export async function logIn({ email, password }) {
  const db = await getDb();
  const cleanEmail = normaliseEmail(email);

  // Fetch the row INCLUDING the secret columns - this is the one place we need them.
  const row = await db.getFirstAsync(
    'SELECT id, password_hash, password_salt FROM users WHERE email = ?',
    [cleanEmail]
  );

  // No such email. We deliberately return the SAME error as a wrong password
  // below, so an attacker cannot use the message to discover which emails are
  // registered. (This is called avoiding "user enumeration".)
  if (!row) return { ok: false, error: 'badCredentials' };

  const passwordMatches = await verifyPassword(password, row.password_hash, row.password_salt);
  if (!passwordMatches) return { ok: false, error: 'badCredentials' };

  await writeSession(db, row.id);
  return { ok: true, user: await findUserById(row.id) };
}

// logOut() - forget who was logged in. The account itself is untouched.
export async function logOut() {
  const db = await getDb();
  // The session table holds at most one row, so deleting them all = logging out.
  await db.runAsync('DELETE FROM session');
}

// writeSession(db, userId) - remember the logged-in user on this phone.
// Private helper: signUp, logIn and resetPassword all need it.
async function writeSession(db, userId) {
  // INSERT OR REPLACE with the fixed id 1 means "write row 1, overwriting
  // whatever was there". That is how we swap one logged-in user for another
  // without needing a separate DELETE.
  await db.runAsync('INSERT OR REPLACE INTO session (id, user_id) VALUES (1, ?)', [userId]);
}

// ---------------------------------------------------------------------------
// restoreSession() - called once when the app starts.
//
// This is what makes the app remember you after you close it. We look in the
// session table; if a row is there, we load that user and treat them as
// logged in. Returns the user, or null if nobody is logged in.
// ---------------------------------------------------------------------------
export async function restoreSession() {
  const db = await getDb();

  // A JOIN reads two tables at once and matches rows between them. Here:
  // "take the session row, find the users row whose id matches, give me that
  // user's public columns". One query instead of two.
  //
  // `s` and `u` are nicknames for the tables so we can write u.name instead of
  // users.name. Every column is prefixed because both tables have an `id`.
  const user = await db.getFirstAsync(
    `SELECT u.id, u.name, u.email, u.role,
            u.language, u.theme_mode AS themeMode, u.city, u.created_at AS createdAt
     FROM session s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = 1`
  );

  // getFirstAsync gives null when there is no row - i.e. nobody is logged in.
  return user || null;
}

// ===========================================================================
// READING USERS
// ===========================================================================

// findUserById(id) - load one user's public details.
export async function findUserById(id) {
  const db = await getDb();
  return db.getFirstAsync(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ?`, [id]);
}

// findUserByEmail(email) - used by the "forgot password" screen to check that
// the address actually belongs to an account before offering a reset.
export async function findUserByEmail(email) {
  const db = await getDb();
  return db.getFirstAsync(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE email = ?`, [
    normaliseEmail(email),
  ]);
}

// ===========================================================================
// PASSWORDS
// ===========================================================================

// resetPassword({ email, newPassword }) - the end of the "forgot password" flow.
//
// HOW A REAL APP DOES IT: it emails you a one-time link, and only that link
// lets you set a new password. That needs a mail server, which this offline
// app does not have. So we verify the email exists and let the person set a
// new password directly on the device. The flow and the screens are the same;
// only the "prove it is really you" step is simplified.
export async function resetPassword({ email, newPassword }) {
  const db = await getDb();
  const cleanEmail = normaliseEmail(email);

  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: 'passwordTooShort' };
  }

  const row = await db.getFirstAsync('SELECT id FROM users WHERE email = ?', [cleanEmail]);
  if (!row) return { ok: false, error: 'emailNotFound' };

  // Make a brand-new salt as well as a new hash. Reusing the old salt would
  // be a small but pointless weakness.
  const { hash, salt } = await hashPassword(newPassword);

  await db.runAsync('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?', [
    hash,
    salt,
    row.id,
  ]);

  return { ok: true };
}

// changePassword({ userId, currentPassword, newPassword }) - for a user who
// is already logged in and knows their old password (from Edit profile).
export async function changePassword({ userId, currentPassword, newPassword }) {
  const db = await getDb();

  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: 'passwordTooShort' };
  }

  const row = await db.getFirstAsync(
    'SELECT password_hash, password_salt FROM users WHERE id = ?',
    [userId]
  );
  if (!row) return { ok: false, error: 'userNotFound' };

  // Confirm the old password first - otherwise anyone borrowing an unlocked
  // phone could change it.
  const ok = await verifyPassword(currentPassword, row.password_hash, row.password_salt);
  if (!ok) return { ok: false, error: 'wrongPassword' };

  const { hash, salt } = await hashPassword(newPassword);
  await db.runAsync('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?', [
    hash,
    salt,
    userId,
  ]);

  return { ok: true };
}

// ===========================================================================
// PROFILE AND PREFERENCES
// ===========================================================================

// updateProfile({ userId, name, email }) - the Edit profile screen.
export async function updateProfile({ userId, name, email }) {
  const db = await getDb();

  const cleanName = (name || '').trim();
  const cleanEmail = normaliseEmail(email);

  if (cleanName.length < 2) return { ok: false, error: 'nameTooShort' };
  if (!isValidEmail(cleanEmail)) return { ok: false, error: 'emailInvalid' };

  // Make sure the new email is not already used by SOMEBODY ELSE.
  // "id != ?" excludes this user, otherwise keeping your own email would fail.
  const clash = await db.getFirstAsync('SELECT id FROM users WHERE email = ? AND id != ?', [
    cleanEmail,
    userId,
  ]);
  if (clash) return { ok: false, error: 'emailTaken' };

  await db.runAsync('UPDATE users SET name = ?, email = ? WHERE id = ?', [
    cleanName,
    cleanEmail,
    userId,
  ]);

  return { ok: true, user: await findUserById(userId) };
}

// savePreferences({ userId, language, themeMode, city }) - persist settings.
//
// This is what finally makes dark mode and the language choice survive closing
// the app. Every value is optional: pass only what changed.
export async function savePreferences({ userId, language, themeMode, city }) {
  const db = await getDb();

  // Build the update piece by piece, so we only touch the columns given to us.
  const sets = [];      // e.g. ['language = ?', 'theme_mode = ?']
  const values = [];    // the matching values, in the same order

  if (language) {
    sets.push('language = ?');
    values.push(language);
  }
  if (themeMode) {
    sets.push('theme_mode = ?');
    values.push(themeMode);
  }
  if (city) {
    sets.push('city = ?');
    values.push(city);
  }

  // Nothing to change - leave without running a pointless query.
  if (sets.length === 0) return;

  // The user id goes last, because it is the last ? in the finished statement.
  values.push(userId);

  await db.runAsync(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
}

// ===========================================================================
// ADMIN-ONLY HELPERS
// ===========================================================================

// listUsers() - every account, newest first. Used by the admin screen.
export async function listUsers() {
  const db = await getDb();
  // getAllAsync returns an ARRAY of rows (getFirstAsync returns just one).
  return db.getAllAsync(`SELECT ${PUBLIC_USER_COLUMNS} FROM users ORDER BY created_at DESC`);
}

// setUserRole({ userId, role }) - promote a user to admin, or demote them.
export async function setUserRole({ userId, role }) {
  const db = await getDb();
  if (role !== 'user' && role !== 'admin') return { ok: false, error: 'badRole' };

  // Guard: never remove the LAST admin, or nobody could moderate the app again.
  if (role === 'user') {
    const { count } = await db.getFirstAsync(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"
    );
    const target = await db.getFirstAsync('SELECT role FROM users WHERE id = ?', [userId]);
    if (count <= 1 && target?.role === 'admin') {
      return { ok: false, error: 'lastAdmin' };
    }
  }

  await db.runAsync('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
  return { ok: true };
}

// deleteUser(userId) - remove an account completely.
//
// Thanks to "ON DELETE CASCADE" in schema.js, SQLite automatically deletes
// that person's favorites, comments and plans too. We do not have to.
export async function deleteUser(userId) {
  const db = await getDb();

  // Same guard as above: refuse to delete the last remaining admin.
  const target = await db.getFirstAsync('SELECT role FROM users WHERE id = ?', [userId]);
  if (target?.role === 'admin') {
    const { count } = await db.getFirstAsync(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"
    );
    if (count <= 1) return { ok: false, error: 'lastAdmin' };
  }

  await db.runAsync('DELETE FROM users WHERE id = ?', [userId]);
  return { ok: true };
}
