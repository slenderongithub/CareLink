import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

import { patientStatus } from '../constants/mockData';
import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

export function StatusCard() {
  const { colors, shadows } = useAppTheme();
  const cardScale = useSharedValue(0.92);

  useEffect(() => {
    cardScale.value = withSpring(1, { damping: 18, stiffness: 120 });
  }, [cardScale]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <Animated.View
      style={[styles.card, cardStyle, { backgroundColor: colors.card, borderColor: colors.border }, shadows.card]}
      accessibilityRole="summary"
      accessibilityLabel={`Patient status for ${patientStatus.name}. Heart ${patientStatus.heartbeat}, hydration ${patientStatus.hydration}, sleep ${patientStatus.sleep}.`}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>Patient status</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{patientStatus.name}</Text>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: colors.mutedSurface }] }>
          <MaterialCommunityIcons name="heart-pulse" size={28} color={colors.primary} />
        </View>
      </View>

      <View style={styles.metricsRow}>
        <Metric label="Heart" value={patientStatus.heartbeat} colors={colors} />
        <Metric label="Hydration" value={patientStatus.hydration} colors={colors} />
        <Metric label="Sleep" value={patientStatus.sleep} colors={colors} />
      </View>
    </Animated.View>
  );
}

function Metric({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View style={[styles.metricBox, { backgroundColor: colors.background }] }>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]} numberOfLines={1}>{label}</Text>
      <Text
        style={[styles.metricValue, { color: colors.textPrimary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  eyebrow: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  name: {
    fontFamily: FONTS.bold,
    fontSize: 28,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  metricBox: {
    flex: 1,
    minWidth: 90,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  metricLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  metricValue: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 24,
    flexShrink: 1,
  },
});