// ============================================================================
// components/FormField.js - A LABELLED TEXT INPUT FOR FORMS
//
// The login, sign-up, reset-password, add-place and edit-profile screens all
// need the same thing: a label, a box to type in, and a red error message
// underneath when something is wrong. This is that.
//
// It matches the app's existing search bars (same grey `surface` background,
// same 12pt corner radius) so the new screens do not look bolted on.
//
// Includes a password "eye" toggle, because asking someone to type a password
// they cannot see, twice, on a phone keyboard, is how sign-up forms get
// abandoned.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing, hitSlopFor } from '../theme/colors';
import { useRTL } from '../theme/rtl';

// ---------------------------------------------------------------------------
// Props:
//   label        the text above the box
//   value        current text (from the screen's state)
//   onChangeText called on every keystroke
//   placeholder  grey hint inside the empty box
//   icon         optional Ionicons name shown on the left
//   error        a message to show in red; also turns the border red
//   secure       true -> hide the characters and show an eye toggle
//   keyboardType 'email-address' | 'phone-pad' | 'numeric' | 'default'
//   multiline    true -> a taller box for descriptions
//   hint         small grey helper text under the box (e.g. "at least 6 characters")
// ---------------------------------------------------------------------------
export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  secure = false,
  keyboardType = 'default',
  multiline = false,
  hint,
  style,
  ...rest
}) {
  const { colors } = useTheme();
  const rtl = useRTL();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Tracks whether the password is currently visible. Starts hidden.
  const [revealed, setRevealed] = useState(false);

  // The box should hide characters only when it IS a password field AND the
  // user has not asked to see it.
  const hideText = secure && !revealed;

  return (
    <View style={[styles.wrap, style]}>
      {/* The label above the box. */}
      {label ? <Text style={[styles.label, rtl.text]}>{label}</Text> : null}

      {/* The box itself. Its border turns red when `error` has a value. */}
      <View
        style={[
          styles.box,
          multiline && styles.boxMultiline,
          error && styles.boxError,
          rtl.row,
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={colors.textMuted} /> : null}

        <TextInput
          style={[styles.input, multiline && styles.inputMultiline, rtl.text]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hideText}
          keyboardType={keyboardType}
          multiline={multiline}
          // Emails and passwords must never be auto-capitalised - "Sabri@..."
          // would be a different account from "sabri@...".
          autoCapitalize={keyboardType === 'email-address' || secure ? 'none' : 'sentences'}
          autoCorrect={false}
          // Tells the phone's password manager what this field is for, so it
          // can offer to fill or save it.
          textContentType={secure ? 'password' : keyboardType === 'email-address' ? 'emailAddress' : 'none'}
          {...rest}
        />

        {/* The eye button, only on password fields. */}
        {secure ? (
          <TouchableOpacity
            onPress={() => setRevealed(!revealed)}   // flip true/false
            hitSlop={hitSlopFor(20)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Error wins over hint - never show both, it is noise. */}
      {error ? (
        <View style={[styles.errorRow, rtl.row]}>
          <Ionicons name="alert-circle" size={13} color={colors.danger} />
          <Text style={[styles.errorText, rtl.text]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[styles.hint, rtl.text]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    wrap: { marginBottom: spacing.lg },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      // minHeight, never height: the box must be able to grow when the phone's
      // text-size setting is turned up, or the typing is clipped.
      minHeight: 48,
    },
    boxMultiline: {
      minHeight: 110,
      alignItems: 'flex-start',   // put the icon and text at the TOP, not centred
      paddingVertical: spacing.md,
    },
    boxError: { borderColor: colors.danger },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      paddingVertical: 0,         // remove Android's extra built-in padding
    },
    inputMultiline: {
      textAlignVertical: 'top',   // Android: start typing at the top of the box
      minHeight: 84,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 6,
    },
    errorText: {
      color: colors.danger,
      fontSize: 12,
      flex: 1,          // let a long message wrap instead of overflowing
    },
    hint: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 6,
    },
  });
