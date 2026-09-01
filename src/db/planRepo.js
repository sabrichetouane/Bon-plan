// ============================================================================
// db/planRepo.js - DAY PLANS (ITINERARIES)
//
// Before, there was ONE plan, it lived in memory, and it vanished on reload.
// Now a user can have several plans, each with a date, each saved.
//
// Two tables work together (see schema.js):
//   plans        one row per day-plan   ("Saturday in Bizerte")
//   plan_items   the activities inside  ("09:00 Breakfast, 1h")
// This is a classic parent/child pair, like an invoice and its lines.
//
// A user can also mark a plan PUBLIC to share it. Public plans go to an admin
// for approval first, which is why plans have the same status column places do.
// ============================================================================

import { getDb, nowIso, todayDate } from './database';

// ===========================================================================
// READING
// ===========================================================================

// listPlans(userId) - all of one user's plans, newest first, each with a count
// of how many activities it holds.
//
// The "(SELECT COUNT(*) ...)" inside the column list is a sub-query: for every
// plan row, SQLite runs that little count and returns it as another column.
// That saves us from loading every activity just to show "5 activities".
export async function listPlans(userId) {
  if (!userId) return [];

  const db = await getDb();
  return db.getAllAsync(
    `SELECT
       p.id,
       p.title,
       p.day_date  AS dayDate,
       p.is_public AS isPublic,
       p.status,
       p.created_at AS createdAt,
       (SELECT COUNT(*) FROM plan_items i WHERE i.plan_id = p.id) AS itemCount
     FROM plans p
     WHERE p.user_id = ?
     ORDER BY p.day_date DESC, p.created_at DESC`,
    [userId]
  );
}

// getPlan(planId) - one plan with its activities already attached.
export async function getPlan(planId) {
  const db = await getDb();

  const plan = await db.getFirstAsync(
    `SELECT id, user_id AS userId, title, day_date AS dayDate,
            is_public AS isPublic, status, created_at AS createdAt
     FROM plans WHERE id = ?`,
    [planId]
  );
  if (!plan) return null;

  plan.items = await listPlanItems(planId);
  return plan;
}

// listPlanItems(planId) - the activities of one plan, in display order.
//
// ORDER BY sort_order, then time: the user's manual order wins, and anything
// with the same sort_order falls back to chronological. Because time is stored
// as 'HH:MM' text with a leading zero, sorting the TEXT gives the right order
// ('09:00' comes before '13:00'), which is exactly why we pad it.
export async function listPlanItems(planId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT
       i.id, i.plan_id AS planId, i.place_id AS placeId,
       i.time, i.title, i.subtitle, i.duration, i.color, i.sort_order AS sortOrder,
       p.image AS placeImage
     FROM plan_items i
     LEFT JOIN places p ON p.id = i.place_id
     WHERE i.plan_id = ?
     ORDER BY i.sort_order ASC, i.time ASC`,
    [planId]
  );
}

// getOrCreateTodayPlan(userId) - what the Itinerary tab opens on.
//
// The tab needs "the plan I am working on right now". If the user has one for
// today we use it; otherwise we quietly make an empty one. That way the screen
// never has to show a "create a plan first" step.
export async function getOrCreateTodayPlan(userId) {
  if (!userId) return null;

  const db = await getDb();
  const today = todayDate();

  const existing = await db.getFirstAsync(
    'SELECT id FROM plans WHERE user_id = ? AND day_date = ? ORDER BY created_at ASC',
    [userId, today]
  );

  if (existing) return getPlan(existing.id);

  const created = await createPlan({ userId, title: 'My day in Bizerte', dayDate: today });
  return getPlan(created.id);
}

// ===========================================================================
// WRITING - plans
// ===========================================================================

// createPlan({ userId, title, dayDate }) - start a new empty plan.
export async function createPlan({ userId, title, dayDate }) {
  const db = await getDb();
  if (!userId) return { ok: false, error: 'notLoggedIn' };

  const cleanTitle = (title || '').trim() || 'My day in Bizerte';

  const result = await db.runAsync(
    `INSERT INTO plans (user_id, title, day_date, is_public, status, created_at)
     VALUES (?, ?, ?, 0, 'approved', ?)`,
    [userId, cleanTitle, dayDate || todayDate(), nowIso()]
  );

  // A brand-new plan is private (is_public = 0), so it needs no approval yet -
  // hence status 'approved'. It only goes to the admin queue if the user later
  // chooses to share it (see setPlanVisibility below).
  return { ok: true, id: result.lastInsertRowId };
}

// updatePlan({ planId, title, dayDate }) - rename a plan or move it to another day.
export async function updatePlan({ planId, title, dayDate }) {
  const db = await getDb();

  const sets = [];
  const values = [];

  if (title !== undefined) {
    const cleanTitle = (title || '').trim();
    if (cleanTitle.length < 1) return { ok: false, error: 'titleRequired' };
    sets.push('title = ?');
    values.push(cleanTitle);
  }
  if (dayDate !== undefined) {
    sets.push('day_date = ?');
    values.push(dayDate);
  }

  if (sets.length === 0) return { ok: true };

  values.push(planId);
  await db.runAsync(`UPDATE plans SET ${sets.join(', ')} WHERE id = ?`, values);
  return { ok: true };
}

// deletePlan(planId) - remove a plan.
// ON DELETE CASCADE in schema.js removes its activities automatically.
export async function deletePlan(planId) {
  const db = await getDb();
  await db.runAsync('DELETE FROM plans WHERE id = ?', [planId]);
  return { ok: true };
}

// setPlanVisibility({ planId, isPublic, isAdmin }) - share a plan, or unshare it.
//
// Sharing is the moment moderation kicks in: an ordinary user's public plan
// becomes 'pending' until an admin approves it. An admin's own plan is
// approved immediately, and making a plan private again clears the queue.
export async function setPlanVisibility({ planId, isPublic, isAdmin = false }) {
  const db = await getDb();

  let status;
  if (!isPublic) {
    status = 'approved';           // private again - nothing to moderate
  } else if (isAdmin) {
    status = 'approved';           // admins publish directly
  } else {
    status = 'pending';            // everyone else waits for approval
  }

  await db.runAsync('UPDATE plans SET is_public = ?, status = ? WHERE id = ?', [
    isPublic ? 1 : 0,              // SQLite stores true/false as 1/0
    status,
    planId,
  ]);

  return { ok: true, status };
}

// ===========================================================================
// WRITING - activities inside a plan
// ===========================================================================

// addPlaceToPlan({ planId, place }) - the "Add to itinerary" button.
//
// Returns { ok:false, error:'alreadyAdded' } if that place is already in this
// plan, so the screen can show a friendly message instead of a duplicate row.
export async function addPlaceToPlan({ planId, place }) {
  const db = await getDb();
  if (!planId || !place) return { ok: false, error: 'missingData' };

  // Already in this plan?
  const existing = await db.getFirstAsync(
    'SELECT id FROM plan_items WHERE plan_id = ? AND place_id = ?',
    [planId, place.id]
  );
  if (existing) return { ok: false, error: 'alreadyAdded' };

  // Work out a sensible time: two hours after the last activity.
  const { time, sortOrder } = await nextSlot(db, planId, 2);

  await db.runAsync(
    `INSERT INTO plan_items (plan_id, place_id, time, title, subtitle, duration, color, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      planId,
      place.id,
      time,
      place.name,
      // Join the subtitle and the address with a dot, skipping whichever is
      // missing. .filter(Boolean) drops empty values before joining.
      [place.category, place.location].filter(Boolean).join(' · ') || null,
      '1h',
      place.color || '#1D2BEF',
      sortOrder,
    ]
  );

  return { ok: true };
}

// addBlankItem(planId) - the "+ Add activity" button: an empty row to edit.
export async function addBlankItem(planId) {
  const db = await getDb();
  if (!planId) return { ok: false, error: 'missingData' };

  // One hour after the last one, rather than two - a manual activity is
  // usually a short gap-filler.
  const { time, sortOrder } = await nextSlot(db, planId, 1);

  const result = await db.runAsync(
    `INSERT INTO plan_items (plan_id, place_id, time, title, subtitle, duration, color, sort_order)
     VALUES (?, NULL, ?, ?, ?, '1h', '#1D2BEF', ?)`,
    [planId, time, 'New activity', 'Tap to edit', sortOrder]
  );

  return { ok: true, id: result.lastInsertRowId };
}

// updatePlanItem({ itemId, ...fields }) - edit one activity.
//
// This is what makes the "Tap to edit" rows finally editable. The old app
// created them and then offered no way to change them.
export async function updatePlanItem({ itemId, time, title, subtitle, duration, color }) {
  const db = await getDb();

  const sets = [];
  const values = [];

  // `!== undefined` (not just a truthiness check) so that clearing a subtitle
  // to an empty string still counts as a change the user asked for.
  if (time !== undefined) {
    sets.push('time = ?');
    values.push(time);
  }
  if (title !== undefined) {
    const cleanTitle = (title || '').trim();
    if (cleanTitle.length < 1) return { ok: false, error: 'titleRequired' };
    sets.push('title = ?');
    values.push(cleanTitle);
  }
  if (subtitle !== undefined) {
    sets.push('subtitle = ?');
    values.push(subtitle || null);
  }
  if (duration !== undefined) {
    sets.push('duration = ?');
    values.push(duration || '1h');
  }
  if (color !== undefined) {
    sets.push('color = ?');
    values.push(color || '#1D2BEF');
  }

  if (sets.length === 0) return { ok: true };

  values.push(itemId);
  await db.runAsync(`UPDATE plan_items SET ${sets.join(', ')} WHERE id = ?`, values);
  return { ok: true };
}

// removePlanItem(itemId) - delete one activity.
export async function removePlanItem(itemId) {
  const db = await getDb();
  await db.runAsync('DELETE FROM plan_items WHERE id = ?', [itemId]);
  return { ok: true };
}

// clearPlanItems(planId) - the "Clear all" option.
//
// One statement instead of the old code's loop that fired a separate state
// update per row.
export async function clearPlanItems(planId) {
  const db = await getDb();
  await db.runAsync('DELETE FROM plan_items WHERE plan_id = ?', [planId]);
  return { ok: true };
}

// movePlanItem({ itemId, direction }) - reorder: 'up' or 'down'.
//
// How it works: find the neighbour in that direction, then swap the two
// sort_order values. Simple and reliable with small lists.
export async function movePlanItem({ itemId, direction }) {
  const db = await getDb();

  const item = await db.getFirstAsync(
    'SELECT id, plan_id AS planId, sort_order AS sortOrder FROM plan_items WHERE id = ?',
    [itemId]
  );
  if (!item) return { ok: false, error: 'notFound' };

  // Moving up means finding the largest sort_order that is still SMALLER than
  // ours; moving down means the smallest one that is LARGER.
  const comparison = direction === 'up' ? '<' : '>';
  const order = direction === 'up' ? 'DESC' : 'ASC';

  const neighbour = await db.getFirstAsync(
    `SELECT id, sort_order AS sortOrder FROM plan_items
     WHERE plan_id = ? AND sort_order ${comparison} ?
     ORDER BY sort_order ${order} LIMIT 1`,
    [item.planId, item.sortOrder]
  );

  // Already at the top or bottom - nothing to swap with.
  if (!neighbour) return { ok: true, moved: false };

  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE plan_items SET sort_order = ? WHERE id = ?', [
      neighbour.sortOrder,
      item.id,
    ]);
    await db.runAsync('UPDATE plan_items SET sort_order = ? WHERE id = ?', [
      item.sortOrder,
      neighbour.id,
    ]);
  });

  return { ok: true, moved: true };
}

// ---------------------------------------------------------------------------
// nextSlot(db, planId, hoursAfter) - suggest a time and position for a new row.
//
// Private helper. Looks at the last activity in the plan and offers a time a
// couple of hours later, capped at 22:00 so we never suggest 3 a.m.
// ---------------------------------------------------------------------------
async function nextSlot(db, planId, hoursAfter) {
  const last = await db.getFirstAsync(
    `SELECT time, sort_order AS sortOrder FROM plan_items
     WHERE plan_id = ? ORDER BY sort_order DESC LIMIT 1`,
    [planId]
  );

  // Empty plan -> start the day at 09:00 in first position.
  if (!last) return { time: '09:00', sortOrder: 0 };

  // Split '13:30' into the numbers 13 and 30.
  const [hours, minutes] = last.time.split(':').map(Number);

  // Math.min stops us going past 22:00.
  const nextHour = Math.min(hours + hoursAfter, 22);

  // padStart(2, '0') turns 9 into '09'. That leading zero is what lets us sort
  // times as plain text later.
  const time = `${String(nextHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return { time, sortOrder: last.sortOrder + 1 };
}

// ===========================================================================
// DURATION MATHS
// ===========================================================================

// totalMinutes(items) - add up every activity's duration.
//
// Durations are free text: '1h', '1h 30m', '45m'. The old code used a regex
// that REQUIRED an 'h', so '45m' was silently dropped from the day's total.
// This version handles hours, minutes, or both.
export function totalMinutes(items) {
  let total = 0;

  for (const item of items) {
    const text = item.duration || '';

    // Look for a number followed by h, and a number followed by m.
    const hoursMatch = text.match(/(\d+)\s*h/);
    const minutesMatch = text.match(/(\d+)\s*m/);

    // A bare number with no letter (someone typed "2") - treat it as hours.
    if (!hoursMatch && !minutesMatch) {
      const bare = parseInt(text, 10);
      if (!Number.isNaN(bare)) total += bare * 60;
      continue;
    }

    if (hoursMatch) total += Number(hoursMatch[1]) * 60;
    if (minutesMatch) total += Number(minutesMatch[1]);
  }

  return total;
}

// formatDuration(minutes) - turn 150 into '2h 30m' for display.
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);   // whole hours
  const rest = minutes % 60;                // leftover minutes
  if (hours === 0) return `${rest}m`;       // under an hour: just "45m"
  if (rest === 0) return `${hours}h`;       // exact hours: just "2h"
  return `${hours}h ${rest}m`;
}

// ===========================================================================
// ADMIN
// ===========================================================================

// listPlansForModeration(status) - public plans awaiting or under review.
export async function listPlansForModeration(status = 'pending') {
  const db = await getDb();

  const where =
    status === 'all' ? 'WHERE p.is_public = 1' : 'WHERE p.is_public = 1 AND p.status = ?';
  const values = status === 'all' ? [] : [status];

  return db.getAllAsync(
    `SELECT
       p.id, p.title, p.day_date AS dayDate, p.status,
       p.created_at AS createdAt,
       u.name  AS authorName,
       u.email AS authorEmail,
       (SELECT COUNT(*) FROM plan_items i WHERE i.plan_id = p.id) AS itemCount
     FROM plans p
     JOIN users u ON u.id = p.user_id
     ${where}
     ORDER BY p.created_at DESC`,
    values
  );
}

// listPublicPlans() - approved shared plans, for browsing other people's days.
export async function listPublicPlans() {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT
       p.id, p.title, p.day_date AS dayDate,
       u.name AS authorName,
       (SELECT COUNT(*) FROM plan_items i WHERE i.plan_id = p.id) AS itemCount
     FROM plans p
     JOIN users u ON u.id = p.user_id
     WHERE p.is_public = 1 AND p.status = 'approved'
     ORDER BY p.created_at DESC`
  );
}

// setPlanStatus({ planId, status }) - admin approves or hides a shared plan.
export async function setPlanStatus({ planId, status }) {
  const db = await getDb();
  if (!['approved', 'pending', 'hidden'].includes(status)) {
    return { ok: false, error: 'badStatus' };
  }
  await db.runAsync('UPDATE plans SET status = ? WHERE id = ?', [status, planId]);
  return { ok: true };
}

// countPlanStatuses() - badge numbers for the admin dashboard.
export async function countPlanStatuses() {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT status, COUNT(*) AS total FROM plans WHERE is_public = 1 GROUP BY status'
  );
  const counts = { approved: 0, pending: 0, hidden: 0 };
  for (const row of rows) counts[row.status] = row.total;
  return counts;
}
