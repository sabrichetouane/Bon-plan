// ============================================================================
// theme/mapStyle.js - THE DARK VERSION OF THE MAP
//
// WHY THIS EXISTS:
// The app has a dark mode, but the MAP does not follow it on its own. The map
// tiles come from Google/Apple, not from us, so switching the app to dark used
// to leave a blazing white map surrounded by dark chrome.
//
// Google Maps accepts a "style array" that recolours the map. Each entry says:
//   featureType - what to recolour (roads, water, parks, labels...)
//   elementType - which part of it (the shape itself, its label, its outline)
//   stylers     - the change to apply (a colour, or hiding it entirely)
//
// This is passed to <MapView customMapStyle={...} /> in MapScreen.js.
//
// NOTE: customMapStyle only affects Google Maps (so: Android, and iOS if you
// choose the Google provider). On Apple Maps it is ignored, and iOS follows
// the system appearance by itself - which is the behaviour we want anyway.
//
// The colours below are taken from darkColors in theme/colors.js so the map
// matches the rest of the app rather than being a generic dark theme.
// ============================================================================

export const DARK_MAP_STYLE = [
  // The overall background - same near-black as the app's `background`.
  { elementType: 'geometry', stylers: [{ color: '#0B0C14' }] },

  // Label text: light grey, with a dark outline so it stays readable over
  // any colour underneath.
  { elementType: 'labels.text.fill', stylers: [{ color: '#B5B8C7' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0C14' }] },

  // Hide the little business icons. On a dark map they compete with OUR
  // markers, which are the whole point of the screen.
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },

  // Parks and green spaces - a dark green, still recognisable as nature.
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#14261A' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#5A7A63' }] },

  // Roads: a touch lighter than the background so the street grid reads.
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A1C28' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#14161F' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#7A7F93' }] },

  // Main roads slightly lighter again, so the hierarchy survives.
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#22243180' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#262937' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1E2030' }] },

  // Transit lines, dimmed.
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#14161F' }] },

  // The sea. Bizerte is a coastal city, so this is most of the screen - it
  // uses the app's dark blue-grey rather than a flat black.
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0A1020' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3C4560' }] },

  // Administrative boundaries (governorate, city limits).
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#262937' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#9AA0B4' }] },

  // Built-up land, a shade above the background.
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#101220' }] },
];
