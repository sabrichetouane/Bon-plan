// ============================================================================
// media/photoStorage.js - TAKING AND KEEPING THE USER'S OWN PHOTOS
//
// Until now a new place could only reuse a photo that already shipped with the
// app, which meant two different restaurants could end up with the same
// picture. This file lets a user pick a real photo from their phone, or take
// one with the camera, and keeps it for good.
//
// WHY COPYING THE FILE MATTERS (the part that is easy to get wrong):
// When you pick a photo, the picker does NOT give you the original in the photo
// library. It gives you a path into a CACHE folder - a scratch area the phone
// is free to empty whenever it needs space. If we saved that path in the
// database, the photo would work today and be a grey box next week.
//
// So every picked photo is COPIED into the app's own documents folder first,
// and it is that permanent path we store. The documents folder is backed up
// and is never cleared behind our back.
//
// WHAT GOES IN THE DATABASE: a 'file:///.../place-photos/xyz.jpg' string.
// resolveImage() in data/assetRegistry.js already understands file:// URIs, so
// the rest of the app needs no changes at all.
// ============================================================================

import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';

// The folder inside the app's private storage where we keep place photos.
const FOLDER_NAME = 'place-photos';

// ---------------------------------------------------------------------------
// getFolder() - the permanent folder, created the first time it is needed.
// ---------------------------------------------------------------------------
function getFolder() {
  // Paths.document is the app's private documents folder. Unlike the cache, the
  // system never empties it.
  const folder = new Directory(Paths.document, FOLDER_NAME);

  // `intermediates: true` also creates any missing parent folders instead of
  // failing. Creating a folder that already exists would throw, hence the check.
  if (!folder.exists) folder.create({ intermediates: true });

  return folder;
}

// ---------------------------------------------------------------------------
// makeFileName(sourceUri) - a name no other photo can collide with.
//
// Two photos picked in the same second must not overwrite each other, so the
// name mixes the time with a random tail.
// ---------------------------------------------------------------------------
function makeFileName(sourceUri) {
  // Keep the original extension so the phone still knows it is a JPEG or a PNG.
  // The regex looks for a dot followed by 3-4 letters at the very end.
  const match = /\.([a-zA-Z0-9]{3,4})$/.exec(sourceUri || '');
  const extension = match ? match[1].toLowerCase() : 'jpg';

  const stamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `p-${stamp}-${random}.${extension}`;
}

// ---------------------------------------------------------------------------
// savePermanently(temporaryUri) - copy a picked photo into our own folder.
// Returns the permanent 'file://...' path to store in the database.
// ---------------------------------------------------------------------------
export function savePermanently(temporaryUri) {
  const folder = getFolder();

  const source = new File(temporaryUri);
  const destination = new File(folder, makeFileName(temporaryUri));

  // .copy() duplicates the bytes into our folder. The original stays where it
  // was - we are not moving the user's photo out of their library.
  source.copy(destination);

  return destination.uri;
}

// ---------------------------------------------------------------------------
// deletePhoto(uri) - remove a photo file we previously saved.
//
// Only touches files inside OUR folder. A bundled photo key like
// 'real/oldport-1' or a photo still in the phone's library is left alone.
// ---------------------------------------------------------------------------
export function deletePhoto(uri) {
  // Not one of ours -> nothing to do.
  if (!uri || typeof uri !== 'string') return;
  if (!uri.startsWith('file:')) return;
  if (!uri.includes(FOLDER_NAME)) return;

  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    // A missing file is not worth interrupting the user for - the goal was for
    // it to be gone, and it is.
    console.warn('[photoStorage] could not delete', uri, error);
  }
}

// ---------------------------------------------------------------------------
// pickFromLibrary({ limit }) - open the phone's photo library.
//
// Returns an ARRAY of permanent uris (empty if the user cancelled or said no
// to the permission prompt).
// ---------------------------------------------------------------------------
export async function pickFromLibrary({ limit = 4 } = {}) {
  // Ask for permission first. The phone shows its own dialog; if the user has
  // already answered, this returns the saved answer without asking again.
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { ok: false, error: 'permissionDenied' };

  const result = await ImagePicker.launchImageLibraryAsync({
    // Photos only - a video would not display in an <Image>.
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    // 0.7 is a good trade: clearly sharp on a phone screen, but roughly a
    // quarter of the file size of the original. These are stored on the device.
    quality: 0.7,
  });

  // The user backed out.
  if (result.canceled) return { ok: true, uris: [] };

  // Copy each pick out of the cache into our permanent folder.
  const uris = result.assets.map((asset) => savePermanently(asset.uri));
  return { ok: true, uris };
}

// ---------------------------------------------------------------------------
// takePhoto() - open the camera and keep the shot.
// ---------------------------------------------------------------------------
export async function takePhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { ok: false, error: 'permissionDenied' };

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    // A square-ish crop step, so a hurried photo still frames the place well.
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });

  if (result.canceled) return { ok: true, uris: [] };

  return { ok: true, uris: [savePermanently(result.assets[0].uri)] };
}

// ---------------------------------------------------------------------------
// isUserPhoto(value) - true when this is a photo the user added, rather than
// one of the pictures bundled with the app.
//
// Used before deleting: we must never try to delete a bundled asset.
// ---------------------------------------------------------------------------
export function isUserPhoto(value) {
  return typeof value === 'string' && value.startsWith('file:') && value.includes(FOLDER_NAME);
}
