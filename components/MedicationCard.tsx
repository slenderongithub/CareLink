import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Medication } from '../constants/mockData';
import { AppColorPalette, FONTS, RADIUS, SHADOW, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

type MedicationCardProps = {
  medication: Medication;
  onTakeNow: (id: string) => void;
  mode?: 'dashboard' | 'list';
};

export function MedicationCard({ medication, onTakeNow, mode = 'list' }: MedicationCardProps) {
  const { colors, shadows } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const confirmationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTaken = medication.status === 'taken';
  const pressScale = useSharedValue(1);
  const ripple = useSharedValue(0);
  const completion = useSharedValue(isTaken ? 1 : 0);
  const cardEntry = useSharedValue(0);

  useEffect(() => {
    cardEntry.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) });
  }, [cardEntry]);

  useEffect(() => {
    completion.value = withTiming(isTaken ? 1 : 0, { duration: 380, easing: Easing.out(Easing.cubic) });
  }, [completion, isTaken]);

  useEffect(() => {
    return () => {
      if (confirmationTimeout.current) {
        clearTimeout(confirmationTimeout.current);
      }
    };
  }, []);

  const handlePress = () => {
    if (isTaken) {
      return;
    }

    pressScale.value = withSequence(withSpring(0.96), withSpring(1));
    ripple.value = 0;
    ripple.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    setShowConfirmation(true);
    onTakeNow(medication.id);
    if (confirmationTimeout.current) {
      clearTimeout(confirmationTimeout.current);
    }
    confirmationTimeout.current = setTimeout(() => setShowConfirmation(false), 1800);
  };

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardEntry.value,
    transform: [{ translateY: interpolate(cardEntry.value, [0, 1], [12, 0]) }],
    backgroundColor: completion.value > 0.5 ? colors.pendingSurface : colors.card,
    borderColor: completion.value > 0.5 ? colors.pendingBorder : 'transparent',
  }));

  const actionScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const pillIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - completion.value,
    transform: [{ scale: interpolate(completion.value, [0, 1], [1, 0.75]) }],
  }));

  const checkIconStyle = useAnimatedStyle(() => ({
    opacity: completion.value,
    transform: [{ scale: interpolate(completion.value, [0, 1], [0.7, 1]) }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ripple.value, [0, 1], [0.24, 0]),
    transform: [{ scale: interpolate(ripple.value, [0, 1], [0.1, 3.2]) }],
  }));

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      <View style={styles.topRow}>
        <View style={styles.iconSlot}>
          <Animated.View style={[styles.iconLayer, pillIconStyle]}>
            <MaterialCommunityIcons name="pill" size={20} color={colors.primary} />
          </Animated.View>
          <Animated.View style={[styles.iconLayer, styles.iconOverlay, checkIconStyle]}>
            <MaterialCommunityIcons name="check" size={20} color={colors.success} />
          </Animated.View>
        </View>

        <View style={styles.infoWrap}>
          <Text style={styles.name}>{medication.name}</Text>
          <Text style={styles.meta}>{medication.dosage} • {medication.time}</Text>
        </View>

        <View style={[styles.statusBadge, isTaken ? styles.badgeDone : styles.badgePending]}>
          <Text style={[styles.statusText, isTaken ? styles.badgeDoneText : styles.badgePendingText]}>
            {isTaken ? 'Taken' : 'Pending'}
          </Text>
        </View>
      </View>

      {mode === 'dashboard' ? null : <Text style={styles.listTime}>Scheduled for {medication.time}</Text>}

      <View style={styles.footerRow}>
        <Animated.View style={[styles.buttonShell, actionScaleStyle]}>
          <Pressable onPress={handlePress} style={[styles.button, isTaken ? styles.buttonDone : styles.buttonPending]}>
            {!isTaken && <Animated.View pointerEvents="none" style={[styles.ripple, rippleStyle]} />}
            <Text style={[styles.buttonText, isTaken ? styles.buttonTextDone : styles.buttonTextPending]}>
              {isTaken ? 'Completed' : 'Take Now'}
            </Text>
          </Pressable>
        </Animated.View>

        {showConfirmation || isTaken ? <Text style={styles.confirmationText}>Updated for family</Text> : <View />}
      </View>
    </Animated.View>
  );
}

function createStyles(colors: AppColorPalette, shadows: typeof SHADOW) {
  return StyleSheet.create({
    card: {
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      ...shadows.card,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconSlot: {
      width: 46,
      height: 46,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.mutedSurface,
      position: 'relative',
      overflow: 'hidden',
    },
    iconLayer: {
      position: 'absolute',
    },
    iconOverlay: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoWrap: {
      flex: 1,
      marginLeft: SPACING.md,
    },
    name: {
      fontFamily: FONTS.semiBold,
      fontSize: 17,
      color: colors.textPrimary,
    },
    meta: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      marginTop: 4,
      color: colors.textSecondary,
    },
    statusBadge: {
      borderRadius: RADIUS.full,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    badgePending: {
      backgroundColor: colors.pendingBadge,
    },
    badgeDone: {
      backgroundColor: colors.doneBadge,
    },
    statusText: {
      fontFamily: FONTS.medium,
      fontSize: 12,
    },
    badgePendingText: {
      color: colors.accent,
    },
    badgeDoneText: {
      color: colors.doneBadgeText,
    },
    listTime: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: SPACING.sm,
    },
    footerRow: {
      marginTop: SPACING.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    buttonShell: {
      borderRadius: RADIUS.full,
      overflow: 'hidden',
    },
    button: {
      borderRadius: RADIUS.full,
      paddingHorizontal: 18,
      paddingVertical: 11,
      overflow: 'hidden',
      position: 'relative',
    },
    buttonPending: {
      backgroundColor: colors.primary,
    },
    buttonDone: {
      backgroundColor: colors.doneBadge,
    },
    buttonText: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
    },
    buttonTextPending: {
      color: colors.white,
    },
    buttonTextDone: {
      color: colors.doneBadgeText,
    },
    ripple: {
      position: 'absolute',
      width: 110,
      height: 110,
      borderRadius: RADIUS.full,
      backgroundColor: '#A9ECE7',
      top: -38,
      left: -18,
    },
    confirmationText: {
      fontFamily: FONTS.medium,
      fontSize: 12,
      color: colors.primary,
      flexShrink: 1,
      textAlign: 'right',
    },
  });
}