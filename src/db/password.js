// ============================================================================
// db/password.js - STORING PASSWORDS SAFELY
//
// THE RULE: never save a password as-is. If someone ever reads the database
// file, they must not be able to see what anyone typed.
//
// So we do two things.
//
// 1) HASHING. A hash function takes text and produces a fixed-length scramble:
//        "admin123"  ->  "a1b2c3...ff"   (64 characters, always)
//    It only works one way. You cannot turn the scramble back into "admin123".
//    To check a login we scramble what the person just typed and compare the
//    two scrambles - we never need the original.
//
// 2) SALTING. Hashing alone is not enough, because the same password always
//    produces the same scramble. An attacker can pre-compute the scramble of
//    a million common passwords and just look yours up.
//    A "salt" is random text we invent per user and mix in before hashing:
//        hash(salt + password)
//    Now two users with the same password get completely different scrambles,
//    and the pre-computed tables are useless. The salt is not a secret - we
//    store it right next to the hash. Its whole job is just to be different.
//
// HONEST LIMITATION, worth saying out loud in the report:
// Real products use bcrypt or Argon2, which are deliberately SLOW so that
// guessing millions of passwords takes years. SHA-256 is fast, which makes it
// weaker against a determined attacker. We use it because it is what Expo
// ships with, it needs no server, and it is easy to explain. For a local
// demo database with no accounts of real value, that trade-off is fine.
// ============================================================================

import * as Crypto from 'expo-crypto';   // Expo's built-in cryptography helpers

// ---------------------------------------------------------------------------
// makeSalt() - invent a new random string.
//
// randomUUID() gives something like '3f2a9c1e-...-8b7d'. It is random enough
// for a salt and it comes free with expo-crypto, so we do not need extra code.
// ---------------------------------------------------------------------------
function makeSalt() {
  return Crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// scramble(salt, password) - the actual hashing step.
//
// digestStringAsync takes an algorithm and some text, and returns the scramble
// as a hex string. It is `async` because the phone does the work natively, so
// we must `await` the answer.
// ---------------------------------------------------------------------------
async function scramble(salt, password) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,   // which hashing algorithm to use
    salt + password                        // glue salt and password together first
  );
}

// ---------------------------------------------------------------------------
// hashPassword(plainPassword) - call this when someone SIGNS UP or CHANGES
// their password. Returns both values, and you save both on the user row.
//
//   const { hash, salt } = await hashPassword('mySecret');
// ---------------------------------------------------------------------------
export async function hashPassword(plainPassword) {
  const salt = makeSalt();                        // fresh random salt for this user
  const hash = await scramble(salt, plainPassword);
  return { hash, salt };
}

// ---------------------------------------------------------------------------
// verifyPassword(plainPassword, storedHash, storedSalt) - call this at LOGIN.
//
// We take the password just typed, scramble it with THAT USER'S saved salt,
// and check whether we land on the same scramble we stored at signup.
// Returns true (correct) or false (wrong password).
// ---------------------------------------------------------------------------
export async function verifyPassword(plainPassword, storedHash, storedSalt) {
  // A user row missing either value is broken data - refuse rather than crash.
  if (!storedHash || !storedSalt) return false;

  const attempt = await scramble(storedSalt, plainPassword);
  return attempt === storedHash;
}
