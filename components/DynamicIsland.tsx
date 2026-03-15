import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

export interface DynamicIslandNotification {
  id: string;
  type: 'medication' | 'heart' | 'step' | 'appointment' | 'voice';
  title: string;
  subtitle: string;
  message: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  timestamp?: string;
}

interface DynamicIslandProps {
  notification?: DynamicIslandNotification;
  onConfirm?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

const COLLAPSED_WIDTH = 188;
const COLLAPSED_HEIGHT = 38;
const EXPANDED_HEIGHT = 260;
const BUTTON_HEIGHT = 60;

const DEFAULT_NOTIFICATION: DynamicIslandNotification = {
  id: '1',
  type: 'medication',
  title: 'Medication Reminder',
  subtitle: 'Vitamin D3 (2000 IU)',
  message: 'Time to take your medication.',
  icon: 'pill',
  color: '',
  timestamp: 'Just now',
};

export const DynamicIsland = ({
  notification: notificationProp = DEFAULT_NOTIFICATION,
  onConfirm,
  onDismiss,
}: DynamicIslandProps) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const expandedWidth = screenWidth - 40;

  const notification = {
    ...notificationProp,
    color: notificationProp.color || colors.primary,
  };
  const compactLabel = (() => {
    if (notification.subtitle.length <= 22) {
      return notification.subtitle;
    }

    if (notification.type === 'voice') {
      return 'New voice message';
    }

    return '3 medicines due';
  })();
  const confirmButtonLabel = notification.type === 'voice' ? 'HEARD' : 'YES';
  const dismissButtonLabel = notification.type === 'voice' ? 'LATER' : 'NO';
  const confirmA11yLabel = notification.type === 'voice' ? 'Mark voice message as heard' : 'Yes, medication taken';
  const confirmA11yHint =
    notification.type === 'voice' ? 'Marks this voice update as heard and dismisses it' : 'Confirms medication was taken';
  const dismissA11yLabel = notification.type === 'voice' ? 'Remind me about voice message later' : 'No, skip medication';
  const dismissA11yHint =
    notification.type === 'voice'
      ? 'Dismisses this voice update for now'
      : 'Dismisses this reminder';

  const [expanded, setExpanded] = useState(false);
  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (!expanded) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.06, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(withTiming(0.6, { duration: 800 }), withTiming(0.25, { duration: 800 })),
        -1,
        true
      );
    } else {
      cancelAnimation(pulse);
      cancelAnimation(glowOpacity);
      pulse.value = withTiming(1, { duration: 200 });
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [expanded, glowOpacity, pulse]);

  const toggleExpand = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    progress.value = withSpring(next ? 1 : 0, {
      damping: 18,
      stiffness: 130,
      mass: 0.9,
    });
  }, [expanded, progress]);

  const handleConfirm = useCallback(() => {
    onConfirm?.(notification.id);
    setExpanded(false);
    progress.value = withSpring(0, { damping: 20, stiffness: 150 });
  }, [notification.id, onConfirm, progress]);

  const handleDismiss = useCallback(() => {
    onDismiss?.(notification.id);
    setExpanded(false);
    progress.value = withSpring(0, { damping: 20, stiffness: 150 });
  }, [notification.id, onDismiss, progress]);

  const islandStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [COLLAPSED_WIDTH, expandedWidth], Extrapolation.CLAMP),
    height: interpolate(progress.value, [0, 1], [COLLAPSED_HEIGHT, EXPANDED_HEIGHT], Extrapolation.CLAMP),
    borderRadius: interpolate(progress.value, [0, 1], [COLLAPSED_HEIGHT / 2, 36], Extrapolation.CLAMP),
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    borderRadius: interpolate(
      progress.value,
      [0, 1],
      [COLLAPSED_HEIGHT / 2 + 6, 42],
      Extrapolation.CLAMP
    ),
  }));

  const expandedContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(progress.value, [0.5, 1], [12, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const collapsedContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(progress.value, [0, 0.4], [1, 0.6], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <View style={[styles.container, { top: Math.max(insets.top - 18, 6) }]} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: notification.color,
            width: COLLAPSED_WIDTH + 12,
            height: COLLAPSED_HEIGHT + 12,
          },
          glowStyle,
        ]}
        pointerEvents="none"
      />

      <Pressable
        onPress={toggleExpand}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Collapse notification' : `${notification.title}: ${notification.subtitle}`}
        accessibilityHint="Expands notification actions"
      >
        <Animated.View
          style={[
            styles.island,
            {
              backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : colors.background,
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
            },
            islandStyle,
          ]}
        >
          <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

          <Animated.View style={[styles.collapsedContent, collapsedContentStyle]} pointerEvents={expanded ? 'none' : 'auto'}>
            <MaterialCommunityIcons name={notification.icon} size={20} color={notification.color} />
            <Text style={[styles.collapsedLabel, { color: colors.textPrimary }]} numberOfLines={1}>
              {compactLabel}
            </Text>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
          </Animated.View>

          {expanded ? (
            <Animated.View style={[styles.expandedContent, expandedContentStyle]}>
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: `${notification.color}25` }]}>
                  <MaterialCommunityIcons name={notification.icon} size={28} color={notification.color} />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={[styles.title, { color: colors.textPrimary }]}>{notification.title}</Text>
                  <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                    {notification.timestamp ?? 'Just now'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.subtitle, { color: colors.textPrimary }]}>{notification.subtitle}</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>{notification.message}</Text>

              <View style={styles.buttonRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    { backgroundColor: colors.successButton },
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleConfirm}
                  accessibilityRole="button"
                  accessibilityLabel={confirmA11yLabel}
                  accessibilityHint={confirmA11yHint}
                >
                  <MaterialCommunityIcons name="check-bold" size={24} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>{confirmButtonLabel}</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    { backgroundColor: colors.dangerButton },
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleDismiss}
                  accessibilityRole="button"
                  accessibilityLabel={dismissA11yLabel}
                  accessibilityHint={dismissA11yHint}
                >
                  <MaterialCommunityIcons name="close-thick" size={24} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>{dismissButtonLabel}</Text>
                </Pressable>
              </View>
            </Animated.View>
          ) : null}
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
  },
  island: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 14,
  },
  collapsedContent: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  collapsedLabel: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    maxWidth: 128,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  expandedContent: {
    width: '100%',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm + 4,
    paddingBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
  },
  timestamp: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginTop: 4,
  },
  message: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    lineHeight: 26,
    marginTop: 4,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
  },
  actionButton: {
    flex: 1,
    height: BUTTON_HEIGHT,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
});
