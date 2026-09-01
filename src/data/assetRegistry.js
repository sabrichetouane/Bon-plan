// ============================================================================
// data/assetRegistry.js - THE BRIDGE BETWEEN THE DATABASE AND THE PHOTOS
//
// WHY THIS FILE EXISTS (important, read once):
// In React Native, require('../../assets/x.jpg') does NOT return a file path.
// It returns a NUMBER - an id that Metro (the bundler) assigns to that image
// while it is packaging the app. Those require() calls must be written out in
// full, as literal text, because Metro reads the source code to find them; it
// cannot follow a variable.
//
// That is a problem for us, because a database can only store text and numbers,
// not require() calls. So we do this:
//   - This file lists EVERY photo once, under a short text key ('real/oldport-1').
//   - The database stores only that short text key.
//   - resolveImage() below turns the key back into something <Image> understands.
//
// GENERATED FILE - rebuilt by .gen-registry.js. Add new photos to
// assets/home/real/ and re-run that script rather than editing by hand.
// ============================================================================

// The lookup table: key -> the number Metro gave that image.
export const ASSETS = {
  'home/470760487_2677374602652284_6584161250614293894_n': require('../../assets/home/470760487_2677374602652284_6584161250614293894_n.jpg'),
  'home/480033524_1184531449702417_2425047782986088732_n': require('../../assets/home/480033524_1184531449702417_2425047782986088732_n.jpg'),
  'home/481700274_1195819481906947_8557298988534810114_n': require('../../assets/home/481700274_1195819481906947_8557298988534810114_n.jpg'),
  'home/482051711_1198390724983156_8248307771360353008_n': require('../../assets/home/482051711_1198390724983156_8248307771360353008_n.jpg'),
  'home/483932742_2742752259447851_157359218553575050_n': require('../../assets/home/483932742_2742752259447851_157359218553575050_n.jpg'),
  'home/65571089_1060525264337234_5069005838228652032_n': require('../../assets/home/65571089_1060525264337234_5069005838228652032_n.jpg'),
  'home/images': require('../../assets/home/images.jfif'),
  'home/WhatsApp-Image-2024-01-18-at-17.41.12-e1706260942824': require('../../assets/home/WhatsApp-Image-2024-01-18-at-17.41.12-e1706260942824.jpeg'),
  'real/bedouin-1': require('../../assets/home/real/bedouin-1.jpg'),
  'real/bestvoice-1': require('../../assets/home/real/bestvoice-1.jpg'),
  'real/bestvoicecafe-1': require('../../assets/home/real/bestvoicecafe-1.jpg'),
  'real/bizertestore-1': require('../../assets/home/real/bizertestore-1.jpg'),
  'real/cafe-1': require('../../assets/home/real/cafe-1.jpg'),
  'real/cafe-2': require('../../assets/home/real/cafe-2.jpg'),
  'real/cafe-3': require('../../assets/home/real/cafe-3.jpg'),
  'real/cafe-4': require('../../assets/home/real/cafe-4.jpg'),
  'real/cafe-5': require('../../assets/home/real/cafe-5.jpg'),
  'real/capblanc-1': require('../../assets/home/real/capblanc-1.jpg'),
  'real/capblanc-2': require('../../assets/home/real/capblanc-2.jpg'),
  'real/capblanc-3': require('../../assets/home/real/capblanc-3.jpg'),
  'real/centrebizerte-1': require('../../assets/home/real/centrebizerte-1.jpg'),
  'real/corniche-1': require('../../assets/home/real/corniche-1.jpg'),
  'real/corniche-2': require('../../assets/home/real/corniche-2.jpg'),
  'real/corniche-3': require('../../assets/home/real/corniche-3.jpg'),
  'real/crockin-1': require('../../assets/home/real/crockin-1.jpg'),
  'real/dinapoli-1': require('../../assets/home/real/dinapoli-1.jpg'),
  'real/elksiba-1': require('../../assets/home/real/elksiba-1.jpg'),
  'real/foretbleue-1': require('../../assets/home/real/foretbleue-1.jpg'),
  'real/gloricia-1': require('../../assets/home/real/gloricia-1.jpg'),
  'real/goldenlounge-1': require('../../assets/home/real/goldenlounge-1.jpg'),
  'real/grandbleu-1': require('../../assets/home/real/grandbleu-1.jpg'),
  'real/grotte-1': require('../../assets/home/real/grotte-1.jpg'),
  'real/grotte-2': require('../../assets/home/real/grotte-2.jpg'),
  'real/grotte-3': require('../../assets/home/real/grotte-3.jpg'),
  'real/habizerte-1': require('../../assets/home/real/habizerte-1.jpg'),
  'real/ichkeul-1': require('../../assets/home/real/ichkeul-1.jpg'),
  'real/ichkeul-2': require('../../assets/home/real/ichkeul-2.jpg'),
  'real/ichkeul-3': require('../../assets/home/real/ichkeul-3.jpg'),
  'real/juicebox-1': require('../../assets/home/real/juicebox-1.jpg'),
  'real/jumanji-1': require('../../assets/home/real/jumanji-1.jpg'),
  'real/kasbah-1': require('../../assets/home/real/kasbah-1.jpg'),
  'real/kasbah-2': require('../../assets/home/real/kasbah-2.jpg'),
  'real/laplaya-1': require('../../assets/home/real/laplaya-1.jpg'),
  'real/lcwaikiki-1': require('../../assets/home/real/lcwaikiki-1.jpg'),
  'real/lequai-1': require('../../assets/home/real/lequai-1.jpg'),
  'real/lequailounge-1': require('../../assets/home/real/lequailounge-1.jpg'),
  'real/lesgrottes-1': require('../../assets/home/real/lesgrottes-1.jpg'),
  'real/marineclub-1': require('../../assets/home/real/marineclub-1.jpg'),
  'real/marqualuxe-1': require('../../assets/home/real/marqualuxe-1.jpg'),
  'real/mosque-1': require('../../assets/home/real/mosque-1.jpg'),
  'real/mosque-2': require('../../assets/home/real/mosque-2.jpg'),
  'real/oldport-1': require('../../assets/home/real/oldport-1.jpg'),
  'real/oldport-2': require('../../assets/home/real/oldport-2.jpg'),
  'real/oldport-3': require('../../assets/home/real/oldport-3.jpg'),
  'real/oldportnight-1': require('../../assets/home/real/oldportnight-1.jpg'),
  'real/phenicien-1': require('../../assets/home/real/phenicien-1.jpg'),
  'real/piccolino-1': require('../../assets/home/real/piccolino-1.jpg'),
  'real/restaurant-1': require('../../assets/home/real/restaurant-1.jpg'),
  'real/restaurant-2': require('../../assets/home/real/restaurant-2.jpg'),
  'real/restaurant-3': require('../../assets/home/real/restaurant-3.jpg'),
  'real/restaurant-4': require('../../assets/home/real/restaurant-4.jpg'),
  'real/restaurant-5': require('../../assets/home/real/restaurant-5.jpg'),
  'real/rimel-1': require('../../assets/home/real/rimel-1.jpg'),
  'real/rimel-2': require('../../assets/home/real/rimel-2.jpg'),
  'real/rimel-3': require('../../assets/home/real/rimel-3.jpg'),
  'real/shop-1': require('../../assets/home/real/shop-1.jpg'),
  'real/shop-2': require('../../assets/home/real/shop-2.jpg'),
  'real/shop-3': require('../../assets/home/real/shop-3.jpg'),
  'real/shop-4': require('../../assets/home/real/shop-4.jpg'),
  'real/shop-5': require('../../assets/home/real/shop-5.jpg'),
  'real/sistore-1': require('../../assets/home/real/sistore-1.jpg'),
  'real/vog-1': require('../../assets/home/real/vog-1.jpg'),
};

// ---------------------------------------------------------------------------
// resolveImage(value) - turn whatever the database stored into an <Image> source
//
// The database can hold three kinds of value, and this handles all three:
//   1. 'real/oldport-1'          a key from the ASSETS table above (bundled photo)
//   2. 'https://...' or 'file://...'  a real URL or a photo the user picked
//   3. null / unknown            nothing to show
//
// Usage in a screen:   <Image source={resolveImage(place.image)} />
// ---------------------------------------------------------------------------
export function resolveImage(value) {
  // Nothing stored -> return undefined; <Image> just renders its background color.
  if (!value) return undefined;

  // Already a number? Then it is a require() result someone passed in directly.
  if (typeof value === 'number') return value;

  // A web address or a file on the phone -> <Image> wants { uri: '...' }.
  if (value.startsWith('http') || value.startsWith('file:') || value.startsWith('data:')) {
    return { uri: value };
  }

  // Otherwise treat it as a key into ASSETS. If the key is unknown we return
  // undefined rather than crashing - a missing photo should never break a screen.
  return ASSETS[value];
}

// ---------------------------------------------------------------------------
// hasAsset(key) - true if this key exists in the table above.
// Handy when validating a photo choice before saving it to the database.
// ---------------------------------------------------------------------------
export function hasAsset(key) {
  return typeof key === 'string' && key in ASSETS;
}

// ---------------------------------------------------------------------------
// listAssetKeys(prefix) - every key, optionally only those starting with a
// prefix like 'real/'. Used by the "pick a photo" grid on the Add place screen,
// which lets a user choose from the photos already bundled with the app.
// ---------------------------------------------------------------------------
export function listAssetKeys(prefix = '') {
  return Object.keys(ASSETS).filter((key) => key.startsWith(prefix));
}
