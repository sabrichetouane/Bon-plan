// ============================================================================
// db/time.js - HOW THIS APP WRITES DATES
//
// Two tiny helpers, in their own file for one specific reason: to break a
// CIRCULAR IMPORT.
//
// WHAT A CIRCULAR IMPORT IS, and why it bit us:
// These functions used to live in database.js. But seed.js needs them, and
// database.js needs seed.js - so the two files imported each other:
//
//     database.js  ──imports seedIfEmpty──>  seed.js
//          ^                                    |
//          └──────────imports nowIso────────────┘
//
// JavaScript allows that, but it has to finish loading one file before the
// other, so whichever one loses the race briefly sees the other as EMPTY.
// Metro warns about exactly this:
//     "Require cycles are allowed, but can result in uninitialized values."
//
// Moving the shared helpers down here means nothing points back upwards, and
// the loop is gone:
//
//     database.js ──> seed.js ──> time.js
//          └────────────────────────^
// ============================================================================

// ---------------------------------------------------------------------------
// nowIso() - the current date and time as text, e.g. '2026-09-01T14:32:05.123Z'.
//
// WHY TEXT: SQLite has no real "date" type. Storing dates as ISO text is the
// standard trick, because ISO text sorts in the same order as real time - so
// "ORDER BY created_at DESC" correctly gives you the newest first.
// ---------------------------------------------------------------------------

// `export` publishes the function so other files can `import { nowIso }`.
// Without it the function would exist but stay private to this file.
export function nowIso() {
  // `new Date()` builds a Date object holding THIS instant, read from the
  // phone's clock. `.toISOString()` turns it into the standard text form
  // 'YYYY-MM-DDTHH:mm:ss.sssZ' - always in UTC, which is why it ends in 'Z'.
  // UTC matters: two users in different time zones still produce comparable
  // timestamps.
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// todayDate() - just the day part, e.g. '2026-09-01'.
// Used as the day key for a plan. .slice(0, 10) keeps the 'YYYY-MM-DD' front.
// ---------------------------------------------------------------------------
export function todayDate() {
  // Same full timestamp as above...
  // ...then `.slice(0, 10)` keeps only characters 0 to 9 - 'YYYY-MM-DD' -
  // and throws away the 'T14:32:05.123Z' tail. A plan belongs to a DAY, so
  // keeping the time would make two plans made on the same day look different.
  return new Date().toISOString().slice(0, 10);
}
