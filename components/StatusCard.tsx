import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { patientStatus } from '../constants/mockData';
import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

export function StatusCard() {
  const { colors, shadows } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, shadows.card]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>Patient status</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{patientStatus.name}</Text>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: colors.mutedSurface }] }>
          <MaterialCommunityIcons name="heart-pulse" size={24} color={colors.primary} />
        </View>
      </View>

      <View style={styles.metricsRow}>
        <Metric label="Heart" value={patientStatus.heartbeat} colors={colors} />
        <Metric label="Hydration" value={patientStatus.hydration} colors={colors} />
        <Metric label="Sleep" value={patientStatus.sleep} colors={colors} />
      </View>
    </View>
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
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
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
    marginBottom: 4,
  },
  name: {
    fontFamily: FONTS.bold,
    fontSize: 22,
  },
  iconWrap: {
    width: 52,
    height: 52,
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
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  metricLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    marginBottom: 6,
  },
  metricValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
  },
});