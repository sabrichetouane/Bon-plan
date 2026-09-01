// ============================================================================
// components/IconButton.js - THE ROUND ICON BUTTON, USED EVERYWHERE
//
// The app has ~13 small circular buttons: the back chevron, the heart, the
// bell, the share button, the map's locate button. They were written by hand
// on six different screens at 28, 38, 40 and 44 points.
//
// THE PROBLEM: anything under 44pt is hard to tap. Apple's guideline is 44pt,
// Google's is 48dp. A 28pt heart on a photo is genuinely fiddly.
//
// THE TRICK USED HERE: we do NOT make the circles bigger - that would change
// the design. Instead:
//   - the TouchableOpacity (the part that listens for taps) is an invisible
//     44x44 box
//   - the coloured circle is a normal View INSIDE it, still 38pt
// So it looks identical and the tap area is twice the size.
//
// Why not just use hitSlop? Because on Android, hit slop that reaches outside
// the parent view is thrown away. These buttons live inside tight 38pt-tall
// header rows, so the slop would be silently ignored - exactly where it is
// needed most. A real 44pt box always works.
// ============================================================================

import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, MIN_TAP } from '../theme/colors';

// ---------------------------------------------------------------------------
// Props:
//   name        Ionicons icon name, e.g. 'chevron-back'
//   size        icon size in points (default 20)
//   color       icon colour (defaults to the theme's main text colour)
//   onPress     what to run when tapped
//   diameter    the VISIBLE circle's width/height (default 38)
//   background  circle colour. Leave out for the theme's `surface` grey,
//               or pass 'transparent' / 'rgba(0,0,0,0.4)' for photo overlays.
//   style       styles for the invisible TAP BOX (use this to position it)
//   circleStyle extra styles for the visible circle
// ---------------------------------------------------------------------------
export default function IconButton({
  name,
  size = 20,
  color,
  onPress,
  diameter = 38,
  background,
  style,
  circleStyle,
  accessibilityLabel,
  disabled = false,
  ...rest
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.tap, style]}
      // These two tell screen readers (VoiceOver / TalkBack) that this is a
      // button and what it does. Costs one line, makes the app usable blind.
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || name}
      {...rest}
    >
      <View
        style={[
          styles.circle,
          // Size and roundness are computed, because the circle's radius must
          // always be exactly half its width to stay a perfect circle.
          { width: diameter, height: diameter, borderRadius: diameter / 2 },
          // Only override the background when the caller asked for one.
          background ? { backgroundColor: background } : null,
          circleStyle,
          // A pressed-but-disabled button should look inactive.
          disabled ? styles.disabled : null,
        ]}
      >
        <Ionicons name={name} size={size} color={color || colors.text} />
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    // The invisible tap box. minWidth/minHeight rather than width/height so a
    // caller can still stretch it if a design ever needs a wider target.
    tap: {
      minWidth: MIN_TAP,
      minHeight: MIN_TAP,
      alignItems: 'center',      // centre the circle horizontally
      justifyContent: 'center',  // centre it vertically
    },
    circle: {
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: { opacity: 0.4 },
  });
