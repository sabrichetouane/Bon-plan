// ============================================================================
// theme/rtl.js - RIGHT-TO-LEFT SUPPORT FOR ARABIC
//
// WHAT "RTL" MEANS:
// Arabic is written and read from RIGHT to LEFT. It is not only the text that
// flips - the whole layout mirrors. A back arrow points right instead of left,
// a row of icon-then-label becomes label-then-icon, and things that sat on the
// left edge move to the right edge. Think of holding the screen up to a mirror.
//
// WHY WE DO NOT USE I18nManager.forceRTL:
// React Native has a built-in switch, I18nManager.forceRTL(true), that mirrors
// everything automatically. It sounds perfect, but it only takes effect after
// the app is RESTARTED - so a user picking Arabic would see nothing change
// until they closed and reopened the app. In Expo Go it is unreliable on top
// of that. So we mirror things ourselves, which happens instantly.
//
// HOW TO USE IT:
//   const rtl = useRTL();
//
//   <View style={[styles.row, rtl.row]}>          // mirrors a horizontal row
//   <Text style={[styles.title, rtl.text]}>       // right-aligns the text
//   <Ionicons name={rtl.backIcon} />              // arrow points the right way
//
// Every helper returns an EMPTY object in English and French, so adding
// `rtl.row` to a style costs nothing at all when the language is left-to-right.
// ============================================================================

import { useStore } from '../store';

// The language codes that are written right to left. Only Arabic here, but
// Hebrew ('he') and Persian ('fa') would go in the same list.
const RTL_LANGUAGES = ['ar'];

// ---------------------------------------------------------------------------
// useRTL() - everything a component needs to mirror itself.
// ---------------------------------------------------------------------------
export function useRTL() {
  const { language } = useStore();

  // .includes() asks "is this language in the list?" -> true or false.
  const isRTL = RTL_LANGUAGES.includes(language);

  return {
    // The raw flag, for anything the helpers below do not cover.
    isRTL,

    // --- LAYOUT ---

    // Mirror a horizontal row. 'row-reverse' lays the children out from the
    // right instead of the left, so an icon-then-label row becomes
    // label-then-icon without touching the JSX.
    row: isRTL ? { flexDirection: 'row-reverse' } : null,

    // The opposite, for the rare row that must NOT mirror - a time like
    // "09:00" or a phone number reads left to right even in Arabic.
    rowFixed: isRTL ? { flexDirection: 'row' } : null,

    // --- TEXT ---

    // Right-align text, and tell the renderer the text runs right to left so
    // punctuation lands on the correct side. Without writingDirection, an
    // Arabic sentence ending in a full stop puts the stop on the wrong end.
    text: isRTL ? { textAlign: 'right', writingDirection: 'rtl' } : null,

    // For text that should stay centred in both directions (page titles).
    textCenter: isRTL ? { writingDirection: 'rtl' } : null,

    // --- ALIGNMENT ---

    // "Push this to the start of the line" - which is the LEFT in English and
    // the RIGHT in Arabic.
    alignStart: isRTL ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },

    // --- ICONS ---

    // A back arrow must point toward where you came from, which flips.
    backIcon: isRTL ? 'chevron-forward' : 'chevron-back',
    // A "go deeper" chevron flips the same way.
    forwardIcon: isRTL ? 'chevron-back' : 'chevron-forward',
    // An arrow inside a button ("continue", "open").
    arrowIcon: isRTL ? 'arrow-back' : 'arrow-forward',

    // --- SPACING ---

    // start(n) / end(n) give you margin on the correct side.
    // In English "start" is the left; in Arabic it is the right.
    // Use these instead of marginLeft / marginRight in a mirrored row.
    marginStart: (value) => (isRTL ? { marginRight: value } : { marginLeft: value }),
    marginEnd: (value) => (isRTL ? { marginLeft: value } : { marginRight: value }),
    paddingStart: (value) => (isRTL ? { paddingRight: value } : { paddingLeft: value }),
    paddingEnd: (value) => (isRTL ? { paddingLeft: value } : { paddingRight: value }),

    // A coloured bar down one edge of a card (the itinerary rows use one).
    borderStart: (width, color) =>
      isRTL
        ? { borderRightWidth: width, borderRightColor: color }
        : { borderLeftWidth: width, borderLeftColor: color },
  };
}

// ---------------------------------------------------------------------------
// isRTLLanguage(code) - the same test, without needing to be inside a
// component. Used by code that has the language code but no hooks available.
// ---------------------------------------------------------------------------
export function isRTLLanguage(code) {
  return RTL_LANGUAGES.includes(code);
}
