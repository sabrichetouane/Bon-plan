// ============================================================================
// db/database.js - OPENING AND PREPARING THE DATABASE
//
// This file has one job: hand the rest of the app a ready-to-use database.
// "Ready" means: the file is open, the tables exist, and the starter places
// have been loaded. Every other db/*.js file calls getDb() from here.
//
// A NOTE ON async / await, because it is everywhere below:
// Talking to a database takes time (milliseconds, but not zero). JavaScript
// refuses to freeze the screen while waiting, so these functions return a
// "Promise" - a receipt that says "the answer is coming".
//   await something()   means "pause HERE until the answer arrives, then continue".
//   async function      is the label you must put on any function that uses await.
// ============================================================================

import * as SQLite from 'expo-sqlite';        // the SQLite library from Expo
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema';  // our CREATE TABLE text
import { seedIfEmpty } from './seed';         // loads the 30 starter places

// The name of the file SQLite creates on the phone. You never see it; Expo
// puts it in the app's private folder. Changing this name = starting fresh.
const DATABASE_NAME = 'bonplan.db';

// We keep ONE open connection and reuse it for the whole app run.
// Opening a database is slow, so doing it once and remembering it matters.
// `null` means "not opened yet".
let dbInstance = null;

// While the very first open is still running, we remember its Promise here.
// WHY: two screens can call getDb() at the same moment on startup. Without
// this, both would start their own open + seed and we would insert the
// starter data twice. Sharing one Promise means the second caller simply
// waits for the first one to finish.
let openingPromise = null;

// ---------------------------------------------------------------------------
// getDb() - the ONLY way the rest of the app gets the database.
// Call it as:   const db = await getDb();
// ---------------------------------------------------------------------------
export async function getDb() {
  // Already open from an earlier call? Hand back the same connection.
  if (dbInstance) return dbInstance;

  // Someone else is already opening it? Wait for their work instead of repeating it.
  if (openingPromise) return openingPromise;

  // Nobody has opened it yet, so this call does the work.
  // We store the Promise FIRST (before awaiting) so a caller arriving one
  // millisecond later sees it and waits, rather than starting a second open.
  openingPromise = openAndPrepare();

  try {
    dbInstance = await openingPromise;   // wait for our own work to finish
    return dbInstance;
  } finally {
    // Clear the "in progress" marker whether it worked or failed, so a failed
    // startup can be retried instead of being stuck forever.
    openingPromise = null;
  }
}

// ---------------------------------------------------------------------------
// openAndPrepare() - the actual startup steps, in order.
// Private to this file (not exported) - outside code should use getDb().
// ---------------------------------------------------------------------------
async function openAndPrepare() {
  // STEP 1 - open (or create, the first time) the database file.
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // STEP 2 - create every table. execAsync runs a whole batch of SQL at once.
  // Remember: every CREATE uses "IF NOT EXISTS", so this is safe every launch.
  await db.execAsync(SCHEMA_SQL);

  // STEP 3 - record which schema version this phone is on.
  // user_version is a number SQLite stores inside the database file for us.
  // Today we only read it; when you later change the tables, you compare it
  // and run the missing upgrade steps here.
  const row = await db.getFirstAsync('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion < SCHEMA_VERSION) {
    // (Future migrations would go here, e.g. `if (currentVersion < 2) ...`)
    // PRAGMA cannot take a "?" placeholder, so we build the string. This is
    // safe only because SCHEMA_VERSION is our own number, never user input.
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }

  // STEP 4 - put the starter content in, but only the very first time.
  // seedIfEmpty checks the `meta` table and does nothing on later launches.
  await seedIfEmpty(db);

  // Hand the finished, ready database back to getDb().
  return db;
}

// ---------------------------------------------------------------------------
// resetDatabase() - wipe everything and start over.
//
// Useful while developing ("my test data is a mess") and for a future
// "Delete my account and data" button. NOT called anywhere by default.
// ---------------------------------------------------------------------------
export async function resetDatabase() {
  const db = await getDb();

  // Delete the tables in child-before-parent order. If we dropped `users`
  // first, the rows in `favorites` pointing at it would break.
  await db.execAsync(`
    DROP TABLE IF EXISTS plan_items;
    DROP TABLE IF EXISTS plans;
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS favorites;
    DROP TABLE IF EXISTS place_photos;
    DROP TABLE IF EXISTS places;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS session;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS meta;
  `);

  // Forget the open connection so the next getDb() rebuilds everything.
  dbInstance = null;
}

// ---------------------------------------------------------------------------
// nowIso() - today's date and time as text, e.g. '2026-09-01T14:32:05.123Z'.
//
// WHY TEXT: SQLite has no real "date" type. Storing dates as ISO text is the
// standard trick, because ISO text sorts in the same order as real time -
// so "ORDER BY created_at DESC" correctly gives you the newest first.
// ---------------------------------------------------------------------------
export function nowIso() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// todayDate() - just the day part, e.g. '2026-09-01'.
// Used as the default date for a new plan.
// ---------------------------------------------------------------------------
export function todayDate() {
  return new Date().toISOString().slice(0, 10);   // cut 'YYYY-MM-DD' off the front
}
