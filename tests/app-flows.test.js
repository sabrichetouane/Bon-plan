// End-to-end test of the REAL repository code.
//
// It loads src/db/*.js exactly as written, but swaps two native modules for
// Node equivalents:
//   expo-sqlite -> a thin adapter over Node 22's built-in node:sqlite
//   expo-crypto -> node:crypto
// Everything else (the SQL, the validation, the moderation rules) is the
// actual app code, so a pass here means the app logic really works.
const path = require('path');
const fs = require('fs');
const Module = require('module');
const { DatabaseSync } = require('node:sqlite');
const nodeCrypto = require('node:crypto');

const ROOT = require('path').resolve(__dirname, '..');
process.chdir(ROOT);
const babel = require(ROOT + '/node_modules/@babel/core');

// --- one in-memory database shared by the whole run ------------------------
const raw = new DatabaseSync(':memory:');

// Adapter: give node:sqlite the same method names expo-sqlite uses.
const fakeDb = {
  async execAsync(sql) {
    raw.exec(sql);
  },
  async runAsync(sql, params = []) {
    const args = Array.isArray(params) ? params : [params];
    const r = raw.prepare(sql).run(...args);
    return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
  },
  async getFirstAsync(sql, params = []) {
    const args = Array.isArray(params) ? params : [params];
    return raw.prepare(sql).get(...args) ?? null;
  },
  async getAllAsync(sql, params = []) {
    const args = Array.isArray(params) ? params : [params];
    return raw.prepare(sql).all(...args);
  },
  // node:sqlite has no nested-transaction helper; running the task directly is
  // fine for a test, and the SQL inside is what we are checking.
  async withTransactionAsync(task) {
    await task();
  },
};

const stubs = {
  'expo-sqlite': { openDatabaseAsync: async () => fakeDb },
  'expo-crypto': {
    randomUUID: () => nodeCrypto.randomUUID(),
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: async (_algo, data) =>
      nodeCrypto.createHash('sha256').update(data).digest('hex'),
  },
};

// --- load the app's ES modules as CommonJS ---------------------------------
const cache = {};
function resolveFile(base) {
  // Imports are written without an extension, so try the bare path then .js.
  for (const candidate of [base, base + '.js', path.join(base, 'index.js')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  throw new Error('cannot resolve ' + base);
}

function load(file) {
  const abs = resolveFile(path.resolve(ROOT, file));
  if (cache[abs]) return cache[abs].exports;

  const code = fs.readFileSync(abs, 'utf8');
  const out = babel.transformSync(code, {
    filename: abs,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
    babelrc: false,
    configFile: false,
  }).code;

  const mod = { exports: {} };
  cache[abs] = mod;

  const localRequire = (spec) => {
    if (stubs[spec]) return stubs[spec];
    // Image requires return a number in the real app - the id Metro assigns.
    if (/\.(jpe?g|png|jfif)$/i.test(spec)) return 1;
    if (spec.startsWith('.')) return load(path.resolve(path.dirname(abs), spec));
    return require(spec);
  };

  new Module.wrap ? null : null;
  const fn = new Function('exports', 'require', 'module', '__filename', '__dirname', out);
  fn(mod.exports, localRequire, mod, abs, path.dirname(abs));
  return mod.exports;
}

// --- test helpers -----------------------------------------------------------
let pass = 0;
let fail = 0;
async function check(label, fn) {
  try {
    await fn();
    pass++;
    console.log('  PASS  ' + label);
  } catch (e) {
    fail++;
    console.log('  FAIL  ' + label + '  ::  ' + e.message);
  }
}
function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

(async () => {
  const database = load('src/db/database.js');
  const userRepo = load('src/db/userRepo.js');
  const placeRepo = load('src/db/placeRepo.js');
  const favoriteRepo = load('src/db/favoriteRepo.js');
  const commentRepo = load('src/db/commentRepo.js');
  const planRepo = load('src/db/planRepo.js');

  console.log('[1] startup: open, create tables, seed');
  await check('getDb() opens and seeds without error', async () => {
    await database.getDb();
  });
  await check('the 6 categories were seeded', async () => {
    const cats = await placeRepo.listCategories();
    expect(cats.length === 6, 'expected 6 categories, got ' + cats.length);
  });
  await check('the starter places were seeded and are approved', async () => {
    const places = await placeRepo.listPlaces({});
    expect(places.length >= 25, 'expected 25+ places, got ' + places.length);
  });
  await check('the Beach category finally has a place in it', async () => {
    const beach = await placeRepo.listPlaces({ categoryId: 'beach' });
    expect(beach.length > 0, 'Beach is still empty');
  });
  await check('Ichkeul and Cap Blanc are not duplicated', async () => {
    const nature = await placeRepo.listPlaces({ categoryId: 'nature' });
    const names = nature.map((p) => p.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dupes.length === 0, 'duplicate names in Nature: ' + dupes.join(', '));
  });

  console.log('[2] accounts: the flow that was broken');
  await check('the seeded admin can log in', async () => {
    const r = await userRepo.logIn({ email: 'admin@bonplan.tn', password: 'admin123' });
    expect(r.ok, 'admin login failed: ' + r.error);
    expect(r.user.role === 'admin', 'seeded account is not an admin');
  });

  let adminId;
  await check('the session persists (restoreSession finds the admin)', async () => {
    const u = await userRepo.restoreSession();
    expect(u && u.role === 'admin', 'no session restored');
    adminId = u.id;
  });

  let newUserId;
  await check('AN ADMIN CAN CREATE A USER  <- was impossible before', async () => {
    const r = await userRepo.createUser({
      name: 'Sabri',
      email: 'sabri@bonplan.tn',
      password: 'secret123',
      role: 'user',
    });
    expect(r.ok, 'createUser failed: ' + r.error);
    newUserId = r.user.id;
  });

  await check('creating a user does NOT log the admin out', async () => {
    const still = await userRepo.restoreSession();
    expect(still && still.id === adminId, 'the session changed - admin was logged out');
  });

  await check('an admin can be created directly with the admin role', async () => {
    const r = await userRepo.createUser({
      name: 'Second Admin',
      email: 'admin2@bonplan.tn',
      password: 'secret123',
      role: 'admin',
    });
    expect(r.ok, 'failed: ' + r.error);
    expect(r.user.role === 'admin', 'role was not applied');
  });

  await check('a duplicate email is refused', async () => {
    const r = await userRepo.createUser({
      name: 'Someone Else',
      email: 'sabri@bonplan.tn',
      password: 'secret123',
    });
    expect(!r.ok && r.error === 'emailTaken', 'expected emailTaken, got ' + JSON.stringify(r));
  });

  await check('a short password is refused', async () => {
    const r = await userRepo.createUser({ name: 'Valid Name', email: 'x@y.tn', password: '123' });
    expect(!r.ok && r.error === 'passwordTooShort', 'expected passwordTooShort');
  });

  await check('PROMOTING a user to admin works', async () => {
    const r = await userRepo.setUserRole({ userId: newUserId, role: 'admin' });
    expect(r.ok, 'setUserRole failed: ' + r.error);
    const u = await userRepo.findUserById(newUserId);
    expect(u.role === 'admin', 'role did not change');
  });

  await check('DEMOTING back to user works', async () => {
    const r = await userRepo.setUserRole({ userId: newUserId, role: 'user' });
    expect(r.ok, 'failed: ' + r.error);
    const u = await userRepo.findUserById(newUserId);
    expect(u.role === 'user', 'role did not change back');
  });

  await check('DELETING a user works', async () => {
    const before = (await userRepo.listUsers()).length;
    const r = await userRepo.deleteUser(newUserId);
    expect(r.ok, 'deleteUser failed: ' + r.error);
    const after = (await userRepo.listUsers()).length;
    expect(after === before - 1, 'user count did not drop');
  });

  await check('the LAST admin cannot be deleted', async () => {
    // Delete every admin EXCEPT the one we are logged in as, so adminId stays
    // valid for the rest of the run.
    const admins = (await userRepo.listUsers()).filter((u) => u.role === 'admin');
    for (const a of admins) {
      if (a.id !== adminId) await userRepo.deleteUser(a.id);
    }

    const count = await userRepo.countAdmins();
    expect(count === 1, 'expected exactly 1 admin, got ' + count);

    const r = await userRepo.deleteUser(adminId);
    expect(!r.ok && r.error === 'lastAdmin', 'the last admin was deletable');
  });

  await check('the last admin cannot be demoted either', async () => {
    const r = await userRepo.setUserRole({ userId: adminId, role: 'user' });
    expect(!r.ok && r.error === 'lastAdmin', 'the last admin was demotable');
  });

  await check('acting on a deleted account reports userNotFound', async () => {
    const r = await userRepo.setUserRole({ userId: 99999, role: 'admin' });
    expect(!r.ok && r.error === 'userNotFound', 'expected userNotFound, got ' + JSON.stringify(r));
    const d = await userRepo.deleteUser(99999);
    expect(!d.ok && d.error === 'userNotFound', 'delete of a missing user reported success');
  });

  console.log('[3] user submits a place, admin moderates it');
  let memberId;
  await check('a visitor signs up', async () => {
    const r = await userRepo.signUp({
      name: 'Amira',
      email: 'amira@bonplan.tn',
      password: 'secret123',
    });
    expect(r.ok, 'signUp failed: ' + r.error);
    memberId = r.user.id;
    expect(r.user.role === 'user', 'a self-registered user must not be an admin');
  });

  let pendingPlaceId;
  await check("a user's new place is PENDING, not visible to everyone", async () => {
    const r = await placeRepo.createPlace({
      name: 'Test Cafe Bizerte',
      categoryId: 'coffee',
      createdBy: memberId,
      isAdmin: false,
    });
    expect(r.ok, 'createPlace failed: ' + r.error);
    expect(r.status === 'pending', 'expected pending, got ' + r.status);
    pendingPlaceId = r.id;

    const publicList = await placeRepo.listPlaces({ categoryId: 'coffee' });
    expect(!publicList.some((p) => p.id === pendingPlaceId), 'a pending place is publicly visible');
  });

  await check('it shows in the admin queue', async () => {
    const queue = await placeRepo.listPlacesForModeration('pending');
    expect(queue.some((p) => p.id === pendingPlaceId), 'not in the pending queue');
    expect(queue.find((p) => p.id === pendingPlaceId).authorName === 'Amira', 'author name missing');
  });

  await check('the author can see it in "my places"', async () => {
    const mine = await placeRepo.listPlacesByUser(memberId);
    expect(mine.some((p) => p.id === pendingPlaceId), 'not in the author list');
  });

  await check('APPROVING it makes it public', async () => {
    const r = await placeRepo.setPlaceStatus({ id: pendingPlaceId, status: 'approved' });
    expect(r.ok, 'setPlaceStatus failed');
    const publicList = await placeRepo.listPlaces({ categoryId: 'coffee' });
    expect(publicList.some((p) => p.id === pendingPlaceId), 'still not visible after approval');
  });

  await check('HIDING it takes it back out', async () => {
    await placeRepo.setPlaceStatus({ id: pendingPlaceId, status: 'hidden' });
    const publicList = await placeRepo.listPlaces({ categoryId: 'coffee' });
    expect(!publicList.some((p) => p.id === pendingPlaceId), 'a hidden place is still visible');
  });

  await check("an ADMIN's own place is approved immediately", async () => {
    const r = await placeRepo.createPlace({
      name: 'Admin Added Place',
      categoryId: 'food',
      createdBy: adminId,
      isAdmin: true,
    });
    expect(r.status === 'approved', 'expected approved, got ' + r.status);
  });

  console.log('[4] favorites, reviews, plans');
  await check('favoriting works and survives a re-read', async () => {
    const on = await favoriteRepo.toggleFavorite(memberId, 'f1');
    expect(on === true, 'toggle did not turn on');
    const ids = await favoriteRepo.getFavoriteIds(memberId);
    expect(ids.has('f1'), 'not stored');
    const off = await favoriteRepo.toggleFavorite(memberId, 'f1');
    expect(off === false, 'toggle did not turn off');
  });

  await check("a review updates the place's star rating", async () => {
    const before = await placeRepo.getPlaceById('f1');
    const r = await commentRepo.addComment({
      userId: memberId,
      placeId: 'f1',
      rating: 5,
      text: 'Excellent food and great view.',
    });
    expect(r.ok, 'addComment failed: ' + r.error);

    const after = await placeRepo.getPlaceById('f1');
    expect(after.rating === 5, 'expected the average to become 5, got ' + after.rating);
    expect(after.reviews === 1, 'review count wrong: ' + after.reviews);
    expect(after.rating !== before.rating, 'rating did not change at all');
  });

  await check('one review per person - a second edits the first', async () => {
    await commentRepo.addComment({
      userId: memberId,
      placeId: 'f1',
      rating: 3,
      text: 'Changed my mind, it was fine.',
    });
    const list = await commentRepo.listComments('f1');
    expect(list.length === 1, 'expected 1 review, got ' + list.length);
    const place = await placeRepo.getPlaceById('f1');
    expect(place.rating === 3, 'rating did not follow the edit');
  });

  await check('an admin hiding a review removes it from the average', async () => {
    const list = await commentRepo.listComments('f1');
    await commentRepo.setCommentStatus({ commentId: list[0].id, status: 'hidden' });
    const place = await placeRepo.getPlaceById('f1');
    expect(place.reviews === 0, 'hidden review still counted: ' + place.reviews);
  });

  await check('a plan is created, filled, reordered and totalled', async () => {
    const plan = await planRepo.getOrCreateTodayPlan(memberId);
    expect(plan, 'no plan created');

    const place = await placeRepo.getPlaceById('f2');
    const add = await planRepo.addPlaceToPlan({ planId: plan.id, place });
    expect(add.ok, 'addPlaceToPlan failed: ' + add.error);

    const dupe = await planRepo.addPlaceToPlan({ planId: plan.id, place });
    expect(!dupe.ok && dupe.error === 'alreadyAdded', 'the same place was added twice');

    await planRepo.addBlankItem(plan.id);
    let items = await planRepo.listPlanItems(plan.id);
    expect(items.length === 2, 'expected 2 activities, got ' + items.length);

    // 45m must count - the old code silently dropped minutes-only durations.
    await planRepo.updatePlanItem({ itemId: items[1].id, duration: '45m' });
    items = await planRepo.listPlanItems(plan.id);
    const total = planRepo.totalMinutes(items);
    expect(total === 105, 'expected 60+45=105 minutes, got ' + total);

    const firstBefore = items[0].id;
    await planRepo.movePlanItem({ itemId: items[1].id, direction: 'up' });
    const after = await planRepo.listPlanItems(plan.id);
    expect(after[0].id !== firstBefore, 'reordering did nothing');
  });

  await check('sharing a plan sends it to the admin queue', async () => {
    const plans = await planRepo.listPlans(memberId);
    const r = await planRepo.setPlanVisibility({
      planId: plans[0].id,
      isPublic: true,
      isAdmin: false,
    });
    expect(r.status === 'pending', 'expected pending, got ' + r.status);

    const queue = await planRepo.listPlansForModeration('pending');
    expect(queue.length === 1, 'not in the moderation queue');

    const publicList = await planRepo.listPublicPlans();
    expect(publicList.length === 0, 'an unapproved plan is publicly visible');

    await planRepo.setPlanStatus({ planId: plans[0].id, status: 'approved' });
    expect((await planRepo.listPublicPlans()).length === 1, 'not public after approval');
  });

  console.log('[5] preferences persist');
  await check('language, theme and city are saved on the user row', async () => {
    await userRepo.savePreferences({
      userId: memberId,
      language: 'ar',
      themeMode: 'dark',
      city: 'Tunis',
    });
    const u = await userRepo.findUserById(memberId);
    expect(u.language === 'ar', 'language not saved');
    expect(u.themeMode === 'dark', 'theme not saved');
    expect(u.city === 'Tunis', 'city not saved');
  });

  await check('a wrong password is rejected, the right one accepted', async () => {
    const bad = await userRepo.logIn({ email: 'amira@bonplan.tn', password: 'wrong' });
    expect(!bad.ok && bad.error === 'badCredentials', 'a wrong password was accepted');
    const good = await userRepo.logIn({ email: 'amira@bonplan.tn', password: 'secret123' });
    expect(good.ok, 'the correct password was rejected');
  });

  await check('resetting a password lets the new one work', async () => {
    const r = await userRepo.resetPassword({
      email: 'amira@bonplan.tn',
      newPassword: 'brandnew123',
    });
    expect(r.ok, 'reset failed: ' + r.error);
    const login = await userRepo.logIn({ email: 'amira@bonplan.tn', password: 'brandnew123' });
    expect(login.ok, 'could not log in with the new password');
  });

  console.log('');
  console.log('RESULT: ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail === 0 ? 0 : 1);
})();
