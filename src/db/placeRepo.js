// ============================================================================
// db/placeRepo.js - EVERYTHING ABOUT PLACES
//
// Reading places for the Home / Category / Map screens, letting a user submit
// a new place, and letting an admin approve, hide or delete one.
//
// A NOTE ON "status", because it drives the whole moderation feature:
//   'approved'  everyone sees it
//   'pending'   a user submitted it; only its author and admins see it
//   'hidden'    an admin took it down; only admins see it
// Ordinary screens therefore always filter on status = 'approved'.
// ============================================================================

import { getDb, nowIso } from './database';
// Used by deletePlace to remove the actual photo FILES a user uploaded, which
// the database's own ON DELETE rules cannot reach.
import { deletePhoto, isUserPhoto } from '../media/photoStorage';

// ---------------------------------------------------------------------------
// PLACE_COLUMNS - the columns every screen expects, with SQL names translated
// into the JavaScript names the existing screens already use.
//
// Writing this once means all the queries below return an identical shape, so
// a place from the Home screen and a place from the Map screen behave the same.
// ---------------------------------------------------------------------------
const PLACE_COLUMNS = `
  p.id,
  p.name,
  p.category_id   AS categoryId,
  p.subtitle      AS category,      -- screens still call this field "category"
  p.description,
  p.location,
  p.latitude,
  p.longitude,
  p.rating,
  p.review_count  AS reviews,
  p.price,
  p.price_tier    AS priceTier,
  p.price_range   AS priceRange,
  p.phone,
  p.website,
  p.image,
  p.is_featured   AS isFeatured,
  p.status,
  p.created_by    AS createdBy,
  p.created_at    AS createdAt,
  c.color         AS color,         -- the category's color, for map pins
  c.icon          AS categoryIcon
`;

// Every read joins `categories` so the place arrives with its color already
// attached. The old code stamped the color on only for the map, which is why
// the same place looked different depending on which screen you came from.
const FROM_PLACES = `
  FROM places p
  JOIN categories c ON c.id = p.category_id
`;

// ===========================================================================
// READING
// ===========================================================================

// listPlaces({ categoryId, search, sort, favoritesOf, limit }) - the one
// flexible query behind the Home and Category screens.
//
// Every option is optional. Called with nothing, it returns every approved
// place. This replaces the six separate arrays in the old mockData.js.
export async function listPlaces({
  categoryId = null,   // 'food' | 'coffee' | ... or null for all categories
  search = '',         // free text typed by the user
  sort = 'default',    // 'default' | 'rating' | 'price'
  favoritesOf = null,  // a user id: keep only places THAT user has favorited
  featuredOnly = false,
  limit = null,        // maximum rows to return
} = {}) {
  const db = await getDb();

  // We build the WHERE clause piece by piece. `conditions` collects the text,
  // `values` collects what fills each ? - and they must stay in the same order.
  const conditions = ["p.status = 'approved'"];   // never show pending/hidden here
  const values = [];

  if (categoryId) {
    conditions.push('p.category_id = ?');
    values.push(categoryId);
  }

  if (featuredOnly) {
    conditions.push('p.is_featured = 1');
  }

  // SEARCH. LIKE '%text%' means "contains text anywhere".
  // LOWER(...) on both sides makes it case-insensitive, so "PIZZA" finds "Pizza".
  //
  // Note the .trim(): the old screen checked `query.trim()` but then searched
  // with the UNtrimmed text, so typing "pizza " (with a trailing space) found
  // nothing. Trimming once here fixes it everywhere at the same time.
  const cleanSearch = (search || '').trim().toLowerCase();
  if (cleanSearch) {
    // COALESCE(x, '') means "use x, but if it is NULL use an empty string".
    // Without it, a place with no subtitle would make the whole comparison
    // NULL and silently drop out of the results.
    conditions.push(`(
      LOWER(p.name) LIKE ?
      OR LOWER(COALESCE(p.subtitle, '')) LIKE ?
      OR LOWER(COALESCE(p.location, '')) LIKE ?
    )`);
    const pattern = `%${cleanSearch}%`;
    values.push(pattern, pattern, pattern);   // one value per ? above
  }

  // FAVORITES FILTER. "EXISTS (a small query)" keeps only rows for which that
  // small query finds something - here, a favorites row joining this user and
  // this place.
  if (favoritesOf) {
    conditions.push(`EXISTS (
      SELECT 1 FROM favorites f WHERE f.place_id = p.id AND f.user_id = ?
    )`);
    values.push(favoritesOf);
  }

  // SORTING.
  //   rating  -> best first
  //   price   -> cheapest first, using the NUMBER we stored (not text length)
  //   default -> featured places first, then best rated
  let orderBy = 'p.is_featured DESC, p.rating DESC';
  if (sort === 'rating') orderBy = 'p.rating DESC';
  if (sort === 'price') orderBy = 'p.price_tier ASC, p.rating DESC';

  // LIMIT caps how many rows come back (used by the Home carousel).
  const limitClause = limit ? ` LIMIT ${Number(limit)}` : '';
  // Number(limit) forces it to be a number. Placing raw text into SQL would be
  // an injection risk; forcing it through Number() makes that impossible here.

  return db.getAllAsync(
    `SELECT ${PLACE_COLUMNS} ${FROM_PLACES}
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${orderBy}${limitClause}`,
    values
  );
}

// getPlaceById(id) - one place with everything the detail screen needs.
//
// The old app passed the whole place object through navigation params, which
// only worked by luck. Now screens pass just the id and look it up here - so
// deep links, notifications and saved state all work the same way.
export async function getPlaceById(id) {
  const db = await getDb();

  const place = await db.getFirstAsync(
    `SELECT ${PLACE_COLUMNS} ${FROM_PLACES} WHERE p.id = ?`,
    [id]
  );
  if (!place) return null;

  // Fetch the gallery photos separately and attach them, so the screen gets
  // one tidy object with a `gallery` array, exactly like the old mock data.
  const photos = await db.getAllAsync(
    'SELECT image FROM place_photos WHERE place_id = ? ORDER BY sort_order ASC',
    [id]
  );
  place.gallery = photos.map((row) => row.image);   // just the image keys

  return place;
}

// listMapPlaces() - every approved place that actually has coordinates.
//
// "latitude IS NOT NULL" matters: a user-submitted place without a location
// would otherwise be drawn at 0,0 - in the ocean off West Africa.
export async function listMapPlaces() {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT ${PLACE_COLUMNS} ${FROM_PLACES}
     WHERE p.status = 'approved' AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
     ORDER BY p.is_featured DESC, p.rating DESC`
  );
}

// listCategories() - the 6 categories for the Home strip and the map chips.
export async function listCategories() {
  const db = await getDb();
  return db.getAllAsync('SELECT id, label, icon, color FROM categories ORDER BY sort_order ASC');
}

// countPlacesByCategory() - how many approved places each category has.
// Lets the Home screen show "12 places" under a category instead of guessing.
export async function countPlacesByCategory() {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT category_id AS categoryId, COUNT(*) AS total
     FROM places WHERE status = 'approved'
     GROUP BY category_id`   // GROUP BY = one result row per category
  );

  // Turn [{categoryId:'food', total:7}, ...] into {food: 7, ...} so a screen
  // can just read counts[cat.id] without searching the array every time.
  const counts = {};
  for (const row of rows) counts[row.categoryId] = row.total;
  return counts;
}

// ===========================================================================
// WRITING - a user submits a new place
// ===========================================================================

// createPlace({...}) - add a place. Regular users get 'pending' (an admin must
// approve it); admins get 'approved' straight away.
export async function createPlace({
  name,
  categoryId,
  subtitle,
  description,
  location,
  latitude,
  longitude,
  price,
  priceTier = 0,
  priceRange,
  phone,
  website,
  image,
  gallery = [],
  createdBy,          // the id of the user submitting it
  isAdmin = false,    // does that user have the admin role?
}) {
  const db = await getDb();

  // --- Validation ---
  const cleanName = (name || '').trim();
  if (cleanName.length < 3) return { ok: false, error: 'nameTooShort' };
  if (!categoryId) return { ok: false, error: 'categoryRequired' };

  // Make sure the category really exists, otherwise the foreign key would
  // reject the insert with a message no user could understand.
  const category = await db.getFirstAsync('SELECT id FROM categories WHERE id = ?', [categoryId]);
  if (!category) return { ok: false, error: 'categoryInvalid' };

  // Build an id that cannot collide with the seeded ones ('f1', 'n2', ...).
  // 'u-' marks it as user-created; the timestamp and a random tail keep it unique
  // even if two people submit in the same millisecond.
  const id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // The moderation rule, in one line.
  const status = isAdmin ? 'approved' : 'pending';

  // WHY try/catch HERE: a foreign key violation - for example a `createdBy`
  // pointing at an account that has just been deleted - makes the INSERT THROW
  // rather than return a value. Every other failure in this function comes back
  // as { ok: false, error }, so without this the calling screen would have to
  // handle two completely different kinds of failure.
  try {
    await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO places (
         id, name, category_id, subtitle, description, location,
         latitude, longitude, rating, review_count,
         price, price_tier, price_range, phone, website,
         image, is_featured, status, created_by, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        id,
        cleanName,
        categoryId,
        (subtitle || '').trim() || null,
        (description || '').trim() || null,
        (location || '').trim() || null,
        latitude ?? null,
        longitude ?? null,
        price || null,
        priceTier,
        priceRange || null,
        phone || null,
        website || null,
        image || null,
        status,
        createdBy ?? null,
        nowIso(),
      ]
    );

    // Save the gallery photos, keeping the order the user chose.
    for (const [index, photo] of gallery.entries()) {
      if (!photo) continue;
      await db.runAsync(
        'INSERT INTO place_photos (place_id, image, sort_order) VALUES (?, ?, ?)',
        [id, photo, index]
      );
    }
    });
  } catch (error) {
    console.warn('[placeRepo] createPlace failed:', error);
    return { ok: false, error: 'saveFailed' };
  }

  return { ok: true, id, status };
}

// updatePlace({ id, ...fields }) - edit an existing place.
// Only the fields you pass are changed; anything left out keeps its value.
export async function updatePlace({ id, ...fields }) {
  const db = await getDb();

  // Which JavaScript field maps to which SQL column.
  const COLUMN_FOR = {
    name: 'name',
    categoryId: 'category_id',
    subtitle: 'subtitle',
    description: 'description',
    location: 'location',
    latitude: 'latitude',
    longitude: 'longitude',
    price: 'price',
    priceTier: 'price_tier',
    priceRange: 'price_range',
    phone: 'phone',
    website: 'website',
    image: 'image',
  };

  const sets = [];
  const values = [];

  // Walk the fields we were given and build "column = ?" for each known one.
  for (const [field, value] of Object.entries(fields)) {
    const column = COLUMN_FOR[field];
    if (!column) continue;             // ignore anything not in the map above
    sets.push(`${column} = ?`);
    values.push(value);
  }

  if (sets.length === 0) return { ok: true };   // nothing asked for, nothing to do

  values.push(id);                      // the id fills the last ?
  await db.runAsync(`UPDATE places SET ${sets.join(', ')} WHERE id = ?`, values);

  return { ok: true };
}

// ===========================================================================
// MODERATION - admin only
// ===========================================================================

// listPlacesForModeration(status) - what the admin screen lists.
// Pass 'pending' for the approval queue, 'hidden' for the hidden list,
// or 'all' to see everything.
export async function listPlacesForModeration(status = 'pending') {
  const db = await getDb();

  // LEFT JOIN (rather than JOIN) on users: keep the place even when created_by
  // is NULL - which is true for all 28 places that shipped with the app.
  // A plain JOIN would silently hide every one of them.
  const where = status === 'all' ? '' : 'WHERE p.status = ?';
  const values = status === 'all' ? [] : [status];

  return db.getAllAsync(
    `SELECT ${PLACE_COLUMNS}, u.name AS authorName, u.email AS authorEmail
     FROM places p
     JOIN categories c ON c.id = p.category_id
     LEFT JOIN users u ON u.id = p.created_by
     ${where}
     ORDER BY p.created_at DESC`,
    values
  );
}

// setPlaceStatus({ id, status }) - approve / hide / restore in one function.
// The admin screen calls this with 'approved', 'hidden' or 'pending'.
export async function setPlaceStatus({ id, status }) {
  const db = await getDb();

  // Refuse anything that is not one of our three states, so a typo in a screen
  // can never write a value that makes a place invisible everywhere.
  if (!['approved', 'pending', 'hidden'].includes(status)) {
    return { ok: false, error: 'badStatus' };
  }

  await db.runAsync('UPDATE places SET status = ? WHERE id = ?', [status, id]);
  return { ok: true };
}

// deletePlace(id) - remove a place for good.
//
// The ON DELETE rules in schema.js clean up the DATABASE for us: its photo
// rows, favorites and comments go too, and any plan row that referenced it
// keeps its text but loses the link.
//
// What the database CANNOT clean up is the photo FILES on the phone. If the
// user uploaded their own pictures, those are real files in the app's storage,
// and deleting the row would just orphan them - they would take up space
// forever with nothing pointing at them. So we collect the paths first, delete
// the row, then delete the files.
export async function deletePlace(id) {
  const db = await getDb();

  // Gather every photo path BEFORE the rows disappear.
  const main = await db.getFirstAsync('SELECT image FROM places WHERE id = ?', [id]);
  const gallery = await db.getAllAsync('SELECT image FROM place_photos WHERE place_id = ?', [id]);

  await db.runAsync('DELETE FROM places WHERE id = ?', [id]);

  // Now the files. isUserPhoto() makes this safe: it is false for a bundled
  // photo key like 'real/oldport-1', so the pictures that shipped with the app
  // can never be deleted by mistake.
  const paths = [main?.image, ...gallery.map((row) => row.image)];
  for (const path of paths) {
    if (isUserPhoto(path)) deletePhoto(path);
  }

  return { ok: true };
}

// countByStatus() - the numbers on the admin dashboard badges.
export async function countByStatus() {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT status, COUNT(*) AS total FROM places GROUP BY status');

  // Start every counter at 0 so the screen never has to handle `undefined`.
  const counts = { approved: 0, pending: 0, hidden: 0 };
  for (const row of rows) counts[row.status] = row.total;
  return counts;
}

// listPlacesByUser(userId) - "places I submitted", with their current status.
export async function listPlacesByUser(userId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT ${PLACE_COLUMNS} ${FROM_PLACES}
     WHERE p.created_by = ?
     ORDER BY p.created_at DESC`,
    [userId]
  );
}
