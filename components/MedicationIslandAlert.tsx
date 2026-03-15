import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useCareData } from '../hooks/useCareData';

const SESSIONS = {
  morning: {
    label: 'Morning',
    icon: '🌅',
    color: '#E07B00',
    timeLabel: '6:00 AM - 10:00 AM',
    startHour: 6,
    endHour: 10,
    meds: [
      { name: 'Metformin', dose: '500mg' },
      { name: 'Vitamin D', dose: '1000 IU' },
      { name: 'Atorvastatin', dose: '10mg' },
    ],
  },
  afternoon: {
    label: 'Afternoon',
    icon: '☀️',
    color: '#E07B00',
    timeLabel: '12:00 PM - 3:00 PM',
    startHour: 12,
    endHour: 15,
    meds: [
      { name: 'Metformin', dose: '500mg' },
      { name: 'Iron Supplement', dose: '65mg' },
    ],
  },
  night: {
    label: 'Night',
    icon: '🌙',
    color: '#C0392B',
    timeLabel: '8:00 PM - 11:00 PM',
    startHour: 20,
    endHour: 23,
    meds: [
      { name: 'Amlodipine', dose: '5mg' },
      { name: 'Melatonin', dose: '3mg' },
    ],
  },
} as const;

const REMINDER_INTERVAL_MS = 5 * 60 * 1000;
type SessionKey = keyof typeof SESSIONS;
type IslandStatus = 'idle' | 'active' | 'done';

const SPRING_CONFIG = { damping: 18, stiffness: 120 };

function getActiveSession(now: Date): SessionKey | null {
  const hour = now.getHours();
  const found = (Object.entries(SESSIONS) as Array<[SessionKey, (typeof SESSIONS)[SessionKey]]>).find(
    ([, session]) => hour >= session.startHour && hour < session.endHour
  );
  return found?.[0] ?? null;
}

function parseMedicationHour(timeLabel: string) {
  const hour = Number.parseInt(timeLabel.split(':')[0] ?? '0', 10);
  const isPM = timeLabel.includes('PM');
  return isPM ? (hour === 12 ? 12 : hour + 12) : hour === 12 ? 0 : hour;
}

export function MedicationIslandAlert() {
  const { colors, shadows } = useAppTheme();
  const { medications, takeMedication } = useCareData();

  const [expanded, setExpanded] = useState(false);
  const [activeSession, setActiveSession] = useState<SessionKey | null>(null);
  const [reminderCount, setReminderCount] = useState(0);
  const [status, setStatus] = useState<IslandStatus>('idle');
  const [doneTaken, setDoneTaken] = useState<boolean | null>(null);
  const [nextReminderAt, setNextReminderAt] = useState<number | null>(null);
  const [countdownText, setCountdownText] = useState('');

  const reminderRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const expandProgress = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  const clearTimers = useCallback(() => {
    if (reminderRef.current) {
      clearTimeout(reminderRef.current);
      reminderRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (resetRef.current) {
      clearTimeout(resetRef.current);
      resetRef.current = null;
    }
  }, []);

  useEffect(() => {
    expandProgress.value = withSpring(expanded ? 1 : 0, SPRING_CONFIG);
  }, [expandProgress, expanded]);

  useEffect(() => {
    if (status === 'active') {
      glowPulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
    } else {
      glowPulse.value = withTiming(0, { duration: 220 });
    }
  }, [glowPulse, status]);

  useEffect(() => {
    const maybeStartSession = () => {
      if (status !== 'idle') {
        return;
      }
      const current = getActiveSession(new Date());
      if (!current) {
        return;
      }
      setActiveSession(current);
      setStatus('active');
      setExpanded(true);
      setReminderCount(0);
      setDoneTaken(null);
      setNextReminderAt(null);
      setCountdownText('');
    };

    maybeStartSession();
    const tick = setInterval(maybeStartSession, 60_000);
    return () => clearInterval(tick);
  }, [status]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const session = activeSession ? SESSIONS[activeSession] : null;

  const takeSessionMedication = () => {
    if (!activeSession) {
      return;
    }

    const sessionDef = SESSIONS[activeSession];
    const pending = medications
      .filter((med) => med.status === 'pending')
      .find((med) => {
        const hour = parseMedicationHour(med.time);
        return hour >= sessionDef.startHour && hour < sessionDef.endHour;
      });

    if (pending) {
      takeMedication(pending.id);
    }
  };

  const finishSession = (taken: boolean) => {
    clearTimers();
    if (taken) {
      takeSessionMedication();
    }

    setStatus('done');
    setDoneTaken(taken);
    setExpanded(true);

    resetRef.current = setTimeout(() => {
      setExpanded(false);
      setTimeout(() => {
        setStatus('idle');
        setDoneTaken(null);
        setActiveSession(null);
        setNextReminderAt(null);
        setCountdownText('');
      }, 500);
    }, 2200);
  };

  const remindLater = () => {
    const next = Date.now() + REMINDER_INTERVAL_MS;
    setNextReminderAt(next);
    setExpanded(false);
    setReminderCount((count) => count + 1);

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    const updateCountdown = () => {
      const remainingMs = next - Date.now();
      if (remainingMs <= 0) {
        setCountdownText('Reminder due now');
        setExpanded(true);
        setNextReminderAt(null);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        return;
      }
      const minutes = Math.ceil(remainingMs / 60000);
      setCountdownText(`Next reminder in ${minutes} min`);
    };

    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);

    if (reminderRef.current) {
      clearTimeout(reminderRef.current);
    }

    reminderRef.current = setTimeout(() => {
      setExpanded(true);
      setNextReminderAt(null);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }, REMINDER_INTERVAL_MS);
  };

  const cardMotion = useAnimatedStyle(() => ({
    width: interpolate(expandProgress.value, [0, 1], [176, 368]),
    borderRadius: interpolate(expandProgress.value, [0, 1], [24, 36]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowPulse.value, [0, 1], [0.2, 0.5]),
    shadowRadius: interpolate(glowPulse.value, [0, 1], [8, 22]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.02]) }],
  }));

  if (!activeSession && status === 'idle') {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <Animated.View
        style={[
          styles.card,
          cardMotion,
          glowStyle,
          {
            backgroundColor: colors.card,
            borderColor: session?.color ?? colors.primary,
            shadowColor: session?.color ?? colors.primary,
          },
          shadows.card,
        ]}
      >
        {!expanded && session && status === 'active' ? (
          <Pressable
            style={styles.compactRow}
            onPress={() => setExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel={`${session.label} medication reminder`}
            accessibilityHint="Expands reminder with Taken and Skip actions"
          >
            <Text style={styles.compactEmoji}>{session.icon}</Text>
            <Text style={[styles.compactLabel, { color: colors.textPrimary }]}>{session.label} reminder</Text>
          </Pressable>
        ) : null}

        {!expanded && countdownText ? (
          <Text style={[styles.countdownText, { color: colors.accent }]}>{countdownText}</Text>
        ) : null}

        {expanded && status === 'active' && session ? (
          <View style={styles.expandedWrap}>
            <View style={styles.headerRow}>
              <Text style={styles.sessionEmoji}>{session.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{session.label} Medicines</Text>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>{session.timeLabel}</Text>
              </View>
            </View>

            <View style={styles.medsList}>
              {session.meds.map((med) => (
                <Text key={med.name} style={[styles.medLine, { color: colors.textPrimary }]}>• {med.name} ({med.dose})</Text>
              ))}
            </View>

            <View style={styles.actionStack}>
              <Pressable
                style={[styles.bigActionButton, { backgroundColor: '#1A7A3F' }]}
                onPress={() => finishSession(true)}
                accessibilityRole="button"
                accessibilityLabel="Mark reminder as taken"
                accessibilityHint="Marks one scheduled medicine as completed"
              >
                <Text style={styles.bigActionIcon}>✓</Text>
                <Text style={styles.bigActionLabel}>Taken</Text>
              </Pressable>

              <Pressable
                style={[styles.bigActionButton, { backgroundColor: '#C0392B' }]}
                onPress={() => finishSession(false)}
                accessibilityRole="button"
                accessibilityLabel="Skip this reminder"
                accessibilityHint="Skips this session reminder"
              >
                <Text style={styles.bigActionIcon}>✕</Text>
                <Text style={styles.bigActionLabel}>Skip</Text>
              </Pressable>

              <Pressable
                style={[styles.deferButton, { backgroundColor: colors.mutedSurface }]}
                onPress={remindLater}
                accessibilityRole="button"
                accessibilityLabel="Remind me in five minutes"
                accessibilityHint="Collapses reminder and starts a five-minute countdown"
              >
                <Text style={[styles.deferText, { color: colors.textPrimary }]}>Remind in 5 min</Text>
              </Pressable>
            </View>

            {reminderCount > 0 ? (
              <Text style={[styles.reminderLabel, { color: colors.accent }]}>Reminder count: {reminderCount}</Text>
            ) : null}
          </View>
        ) : null}

        {expanded && status === 'done' && session && doneTaken !== null ? (
          <View style={styles.doneWrap}>
            <Text style={styles.doneIcon}>{doneTaken ? '✅' : '🚫'}</Text>
            <Text style={[styles.doneTitle, { color: colors.textPrimary }]}>
              {doneTaken ? 'Medicines logged as taken' : 'Reminder skipped'}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    borderWidth: 2,
    overflow: 'hidden',
  },
  compactRow: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  compactEmoji: {
    fontSize: 24,
  },
  compactLabel: {
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
  countdownText: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    lineHeight: 27,
    textAlign: 'center',
    paddingBottom: 12,
  },
  expandedWrap: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sessionEmoji: {
    fontSize: 26,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 22,
  },
  timeLabel: {
    marginTop: 4,
    fontFamily: FONTS.regular,
    fontSize: 17,
    lineHeight: 27,
  },
  medsList: {
    marginTop: 12,
    gap: 8,
  },
  medLine: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 26,
  },
  actionStack: {
    marginTop: 14,
    gap: SPACING.sm,
  },
  bigActionButton: {
    minHeight: 72,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  bigActionIcon: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: FONTS.bold,
  },
  bigActionLabel: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 24,
  },
  deferButton: {
    minHeight: 56,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deferText: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    lineHeight: 27,
  },
  reminderLabel: {
    marginTop: 8,
    fontFamily: FONTS.bold,
    fontSize: 17,
    lineHeight: 27,
    textAlign: 'center',
  },
  doneWrap: {
    minHeight: 120,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  doneIcon: {
    fontSize: 40,
  },
  doneTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
  },
});
