import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { WeeklyHealthData } from '../constants/mockData';
import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = Math.max(SCREEN_WIDTH - SPACING.md * 2 - 2, 260);

type TabKey = 'steps' | 'heartRate' | 'activityMinutes' | 'medicationAdherence';

type TabDefinition = {
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  unit: string;
};

const tabs: TabDefinition[] = [
  { key: 'steps', label: 'Steps', icon: 'shoe-print', color: '#00E676', unit: 'steps' },
  { key: 'heartRate', label: 'Heart', icon: 'heart-pulse', color: '#FF4C4C', unit: 'bpm' },
  { key: 'activityMinutes', label: 'Activity', icon: 'fire', color: '#FF9500', unit: 'min' },
  { key: 'medicationAdherence', label: 'Meds', icon: 'pill', color: '#5E5CE6', unit: '%' },
];

type Props = {
  data: WeeklyHealthData;
};

export function HealthGraphs({ data }: Props) {
  const { colors, isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('steps');

  const currentTab =
    tabs.find((tab) => tab.key === activeTab) ??
    ({
      key: 'steps',
      label: 'Steps',
      icon: 'shoe-print',
      color: '#00E676',
      unit: 'steps',
    } as TabDefinition);
  const points = data[activeTab];
  const labels = points.map((point) => point.label);
  const values = points.map((point) => point.value);
  const avg = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: () => currentTab.color,
    labelColor: () => colors.textSecondary,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: currentTab.color,
      fill: colors.card,
    },
    propsForBackgroundLines: {
      strokeDasharray: '4 4',
      stroke: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    },
    fillShadowGradientFrom: currentTab.color,
    fillShadowGradientFromOpacity: 0.25,
    fillShadowGradientTo: currentTab.color,
    fillShadowGradientToOpacity: 0,
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? `${tab.color}20` : 'transparent',
                  borderColor: active ? tab.color : colors.border,
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={16}
                color={active ? tab.color : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? tab.color : colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.summaryRow}>
        <Text style={[styles.avgValue, { color: colors.textPrimary }]}>
          {avg}
          <Text style={[styles.avgUnit, { color: colors.textSecondary }]}> {currentTab.unit}</Text>
        </Text>
        <Text style={[styles.avgLabel, { color: colors.textSecondary }]}>7-day avg</Text>
      </View>

      <View
        style={[
          styles.chartCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <LineChart
          data={{ labels, datasets: [{ data: values }] }}
          width={CHART_WIDTH}
          height={180}
          chartConfig={chartConfig}
          bezier
          withInnerLines
          withOuterLines={false}
          withHorizontalLabels
          withVerticalLabels
          style={styles.chart}
          fromZero={activeTab === 'medicationAdherence'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.sm,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  tabLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  avgValue: {
    fontFamily: FONTS.bold,
    fontSize: 28,
  },
  avgUnit: {
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  avgLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
  chartCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: RADIUS.md,
  },
});
