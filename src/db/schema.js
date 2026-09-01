// ============================================================================
// db/schema.js - THE SHAPE OF OUR DATABASE
//
// WHAT IS SQLite?
// It is a complete SQL database that lives inside ONE file on the phone.
// There is no server to install and no internet needed. Perfect for this app:
// the user opens it, and their account / favorites / plans are already there.
//
// WHAT IS THIS FILE?
// Just text. One long string of SQL commands that CREATE the tables.
// We run it once when the app first starts (see database.js).
//
// "CREATE TABLE IF NOT EXISTS" means: make this table, but if it already
// exists do nothing. That is why running this on every app start is safe.
//
// The tables below follow the MCD in docs/1-mcd.puml, so the report and the
// code describe the same system.
// ============================================================================

export const SCHEMA_SQL = `
-- PRAGMA = a setting for the database engine itself.
-- foreign_keys = ON tells SQLite to actually enforce our relationships,
-- e.g. refuse a comment that points at a user who does not exist.
-- SQLite has this OFF by default, which surprises everyone once.
PRAGMA foreign_keys = ON;

-- journal_mode = WAL ("Write-Ahead Logging") lets one part of the app read
-- while another writes, instead of blocking. Makes the UI feel smoother.
PRAGMA journal_mode = WAL;


-- ===========================================================================
-- USERS  (= UTILISATEUR in the MCD)
-- One row per person who signs up.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS users (
  -- INTEGER PRIMARY KEY AUTOINCREMENT = SQLite fills this in for us,
  -- 1, 2, 3... so we never have to invent an id ourselves.
  id             INTEGER PRIMARY KEY AUTOINCREMENT,

  name           TEXT    NOT NULL,           -- display name, e.g. "Sabri"
  email          TEXT    NOT NULL UNIQUE,    -- UNIQUE = two accounts cannot share an email
  password_hash  TEXT    NOT NULL,           -- the scrambled password (never the real one)
  password_salt  TEXT    NOT NULL,           -- random text mixed in before scrambling

  -- role decides what the person is allowed to do.
  -- CHECK (...) makes SQLite reject any other value, so a typo like 'admln'
  -- fails immediately instead of silently creating a user with no permissions.
  role           TEXT    NOT NULL DEFAULT 'user'  CHECK (role IN ('user', 'admin')),

  -- Preferences live on the user, exactly like the MCD says (langue, mode_theme).
  -- This is how settings survive closing the app.
  language       TEXT    NOT NULL DEFAULT 'en'    CHECK (language IN ('en', 'fr', 'ar')),
  theme_mode     TEXT    NOT NULL DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark')),
  city           TEXT    NOT NULL DEFAULT 'Bizerte',

  created_at     TEXT    NOT NULL              -- when they signed up (ISO date text)
);


-- ===========================================================================
-- SESSION  - "who is currently logged in on this phone"
-- A tiny table with AT MOST ONE row. That is what the CHECK (id = 1) does:
-- it physically prevents a second row from ever being inserted.
-- Logging out = deleting the row. Logging in = writing it.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS session (
  id      INTEGER PRIMARY KEY CHECK (id = 1),
  user_id INTEGER NOT NULL,

  -- ON DELETE CASCADE: if the user row is deleted, this row disappears with it,
  -- so we can never be "logged in as" an account that no longer exists.
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ===========================================================================
-- CATEGORIES  (= CATEGORIE in the MCD)
-- Food, Coffee, Beach, Nature, Activity, Shopping.
-- These used to be a hardcoded array in mockData.js.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS categories (
  id         TEXT    PRIMARY KEY,   -- 'food', 'coffee', ... used in code and as t('cat.'+id)
  label      TEXT    NOT NULL,      -- English fallback label
  icon       TEXT    NOT NULL,      -- Ionicons name, e.g. 'restaurant'
  color      TEXT    NOT NULL,      -- hex color for map markers and plan rows
  sort_order INTEGER NOT NULL DEFAULT 0   -- controls the order on the Home screen
);


-- ===========================================================================
-- PLACES  (= LIEU in the MCD)
-- Every restaurant, cafe, beach, monument and shop in the app.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS places (
  id            TEXT    PRIMARY KEY,   -- 'f1', 'c2', 'n3'... or 'u-<timestamp>' for user-added
  name          TEXT    NOT NULL,
  category_id   TEXT    NOT NULL,      -- which category it belongs to -> categories.id
  subtitle      TEXT,                  -- the small grey line, e.g. "Italian · Pizza"
  description   TEXT,                  -- the "About" paragraph
  location      TEXT,                  -- human address, e.g. "Bizerte Medina"

  -- REAL = a number with decimals. GPS coordinates need the decimals.
  latitude      REAL,
  longitude     REAL,

  rating        REAL    NOT NULL DEFAULT 0,   -- average stars, 0-5
  review_count  INTEGER NOT NULL DEFAULT 0,   -- how many reviews it has

  price         TEXT,                  -- what we SHOW: 'Free', '$$', '5 TND'
  -- price_tier is what we SORT BY. The old code sorted on the length of the
  -- price text, which made 'Free' (4 letters) look pricier than '$$$' (3).
  -- 0 = free, 1 = cheap, 2 = medium, 3 = expensive.
  price_tier    INTEGER NOT NULL DEFAULT 0,
  price_range   TEXT,                  -- "15-35 TND per person"

  phone         TEXT,                  -- tapping it calls the place
  website       TEXT,                  -- tapping it opens the browser

  -- The main photo. We store a short TEXT key like 'real/oldport-1' and
  -- assetRegistry.js turns it back into a real image. See that file for why.
  image         TEXT,

  is_featured   INTEGER NOT NULL DEFAULT 0,   -- 1 = show on the Home screen (SQLite has no true/false, it uses 0/1)

  -- MODERATION. This is the column the admin screen works with.
  --   'approved' = visible to everyone
  --   'pending'  = a user submitted it, waiting for an admin to approve
  --   'hidden'   = an admin hid it; still in the database, not shown in the app
  status        TEXT    NOT NULL DEFAULT 'approved'
                CHECK (status IN ('approved', 'pending', 'hidden')),

  created_by    INTEGER,               -- which user submitted it (NULL = came with the app)
  created_at    TEXT    NOT NULL,

  FOREIGN KEY (category_id) REFERENCES categories(id),
  -- ON DELETE SET NULL: if that user is deleted, keep the place but forget who added it.
  FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE SET NULL
);

-- An INDEX is a shortcut that makes searching a column fast.
-- Without it, "find all approved food places" reads every single row.
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category_id);
CREATE INDEX IF NOT EXISTS idx_places_status   ON places(status);


-- ===========================================================================
-- PLACE_PHOTOS  (= PHOTO in the MCD)
-- The extra photos in the gallery on the detail screen.
-- One place has many photos, so they get their own table with a place_id
-- pointing back at their owner. That is a "one-to-many" relationship.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS place_photos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id   TEXT    NOT NULL,
  image      TEXT    NOT NULL,          -- same format as places.image
  sort_order INTEGER NOT NULL DEFAULT 0,-- controls left-to-right order in the gallery

  -- If the place is deleted, delete its photos too. Otherwise we would leave
  -- "orphan" photo rows behind forever.
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_photos_place ON place_photos(place_id);


-- ===========================================================================
-- FAVORITES  (= FAVORI in the MCD)
-- Which user hearted which place.
--
-- Note there is no "id" column. Instead the primary key is the PAIR
-- (user_id, place_id). That is exactly what we want: a user can favorite a
-- place once, and the database itself blocks a duplicate. No code needed.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS favorites (
  user_id    INTEGER NOT NULL,
  place_id   TEXT    NOT NULL,
  created_at TEXT    NOT NULL,

  PRIMARY KEY (user_id, place_id),

  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);


-- ===========================================================================
-- COMMENTS  (= AVIS in the MCD)
-- A user's written review + star rating for one place.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  place_id   TEXT    NOT NULL,

  -- CHECK forces the rating to be a sensible 1-5, so a bug can never store 99.
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text       TEXT    NOT NULL,

  -- The admin can hide an offensive comment without deleting the evidence.
  status     TEXT    NOT NULL DEFAULT 'approved'
             CHECK (status IN ('approved', 'hidden')),

  created_at TEXT    NOT NULL,

  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_place ON comments(place_id);


-- ===========================================================================
-- PLANS  (= ITINERAIRE in the MCD)
-- One day-plan belonging to one user. A user can have several.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS plans (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  title      TEXT    NOT NULL,          -- "My day in Bizerte"
  day_date   TEXT    NOT NULL,          -- 'YYYY-MM-DD' - which day this plan is for

  -- 0 = private (only me). 1 = the user asked to share it with everyone.
  is_public  INTEGER NOT NULL DEFAULT 0,

  -- Only matters for public plans: an admin approves them before others see them.
  status     TEXT    NOT NULL DEFAULT 'approved'
             CHECK (status IN ('approved', 'pending', 'hidden')),

  created_at TEXT    NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_plans_user ON plans(user_id);


-- ===========================================================================
-- PLAN_ITEMS  (= ITINERAIRE_ITEM / ActiviteItineraire in the MCD)
-- The individual activities inside one plan: "09:00 Breakfast, 1h".
-- ===========================================================================
CREATE TABLE IF NOT EXISTS plan_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id    INTEGER NOT NULL,

  -- Optional link to a real place. NULL when the user typed a free activity
  -- like "Rest at the hotel" that is not in our places table.
  place_id   TEXT,

  time       TEXT    NOT NULL,              -- 'HH:MM'
  title      TEXT    NOT NULL,
  subtitle   TEXT,
  duration   TEXT    NOT NULL DEFAULT '1h', -- '1h', '1h 30m', '45m'
  color      TEXT    NOT NULL DEFAULT '#1D2BEF',
  sort_order INTEGER NOT NULL DEFAULT 0,    -- lets the user reorder rows later

  FOREIGN KEY (plan_id)  REFERENCES plans(id)  ON DELETE CASCADE,
  -- SET NULL, not CASCADE: if an admin deletes a place, the user's plan keeps
  -- the row (they still remember going there), it just loses the link.
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_plan_items_plan ON plan_items(plan_id);


-- ===========================================================================
-- META - a tiny key/value table for the app's own bookkeeping.
-- We use it to remember "have we already loaded the starter data?" so the
-- seeding only ever happens once.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);
`;

// ---------------------------------------------------------------------------
// Version number of the schema above.
// If you ever change the tables, raise this number and add an upgrade step in
// database.js. That is how you avoid breaking phones that already have data.
// ---------------------------------------------------------------------------
export const SCHEMA_VERSION = 1;
