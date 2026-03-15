import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

export function CareScoreIndicator({ score }: { score: number }) {
  const { colors, shadows } = useAppTheme();
  const progress = useSharedValue(0);
  const cardScale = useSharedValue(0.92);

  useEffect(() => {
    cardScale.value = withSpring(1, { damping: 18, stiffness: 120 });
    progress.value = withTiming(score / 100, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [cardScale, progress, score]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(progress.value * 100, 8)}%`,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const completed = Math.round((score / 100) * 6);

  return (
    <Animated.View
      style={[styles.card, cardStyle, { backgroundColor: colors.card, borderColor: colors.border }, shadows.card]}
      accessibilityRole="summary"
      accessibilityLabel={`Care score is ${score} percent. ${completed} of 6 medicines taken today.`}
    >
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Medication tasks today</Text>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>Based on completed medication tasks today</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.scoreBadge }] }>
          <Text style={[styles.score, { color: colors.primary }]}>{score}%</Text>
        </View>
      </View>

      <Text style={[styles.statusLine, { color: colors.textPrimary }]}>{completed} of 6 medicines taken today</Text>

      <View style={[styles.track, { backgroundColor: colors.progressTrack }] }>
        <Animated.View style={[styles.fill, fillStyle, { backgroundColor: colors.primary }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  caption: {
    fontFamily: FONTS.regular,
    fontSize: 17,
    lineHeight: 27,
    marginTop: 6,
    maxWidth: 210,
  },
  badge: {
    width: 104,
    height: 104,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  score: {
    fontFamily: FONTS.bold,
    fontSize: 48,
    lineHeight: 56,
  },
  statusLine: {
    marginTop: 14,
    fontFamily: FONTS.medium,
    fontSize: 17,
    lineHeight: 27,
  },
  track: {
    height: 14,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
});