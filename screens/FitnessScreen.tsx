import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView from 'react-native-maps';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityMap } from '../components/ActivityMap';
import { estimateCalories, formatDuration, formatPace } from '../components/ActivityStats';
import { ScreenContainer } from '../components/ScreenContainer';
import { RouteCoordinate } from '../constants/mockData';
import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useIslandNotifications } from '../hooks/useIslandNotifications';

type TrackingState = 'idle' | 'tracking' | 'paused' | 'summary';

function haversine(a: RouteCoordinate, b: RouteCoordinate): number {
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * sinLon * sinLon;

  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function FitnessScreen() {
  const insets = useSafeAreaInsets();
  const { colors, shadows, isDark } = useAppTheme();
  const { pushNotification } = useIslandNotifications();

  const mapRef = useRef<MapView>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const pedometerSubRef = useRef<{ remove: () => void } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCoordRef = useRef<RouteCoordinate | null>(null);
  const stepOffsetRef = useRef(0);

  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [hasPermission, setHasPermission] = useState(false);
  const [route, setRoute] = useState<RouteCoordinate[]>([]);
  const [steps, setSteps] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);

  const cleanupSensors = useCallback(() => {
    locationSubRef.current?.remove();
    locationSubRef.current = null;
    pedometerSubRef.current?.remove();
    pedometerSubRef.current = null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupSensors();
    };
  }, [cleanupSensors]);

  const onLocationUpdate = useCallback((location: Location.LocationObject) => {
    const nextCoordinate: RouteCoordinate = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    if (lastCoordRef.current) {
      setDistanceMeters((previous) => previous + haversine(lastCoordRef.current!, nextCoordinate));
    }

    lastCoordRef.current = nextCoordinate;
    setRoute((previous) => [...previous, nextCoordinate]);

    mapRef.current?.animateToRegion(
      {
        latitude: nextCoordinate.latitude,
        longitude: nextCoordinate.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      },
      450
    );
  }, []);

  const startSensors = useCallback(async () => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((previous) => previous + 1);
    }, 1000);

    locationSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 4,
      },
      onLocationUpdate
    );

    const pedometerAvailable = await Pedometer.isAvailableAsync();
    if (pedometerAvailable) {
      pedometerSubRef.current = Pedometer.watchStepCount((result) => {
        setSteps(stepOffsetRef.current + result.steps);
      });
    }
  }, [onLocationUpdate]);

  const startTracking = useCallback(async () => {
    if (trackingState === 'tracking') {
      return;
    }

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setHasPermission(false);
      return;
    }

    setHasPermission(true);
    cleanupSensors();
    setRoute([]);
    setSteps(0);
    setElapsedSeconds(0);
    setDistanceMeters(0);
    stepOffsetRef.current = 0;
    lastCoordRef.current = null;

    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    onLocationUpdate(current);

    setTrackingState('tracking');
    await startSensors();

    pushNotification({
      type: 'step',
      title: 'Live Tracking Active',
      subtitle: 'Walk session started',
      message: 'GPS route and steps are now being tracked in real time.',
      icon: 'run-fast',
      color: colors.primary,
    });
  }, [cleanupSensors, colors.primary, onLocationUpdate, pushNotification, startSensors, trackingState]);

  const pauseTracking = useCallback(() => {
    stepOffsetRef.current = steps;
    cleanupSensors();
    setTrackingState('paused');

    pushNotification({
      type: 'step',
      title: 'Tracking Paused',
      subtitle: 'Walk session is paused',
      message: 'Resume when ready to continue your route and steps.',
      icon: 'pause-circle-outline',
      color: colors.accent,
    });
  }, [cleanupSensors, colors.accent, pushNotification, steps]);

  const resumeTracking = useCallback(async () => {
    if (trackingState !== 'paused') {
      return;
    }

    setTrackingState('tracking');
    await startSensors();

    pushNotification({
      type: 'step',
      title: 'Tracking Resumed',
      subtitle: 'Live walk session continued',
      message: 'Route and step updates are live again.',
      icon: 'play-circle-outline',
      color: colors.primary,
    });
  }, [colors.primary, pushNotification, startSensors, trackingState]);

  const stopTracking = useCallback(() => {
    cleanupSensors();
    setTrackingState('summary');

    pushNotification({
      type: 'step',
      title: 'Walk Session Complete',
      subtitle: 'Tracking ended successfully',
      message: 'Open summary to review route, pace, calories, and steps.',
      icon: 'check-decagram',
      color: colors.successButton,
    });
  }, [cleanupSensors, colors.successButton, pushNotification]);

  const newWalk = useCallback(() => {
    setTrackingState('idle');
    setRoute([]);
    setSteps(0);
    setElapsedSeconds(0);
    setDistanceMeters(0);
    stepOffsetRef.current = 0;
    lastCoordRef.current = null;
  }, []);

  const openInGoogleMaps = useCallback(async () => {
    const latest = route[route.length - 1];
    if (!latest) {
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${latest.latitude},${latest.longitude}`;
    await Linking.openURL(url);
  }, [route]);

  const distanceKm = distanceMeters / 1000;
  const pace = formatPace(elapsedSeconds, distanceKm);
  const calories = estimateCalories(steps, elapsedSeconds / 60);
  const isTracking = trackingState === 'tracking';
  const isPaused = trackingState === 'paused';
  const isSummary = trackingState === 'summary';

  const latest = route[route.length - 1];
  const coordinateText = latest
    ? `${latest.latitude.toFixed(5)}, ${latest.longitude.toFixed(5)}`
    : 'Start tracking to capture live route points.';

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Fitness Tracking</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Track walk route, steps, pace, and calories in real time with pause and resume controls.
      </Text>

      <View style={[styles.mapCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.card]}>
        <ActivityMap ref={mapRef} route={route} isTracking={isTracking} />

        <Animated.View
          entering={FadeInDown.duration(280)}
          style={[styles.mapOverlay, { top: insets.top + 6 }]}
          pointerEvents="none"
        >
          <BlurView
            intensity={isDark ? 60 : 75}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.mapOverlayPill, { borderColor: colors.border }]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isTracking
                    ? colors.successButton
                    : isPaused
                      ? colors.accent
                      : colors.textSecondary,
                },
              ]}
            />
            <Text style={[styles.mapOverlayText, { color: colors.textPrimary }]}>
              {isTracking ? 'GPS Active' : isPaused ? 'Paused' : isSummary ? 'Session Complete' : 'Ready'}
            </Text>
          </BlurView>
        </Animated.View>
      </View>

      <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.card]}>
        <View style={styles.metricsRow}>
          <MetricCell label="Duration" value={formatDuration(elapsedSeconds)} tint={colors.primary} textColor={colors.textPrimary} />
          <MetricCell label="Distance" value={`${distanceKm.toFixed(2)} km`} tint={colors.successButton} textColor={colors.textPrimary} />
        </View>

        <View style={styles.metricsRow}>
          <MetricCell label="Steps" value={steps.toLocaleString()} tint={colors.accent} textColor={colors.textPrimary} />
          <MetricCell label="Pace" value={`${pace} /km`} tint="#FF9500" textColor={colors.textPrimary} />
        </View>

        <View style={styles.metricsRowSingle}>
          <MetricCell label="Est. Calories" value={`${calories}`} tint="#EF4444" textColor={colors.textPrimary} />
        </View>

        <Text style={[styles.coordinateText, { color: colors.textSecondary }]}>Latest point: {coordinateText}</Text>

        {!hasPermission ? (
          <Text style={[styles.permissionText, { color: colors.accent }]}>
            Location permission is required for live tracking.
          </Text>
        ) : null}
      </View>

      <Animated.View entering={FadeInUp.duration(240)} style={styles.actionRow}>
        {trackingState === 'idle' ? (
          <>
            <ActionButton
              label="Start Tracking"
              icon="play-circle-outline"
              backgroundColor={colors.successButton}
              color={colors.white}
              onPress={startTracking}
            />
            <ActionButton
              label="Google Maps"
              icon="map-search"
              backgroundColor={colors.primary}
              color={route.length > 0 ? colors.white : colors.pendingBadge}
              onPress={openInGoogleMaps}
              disabled={route.length === 0}
            />
          </>
        ) : null}

        {trackingState === 'tracking' ? (
          <>
            <ActionButton
              label="Pause"
              icon="pause"
              backgroundColor={colors.pendingBadge}
              color={colors.accent}
              onPress={pauseTracking}
            />
            <ActionButton
              label="Stop"
              icon="stop-circle-outline"
              backgroundColor={colors.dangerButton}
              color={colors.white}
              onPress={stopTracking}
            />
          </>
        ) : null}

        {trackingState === 'paused' ? (
          <>
            <ActionButton
              label="Resume"
              icon="play"
              backgroundColor={colors.successButton}
              color={colors.white}
              onPress={resumeTracking}
            />
            <ActionButton
              label="Stop"
              icon="stop-circle-outline"
              backgroundColor={colors.dangerButton}
              color={colors.white}
              onPress={stopTracking}
            />
          </>
        ) : null}

        {trackingState === 'summary' ? (
          <>
            <ActionButton
              label="New Walk"
              icon="plus"
              backgroundColor={colors.primary}
              color={colors.white}
              onPress={newWalk}
            />
            <ActionButton
              label="Google Maps"
              icon="map-search"
              backgroundColor={colors.mutedSurface}
              color={route.length > 0 ? colors.primary : colors.textSecondary}
              onPress={openInGoogleMaps}
              disabled={route.length === 0}
            />
          </>
        ) : null}
      </Animated.View>
    </ScreenContainer>
  );
}

function MetricCell({
  label,
  value,
  tint,
  textColor,
}: {
  label: string;
  value: string;
  tint: string;
  textColor: string;
}) {
  return (
    <View style={styles.metricCell}>
      <Text style={[styles.metricLabel, { color: tint }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  backgroundColor,
  color,
  onPress,
  disabled,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  backgroundColor: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor, opacity: disabled ? 0.55 : 1 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Text style={[styles.actionButtonText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    marginTop: SPACING.xl,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 17,
    lineHeight: 27,
    marginTop: 8,
    marginBottom: SPACING.lg,
    maxWidth: 340,
  },
  mapCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    height: 330,
    position: 'relative',
  },
  mapOverlay: {
    position: 'absolute',
    left: SPACING.sm,
  },
  mapOverlayPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  mapOverlayText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusCard: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  metricsRowSingle: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  metricCell: {
    flex: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  metricLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 26,
    marginTop: 4,
  },
  coordinateText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  permissionText: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  actionRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 58,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  actionButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
});
