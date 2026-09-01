// ============================================================================
// db/seed.js - LOADING THE STARTER CONTENT INTO THE DATABASE
//
// "Seeding" means filling a brand-new, empty database with the content the app
// needs to be useful on first launch: the 6 categories, the 30 Bizerte places,
// their photos, and a default admin account.
//
// The source is the OLD file, src/data/mockData.js. We read it once, copy it
// into real database tables, and from that moment on every screen reads the
// database instead. mockData.js then only exists as the seed - nothing else
// imports it.
//
// This runs ONCE, ever. We write a flag into the `meta` table afterwards, and
// check that flag on every launch.
// ============================================================================

import {
  categories,
  featuredPlaces,
  foodPlaces,
  coffeePlaces,
  naturePlaces,
  activityPlaces,
  shoppingPlaces,
} from '../data/mockData';
import { ASSETS } from '../data/assetRegistry';
import { hashPassword } from './password';
import { nowIso } from './database';

// ---------------------------------------------------------------------------
// TURNING require() NUMBERS BACK INTO TEXT KEYS
//
// mockData.js stores photos as require('../../assets/home/real/oldport-1.jpg'),
// which is a NUMBER at runtime. Our database stores text keys instead.
//
// The trick: assetRegistry.js requires the exact same files, so it holds the
// exact same numbers - just with the keys attached. Metro gives one file one
// id no matter how many times it is required. So we can simply flip the
// registry around: instead of key -> number, build number -> key.
// ---------------------------------------------------------------------------
const KEY_BY_MODULE_ID = {};                        // will be { 42: 'real/oldport-1', ... }
for (const [key, moduleId] of Object.entries(ASSETS)) {
  KEY_BY_MODULE_ID[moduleId] = key;                 // flip each pair around
}

// Convert one image value from mockData into what we store in the database.
function toImageKey(value) {
  if (value == null) return null;                       // no photo at all
  if (typeof value === 'string') return value;          // already a URL - keep as is
  return KEY_BY_MODULE_ID[value] || null;               // a require() number -> its key
}

// ---------------------------------------------------------------------------
// PRICE TIER
// The old code sorted "cheapest first" using the LENGTH of the price text,
// which ranked 'Free' (4 letters) as pricier than '$$$' (3). We fix that by
// storing a real number next to the text.
//   0 = free, 1 = cheap, 2 = medium, 3 = expensive
// ---------------------------------------------------------------------------
function priceTierFor(price) {
  if (!price) return 0;                        // missing price -> treat as free
  if (price === 'Free') return 0;
  if (price === '$') return 1;
  if (price === '$$') return 2;
  if (price === '$$$') return 3;
  // Anything like '5 TND' - a real amount. Pull the digits out and grade it.
  const amount = parseInt(price, 10);          // '5 TND' -> 5
  if (Number.isNaN(amount)) return 1;          // unrecognised text -> assume cheap
  if (amount === 0) return 0;
  if (amount <= 10) return 1;
  if (amount <= 40) return 2;
  return 3;
}

// ---------------------------------------------------------------------------
// WHICH CATEGORY DOES EACH LIST BELONG TO
// mockData keeps places in six separate arrays. In the database every place
// carries a category_id instead, so we pair each array with its id here.
// The `featured` flag marks the 4 places shown on the Home screen.
// ---------------------------------------------------------------------------
const PLACE_SOURCES = [
  // featuredPlaces is a mixed bag (culture, nature, beach), so we look at each
  // record's own text to decide. See categoryForFeatured() below.
  { list: featuredPlaces, categoryId: null,       featured: true  },
  { list: foodPlaces,     categoryId: 'food',     featured: false },
  { list: coffeePlaces,   categoryId: 'coffee',   featured: false },
  { list: naturePlaces,   categoryId: 'nature',   featured: false },
  { list: activityPlaces, categoryId: 'activity', featured: false },
  { list: shoppingPlaces, categoryId: 'shopping', featured: false },
];

// The 4 featured places have a free-text category ('Culture', 'Nature',
// 'Beach'). Map those onto our 6 real category ids.
// Side benefit: 'Corniche Beach' finally lands in the `beach` category, which
// was advertised on the Home screen but had no places behind it.
function categoryForFeatured(place) {
  const text = (place.category || '').toLowerCase();
  if (text.includes('beach')) return 'beach';
  if (text.includes('nature')) return 'nature';
  return 'activity';                            // 'Culture' fits best under Activity
}

// ---------------------------------------------------------------------------
// DUPLICATES IN THE OLD DATA
//
// mockData.js listed some places twice, under two different ids, because the
// featured list was written separately from the category lists:
//   id '2' "Cap Blanc Viewpoint"     is the same spot as 'n4' "Cap Blanc"
//   id '3' "Ichkeul National Park"   is the same spot as 'n3' (identical coords)
//
// It went unnoticed before because the featured list and the nature list were
// never shown together. Now that both feed the same `places` table, the Nature
// category would list each of them twice, and the map would draw two markers
// exactly on top of each other - one of them permanently unclickable.
//
// So we skip the second copy. The keys are the ids we DROP.
// ('a4' Old Port Boat Tour shares coordinates with '1' Old Port but is a
//  genuinely different thing - a boat trip, not the harbour - so it stays.)
// ---------------------------------------------------------------------------
const DUPLICATE_OF = {
  n3: '3',   // Ichkeul National Park
  n4: '2',   // Cap Blanc
};

// Colors used for map markers and plan rows, one per category.
// These are the same values the old allMapPlaces array stamped on.
const CATEGORY_COLORS = {
  food:     '#F59E0B',
  coffee:   '#8B5CF6',
  beach:    '#0EA5E9',
  nature:   '#22C55E',
  activity: '#06B6D4',
  shopping: '#EF4444',
};

// ---------------------------------------------------------------------------
// seedIfEmpty(db) - the function database.js calls on startup.
// Does nothing at all if the seeding already happened.
// ---------------------------------------------------------------------------
export async function seedIfEmpty(db) {
  // Look for our "already done" flag in the meta table.
  // getFirstAsync returns the first matching row, or null if there is none.
  const flag = await db.getFirstAsync(
    'SELECT value FROM meta WHERE key = ?',      // the ? is a placeholder...
    ['seeded']                                   // ...filled in safely from this array
  );

  // Flag found -> a previous launch already seeded. Stop here.
  if (flag?.value === 'true') return;

  // withTransactionAsync groups everything below into ONE all-or-nothing block.
  // If any insert fails halfway, SQLite undoes the whole thing, so we can never
  // end up with half the places loaded.
  await db.withTransactionAsync(async () => {
    await seedCategories(db);
    await seedPlaces(db);
    await seedAdminUser(db);

    // Finally, write the flag so this never runs again.
    await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
      'seeded',
      'true',
    ]);
  });
}

// ---------------------------------------------------------------------------
// The 6 categories.
// ---------------------------------------------------------------------------
async function seedCategories(db) {
  // .entries() gives us both the position (index) and the item, so we can use
  // the position as sort_order and keep the original Home-screen order.
  for (const [index, cat] of categories.entries()) {
    await db.runAsync(
      // INSERT OR IGNORE: if a row with this id somehow already exists, skip it
      // quietly instead of throwing an error.
      `INSERT OR IGNORE INTO categories (id, label, icon, color, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [cat.id, cat.label, cat.icon, CATEGORY_COLORS[cat.id] || '#1D2BEF', index]
    );
  }
}

// ---------------------------------------------------------------------------
// The 30 places, plus their gallery photos.
// ---------------------------------------------------------------------------
async function seedPlaces(db) {
  const createdAt = nowIso();

  // Outer loop: one pass per source array (featured, food, coffee, ...).
  for (const source of PLACE_SOURCES) {
    // Inner loop: one pass per place inside that array.
    for (const place of source.list) {
      // Is this one of the known duplicates? Then it is already in the table
      // under its other id, so skip it. `continue` jumps to the next place.
      if (DUPLICATE_OF[place.id]) continue;

      // Featured places work out their own category; the rest inherit the array's.
      const categoryId = source.categoryId || categoryForFeatured(place);

      await db.runAsync(
        `INSERT OR IGNORE INTO places (
           id, name, category_id, subtitle, description, location,
           latitude, longitude, rating, review_count,
           price, price_tier, price_range, phone, website,
           image, is_featured, status, created_by, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          place.id,
          place.name,
          categoryId,
          place.category || null,          // the old free-text line becomes `subtitle`
          place.description || null,
          place.location || null,
          place.latitude ?? null,          // ?? means "use null only if truly missing"
          place.longitude ?? null,
          place.rating ?? 0,
          place.reviews ?? 0,
          place.price || null,
          priceTierFor(place.price),
          place.priceRange || null,
          place.phone || null,
          place.website || null,
          toImageKey(place.image),
          source.featured ? 1 : 0,         // SQLite has no true/false, it uses 1/0
          'approved',                      // everything shipped with the app is pre-approved
          null,                            // created_by = nobody; this came with the app
          createdAt,
        ]
      );

      // Now the gallery photos for this place, in order.
      const gallery = place.gallery || [];
      for (const [index, photo] of gallery.entries()) {
        const imageKey = toImageKey(photo);
        if (!imageKey) continue;           // skip anything we could not translate

        await db.runAsync(
          `INSERT INTO place_photos (place_id, image, sort_order) VALUES (?, ?, ?)`,
          [place.id, imageKey, index]
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// A default admin account, so there is someone who can moderate on day one.
//
// SECURITY NOTE, stated honestly: shipping a known password is only acceptable
// because this is a local demo database with no server behind it. A real
// product would force this password to be changed on first login.
// ---------------------------------------------------------------------------
async function seedAdminUser(db) {
  const email = 'admin@bonplan.tn';
  const plainPassword = 'admin123';

  // Scramble the password before storing it. See password.js for how.
  const { hash, salt } = await hashPassword(plainPassword);

  await db.runAsync(
    `INSERT OR IGNORE INTO users
       (name, email, password_hash, password_salt, role, language, theme_mode, city, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Admin', email, hash, salt, 'admin', 'en', 'light', 'Bizerte', nowIso()]
  );
}
