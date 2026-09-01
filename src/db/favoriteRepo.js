// ============================================================================
// db/favoriteRepo.js - THE HEART BUTTON
//
// Before, favorites were a JavaScript Set living in memory. Closing the app
// erased them. Now every heart tap writes a row, so they come back.
//
// The favorites table has no id column - its key is the PAIR
// (user_id, place_id). That single design choice means the database itself
// refuses a duplicate, so "have I already favorited this?" never needs code.
// ============================================================================

import { getDb, nowIso } from './database';

// ---------------------------------------------------------------------------
// getFavoriteIds(userId) - every place id this user has hearted.
//
// Returns a Set, not an array. A Set answers "does it contain X?" instantly,
// no matter how many items it holds, while an array has to scan. Screens ask
// that question once per card while scrolling, so it matters.
//
// This also keeps the shape the old code already used (`favorites.has(id)`),
// so the screens need barely any change.
// ---------------------------------------------------------------------------
export async function getFavoriteIds(userId) {
  // Nobody logged in -> nobody has favorites. Return an empty Set so the
  // calling screen can use it normally instead of checking for null.
  if (!userId) return new Set();

  const db = await getDb();
  const rows = await db.getAllAsync('SELECT place_id FROM favorites WHERE user_id = ?', [userId]);

  // rows looks like [{place_id:'f1'}, {place_id:'n2'}].
  // .map pulls out just the ids, and new Set(...) turns that list into a Set.
  return new Set(rows.map((row) => row.place_id));
}

// ---------------------------------------------------------------------------
// isFavorite(userId, placeId) - check a single place.
// Used when you only care about one place (the detail screen).
// ---------------------------------------------------------------------------
export async function isFavorite(userId, placeId) {
  if (!userId) return false;

  const db = await getDb();
  // "SELECT 1" - we do not need any actual column, only to know whether a row
  // exists. Asking for the literal 1 is the cheapest way to find out.
  const row = await db.getFirstAsync(
    'SELECT 1 FROM favorites WHERE user_id = ? AND place_id = ?',
    [userId, placeId]
  );
  return Boolean(row);          // a row -> true, null -> false
}

// ---------------------------------------------------------------------------
// toggleFavorite(userId, placeId) - add it if missing, remove it if present.
//
// Returns the NEW state (true = now favorited) so the screen can update its
// heart icon without asking the database a second time.
// ---------------------------------------------------------------------------
export async function toggleFavorite(userId, placeId) {
  if (!userId) return false;     // not logged in: nothing to save

  const db = await getDb();
  const already = await isFavorite(userId, placeId);

  if (already) {
    await db.runAsync('DELETE FROM favorites WHERE user_id = ? AND place_id = ?', [
      userId,
      placeId,
    ]);
    return false;                // it is no longer a favorite
  }

  // INSERT OR IGNORE, not plain INSERT: if two fast taps both got past the
  // check above, the second would violate the primary key and throw. This way
  // it is quietly ignored instead of crashing the screen.
  await db.runAsync(
    'INSERT OR IGNORE INTO favorites (user_id, place_id, created_at) VALUES (?, ?, ?)',
    [userId, placeId, nowIso()]
  );
  return true;                   // it is a favorite now
}

// ---------------------------------------------------------------------------
// countFavorites(userId) - the number shown on the Profile screen.
//
// COUNT(*) asks SQLite to do the counting and send back one number, instead of
// sending every row over just so JavaScript can measure the list.
// ---------------------------------------------------------------------------
export async function countFavorites(userId) {
  if (!userId) return 0;

  const db = await getDb();
  const row = await db.getFirstAsync(
    'SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?',
    [userId]
  );
  return row?.total ?? 0;
}

// ---------------------------------------------------------------------------
// clearFavorites(userId) - remove all of one user's favorites.
// Not wired to a button yet; useful for a future "reset my data" option.
// ---------------------------------------------------------------------------
export async function clearFavorites(userId) {
  if (!userId) return;
  const db = await getDb();
  await db.runAsync('DELETE FROM favorites WHERE user_id = ?', [userId]);
}
