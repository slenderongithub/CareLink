import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ActivityItem } from '../components/ActivityItem';
import { CareScoreIndicator } from '../components/CareScoreIndicator';
import { MedicationCard } from '../components/MedicationCard';
import { ScreenContainer } from '../components/ScreenContainer';
import { StatusCard } from '../components/StatusCard';
import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useCareData } from '../hooks/useCareData';

export function DashboardScreen() {
  const { colors, shadows, mode, toggleMode } = useAppTheme();
  const { activities, appointments, careScore, medications, takeMedication, logCheckIn, logVoiceUpdate } =
    useCareData();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const recentMedications = medications.slice(0, 3);
  const recentActivities = activities.slice(0, 3);

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>Good Evening</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>CareLink keeps everyone aligned around today’s care.</Text>
        </View>
        <TouchableOpacity style={[styles.modeToggle, { backgroundColor: colors.card }, shadows.card]} onPress={toggleMode} activeOpacity={0.85}>
          <MaterialCommunityIcons
            name={mode === 'dark' ? 'weather-sunny' : 'weather-night'}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <StatusCard />

      <Animated.View style={[styles.alertCard, pulseStyle, { backgroundColor: colors.alertSurface }, shadows.card]}>
        <View style={styles.alertHeader}>
          <View>
            <Text style={[styles.alertEyebrow, { color: colors.accent }]}>Emergency readiness</Text>
            <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>Fall detection alert is active</Text>
          </View>
          <MaterialCommunityIcons name="shield-alert-outline" size={24} color={colors.accent} />
        </View>
        <Text style={[styles.alertText, { color: colors.textSecondary }]}>Family notifications are enabled for urgent health events.</Text>
      </Animated.View>

      <CareScoreIndicator score={careScore} />

      <SectionHeader title="Today's medications" detail={`${medications.filter((m) => m.status === 'taken').length}/${medications.length} completed`} />
      <View style={styles.sectionStack}>
        {recentMedications.map((medication) => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            onTakeNow={takeMedication}
            mode="dashboard"
          />
        ))}
      </View>

      <SectionHeader title="Upcoming appointments" />
      <View style={styles.sectionStack}>
        {appointments.map((appointment) => (
          <View key={appointment.id} style={styles.appointmentCard}>
            <View style={[styles.appointmentIcon, { backgroundColor: colors.mutedSurface }]}>
              <MaterialCommunityIcons name="calendar-clock" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.appointmentTitle, { color: colors.textPrimary }]}>{appointment.title}</Text>
              <Text style={[styles.appointmentTime, { color: colors.textSecondary }]}>{appointment.time}</Text>
            </View>
          </View>
        ))}
      </View>

      <SectionHeader title="Recent family activity" detail="Live feed" />
      <View style={[styles.activityWrap, { backgroundColor: colors.card }, shadows.card]}>
        {recentActivities.map((item, index) => (
          <ActivityItem key={item.id} item={item} index={index} />
        ))}
      </View>

      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: colors.card }, shadows.card]} onPress={logVoiceUpdate} activeOpacity={0.85}>
          <MaterialCommunityIcons name="microphone-outline" size={20} color={colors.textPrimary} />
          <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Voice log</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }, shadows.card]} onPress={logCheckIn} activeOpacity={0.9}>
        <MaterialCommunityIcons name="plus" size={26} color={colors.white} />
      </TouchableOpacity>
    </ScreenContainer>
  );
}

function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {detail ? <Text style={[styles.sectionDetail, { color: colors.textSecondary }]}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontFamily: FONTS.bold,
    fontSize: 34,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    marginTop: 8,
    marginBottom: SPACING.lg,
    lineHeight: 22,
    maxWidth: 300,
  },
  modeToggle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  alertCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  alertEyebrow: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    marginBottom: 4,
  },
  alertTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
  alertText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
  },
  sectionDetail: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  sectionStack: {
    gap: SPACING.md,
  },
  appointmentCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  appointmentIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
  },
  appointmentTime: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginTop: 4,
  },
  activityWrap: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  quickActionsRow: {
    marginTop: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  quickActionButton: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 28,
    bottom: 106,
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});