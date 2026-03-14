import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Activity } from '../constants/mockData';
import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

export function ActivityItem({ item, index }: { item: Activity; index: number }) {
  const { colors } = useAppTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const avatarScale = useSharedValue(0.85);

  useEffect(() => {
    const delay = index * 90;
    opacity.value = withDelay(delay, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) }));
    avatarScale.value = withDelay(delay + 60, withTiming(1, { duration: 260 }));
  }, [avatarScale, index, opacity, translateY]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  return (
    <Animated.View style={[styles.row, containerStyle]}>
      <View style={styles.timeline}>
        <Animated.View style={[styles.avatar, { backgroundColor: item.avatarColor }, avatarStyle]}>
          <Text style={styles.avatarText}>{item.user.slice(0, 1)}</Text>
        </Animated.View>
        <View style={[styles.line, { backgroundColor: colors.timeline }]} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.actionText, { color: colors.textPrimary }]}>
          <Text style={styles.userText}>{item.user}</Text> {item.action}
        </Text>
        <Text style={[styles.timeText, { color: colors.textSecondary }]}>{item.timestamp}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  timeline: {
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 6,
    minHeight: 26,
  },
  content: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: SPACING.md,
  },
  actionText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    fontFamily: FONTS.semiBold,
  },
  timeText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    marginTop: 6,
  },
});