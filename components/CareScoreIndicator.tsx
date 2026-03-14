import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

export function CareScoreIndicator({ score }: { score: number }) {
  const { colors, shadows } = useAppTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, score]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(progress.value * 100, 8)}%`,
  }));

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, shadows.card]}>
      <View style={styles.row}>
        <View>
          <Text style={[styles.label, { color: colors.textPrimary }]}>CareScore</Text>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>Based on completed medication tasks today</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.scoreBadge }] }>
          <Text style={[styles.score, { color: colors.primary }]}>{score}%</Text>
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: colors.progressTrack }] }>
        <Animated.View style={[styles.fill, fillStyle, { backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 19,
  },
  caption: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginTop: 4,
    maxWidth: 210,
  },
  badge: {
    width: 74,
    height: 74,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontFamily: FONTS.bold,
    fontSize: 20,
  },
  track: {
    height: 10,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: SPACING.md,
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
});