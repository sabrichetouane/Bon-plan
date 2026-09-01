// ============================================================================
// db/commentRepo.js - REVIEWS AND COMMENTS
//
// Before, the detail screen showed the SAME two fake reviews ("Sarra M.",
// "Youssef B.") on all 30 places, and the star count came from a made-up
// number in mockData. Now users write real reviews and the average rating is
// recalculated from them.
//
// This is the AVIS entity from the MCD.
// ============================================================================

import { getDb, nowIso } from './database';

// ---------------------------------------------------------------------------
// listComments(placeId) - the reviews shown under one place, newest first.
//
// The JOIN pulls the author's name out of the users table, so each review
// arrives ready to display without a second query per row.
// ---------------------------------------------------------------------------
export async function listComments(placeId) {
  const db = await getDb();

  return db.getAllAsync(
    `SELECT
       cm.id,
       cm.rating,
       cm.text,
       cm.created_at AS createdAt,
       cm.user_id    AS userId,
       u.name        AS authorName
     FROM comments cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.place_id = ? AND cm.status = 'approved'
     ORDER BY cm.created_at DESC`,
    [placeId]
  );
}

// ---------------------------------------------------------------------------
// getUserComment(userId, placeId) - has this person already reviewed this place?
//
// We allow one review per person per place. The Add-review form uses this to
// decide whether to say "Write a review" or "Edit your review".
// ---------------------------------------------------------------------------
export async function getUserComment(userId, placeId) {
  if (!userId) return null;

  const db = await getDb();
  return db.getFirstAsync(
    `SELECT id, rating, text, created_at AS createdAt
     FROM comments WHERE user_id = ? AND place_id = ?`,
    [userId, placeId]
  );
}

// ---------------------------------------------------------------------------
// addComment({ userId, placeId, rating, text }) - write or update a review.
// ---------------------------------------------------------------------------
export async function addComment({ userId, placeId, rating, text }) {
  const db = await getDb();

  // --- Validation ---
  if (!userId) return { ok: false, error: 'notLoggedIn' };

  const cleanText = (text || '').trim();
  if (cleanText.length < 3) return { ok: false, error: 'textTooShort' };

  // Force the rating into a whole number between 1 and 5 before it ever
  // reaches SQL, so the CHECK constraint in schema.js never has to reject it.
  const cleanRating = Math.round(Number(rating));
  if (!(cleanRating >= 1 && cleanRating <= 5)) return { ok: false, error: 'ratingInvalid' };

  // If they already reviewed this place, replace the old review rather than
  // adding a second one.
  const existing = await getUserComment(userId, placeId);

  await db.withTransactionAsync(async () => {
    if (existing) {
      await db.runAsync('UPDATE comments SET rating = ?, text = ?, created_at = ? WHERE id = ?', [
        cleanRating,
        cleanText,
        nowIso(),
        existing.id,
      ]);
    } else {
      await db.runAsync(
        `INSERT INTO comments (user_id, place_id, rating, text, status, created_at)
         VALUES (?, ?, ?, ?, 'approved', ?)`,
        [userId, placeId, cleanRating, cleanText, nowIso()]
      );
    }

    // Either way the place's average has changed, so refresh it.
    await recalculateRating(db, placeId);
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// deleteComment({ commentId, userId, isAdmin }) - remove a review.
//
// A user may only delete their OWN review; an admin may delete any. That check
// happens here, not in the screen, so no screen can accidentally skip it.
// ---------------------------------------------------------------------------
export async function deleteComment({ commentId, userId, isAdmin = false }) {
  const db = await getDb();

  const comment = await db.getFirstAsync(
    'SELECT user_id AS userId, place_id AS placeId FROM comments WHERE id = ?',
    [commentId]
  );
  if (!comment) return { ok: false, error: 'notFound' };

  // Not the author and not an admin -> refuse.
  if (comment.userId !== userId && !isAdmin) return { ok: false, error: 'notAllowed' };

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM comments WHERE id = ?', [commentId]);
    await recalculateRating(db, comment.placeId);
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// setCommentStatus({ commentId, status }) - admin hides or restores a review.
//
// Hiding rather than deleting keeps the evidence, which matters if the author
// later disputes the decision.
// ---------------------------------------------------------------------------
export async function setCommentStatus({ commentId, status }) {
  const db = await getDb();
  if (!['approved', 'hidden'].includes(status)) return { ok: false, error: 'badStatus' };

  const comment = await db.getFirstAsync('SELECT place_id AS placeId FROM comments WHERE id = ?', [
    commentId,
  ]);
  if (!comment) return { ok: false, error: 'notFound' };

  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE comments SET status = ? WHERE id = ?', [status, commentId]);
    // A hidden review must stop counting towards the average.
    await recalculateRating(db, comment.placeId);
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// recalculateRating(db, placeId) - recompute a place's average and count.
//
// Private helper. Called after every review change so places.rating and
// places.review_count always agree with the comments table. Keeping a
// pre-computed value like this is called "denormalisation": it duplicates
// information, but it means the Home screen can show a rating without
// averaging every review each time it renders.
//
// Takes `db` as an argument (instead of calling getDb itself) so it runs
// INSIDE the caller's transaction - if the caller fails, this is undone too.
// ---------------------------------------------------------------------------
async function recalculateRating(db, placeId) {
  // AVG and COUNT are SQL's built-in maths. They run inside the database,
  // over only the approved reviews.
  const stats = await db.getFirstAsync(
    `SELECT AVG(rating) AS average, COUNT(*) AS total
     FROM comments WHERE place_id = ? AND status = 'approved'`,
    [placeId]
  );

  // With no reviews at all, AVG returns NULL. `?? 0` turns that into 0.
  const total = stats?.total ?? 0;
  // Round to one decimal so we show 4.3, not 4.333333333.
  const average = total > 0 ? Math.round(stats.average * 10) / 10 : 0;

  await db.runAsync('UPDATE places SET rating = ?, review_count = ? WHERE id = ?', [
    average,
    total,
    placeId,
  ]);
}

// ---------------------------------------------------------------------------
// listAllComments() - every review in the app, for the admin moderation screen.
// ---------------------------------------------------------------------------
export async function listAllComments() {
  const db = await getDb();

  return db.getAllAsync(
    `SELECT
       cm.id, cm.rating, cm.text, cm.status,
       cm.created_at AS createdAt,
       u.name        AS authorName,
       u.email       AS authorEmail,
       p.name        AS placeName,
       p.id          AS placeId
     FROM comments cm
     JOIN users  u ON u.id = cm.user_id
     JOIN places p ON p.id = cm.place_id
     ORDER BY cm.created_at DESC`
  );
}

// ---------------------------------------------------------------------------
// countComments(userId) - how many reviews one person has written.
// ---------------------------------------------------------------------------
export async function countComments(userId) {
  if (!userId) return 0;
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT COUNT(*) AS total FROM comments WHERE user_id = ?', [
    userId,
  ]);
  return row?.total ?? 0;
}
