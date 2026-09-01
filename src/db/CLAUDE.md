# src/db/ — The Database Layer

SQLite via `expo-sqlite`, living in one file on the phone. No server, no
internet. This folder replaced `mockData.js` as the app's source of truth —
that file is now only the seed.

## Files

| File | Purpose |
| --- | --- |
| [schema.js](schema.js) | The `CREATE TABLE` text, as one SQL string. 10 tables. |
| [database.js](database.js) | Opens the file once, creates the tables, triggers seeding. `getDb()` is the only entry point. |
| [seed.js](seed.js) | Copies the 28 starter places out of `mockData.js` on first launch. Runs once, guarded by a flag in `meta`. |
| [password.js](password.js) | Salted SHA-256 hashing via `expo-crypto`. |
| [userRepo.js](userRepo.js) | Sign-up, login, session, password reset, preferences, admin user management. |
| [placeRepo.js](placeRepo.js) | Reading/filtering/searching places, user submissions, moderation. |
| [favoriteRepo.js](favoriteRepo.js) | The heart button. |
| [commentRepo.js](commentRepo.js) | Reviews, plus recalculating a place's average rating. |
| [planRepo.js](planRepo.js) | Day plans, their activities, reordering, duration maths. |

## The rule

**Screens never write SQL.** They call a repository function. If SQLite is ever
swapped for a real API, only this folder changes.

```js
import * as placeRepo from '../db/placeRepo';
const rows = await placeRepo.listPlaces({ categoryId: 'food', search: query });
```

## Tables

Follows [docs/1-mcd.puml](../../docs/1-mcd.puml).

```
users ──┬─< session          (at most one row: who is logged in)
        ├─< favorites >── places
        ├─< comments  >── places
        └─< plans ──< plan_items >── places (SET NULL)

places ──< place_photos
places >── categories
meta                          (key/value: "have we seeded yet?")
```

**Ids:** `users`, `comments`, `plans`, `plan_items`, `place_photos` use
`INTEGER PRIMARY KEY AUTOINCREMENT`. `places` and `categories` use TEXT ids
(`'f1'`, `'food'`) so the seed data carries over. User-submitted places get
`u-<timestamp>-<random>`.

**`favorites` has no id column** — its key is the pair `(user_id, place_id)`,
so the database itself blocks a duplicate.

## Moderation

`places.status` and `plans.status` are `'approved' | 'pending' | 'hidden'`;
`comments.status` is `'approved' | 'hidden'` only.

- Ordinary screens always filter `status = 'approved'`.
- A user's submission is saved as `pending`; an admin's as `approved`. That
  decision lives in `placeRepo.createPlace`, **not in the screen**.
- Hiding, rather than deleting, keeps the evidence.

## Things that will bite you

**`PRAGMA foreign_keys = ON` is required.** SQLite ignores foreign keys by
default. It is set at the top of `schema.js`; without it the `ON DELETE`
rules silently do nothing.

**Booleans are 0 and 1.** SQLite has no boolean type. `is_public === 1`, not
`isPublic === true`.

**Dates are ISO text.** `'2026-09-01T14:32:05.123Z'`. ISO sorts the same way
as real time, so `ORDER BY created_at DESC` gives newest-first. Day keys are
`'YYYY-MM-DD'`. Use `nowIso()` and `todayDate()` from `database.js`.

**Times are zero-padded text** (`'09:00'`), which is what makes
`ORDER BY time` correct.

**Images are TEXT keys, not `require()` calls.** `require()` returns a number
Metro assigns at build time and it cannot be stored or rebuilt. The column
holds `'real/oldport-1'`; [../data/assetRegistry.js](../data/assetRegistry.js)
turns it back into an image with `resolveImage()`. Two files in `assets/home/`
are **not** in the registry and must not be added:
`images.jfif` (Metro cannot bundle `.jfif`) and `real/centrebizerte-1.jpg`
(an HTML error page saved with a `.jpg` extension — its magic bytes are `<!D`).

**Every repo function is `async`.** Always `await`.

**Two levels of validation.** Screens validate for a friendly message; the
repository validates again because a screen must never be the only guard.
Repos return `{ ok: true, ... }` or `{ ok: false, error: 'codeName' }` — a
CODE, not a sentence, so the screen can translate it via `t('error.' + code)`.

## Changing the schema

Bump `SCHEMA_VERSION` in `schema.js` and add an upgrade step in
`openAndPrepare()` in `database.js`, which already reads `PRAGMA user_version`.
Don't just edit a `CREATE TABLE` — phones that already have data won't re-run it.

During development, `resetDatabase()` in `database.js` drops everything.

## Testing the SQL

The schema and every repository query are covered by a test that runs against
Node 22's built-in SQLite (same engine, same dialect):

```bash
node <path-to>/dbtest.js     # 20 checks: constraints, cascades, queries
```

It verifies the CHECK constraints reject bad values, that deleting a place
cascades to its photos but leaves plan rows intact with `place_id` set to
NULL, and that a hidden review stops counting toward a place's average.

## The seeded admin

`admin@bonplan.tn` / `admin123`, created by `seed.js`. Fine for a local demo
database; a real product would force a change on first login.
