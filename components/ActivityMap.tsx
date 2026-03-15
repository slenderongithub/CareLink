import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import { RouteCoordinate } from '../constants/mockData';
import { useAppTheme } from '../hooks/useAppTheme';

export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#58667a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1117' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1c2333' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#58667a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#131a27' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#1c2333' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0d1117' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#263040' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#131a27' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#090e18' }] },
];

const LIGHT_MAP_STYLE = [
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

const DEFAULT_REGION: Region = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

type Props = {
  route: RouteCoordinate[];
  isTracking: boolean;
};

export const ActivityMap = forwardRef<MapView, Props>(({ route, isTracking }, ref) => {
  const { colors, isDark } = useAppTheme();

  const region: Region =
    route.length > 0
      ? {
          latitude: route[route.length - 1]!.latitude,
          longitude: route[route.length - 1]!.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }
      : DEFAULT_REGION;

  return (
    <MapView
      ref={ref}
      provider={PROVIDER_GOOGLE}
      style={StyleSheet.absoluteFillObject}
      initialRegion={region}
      customMapStyle={isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
      showsUserLocation={isTracking}
      showsMyLocationButton={false}
      showsCompass={false}
      rotateEnabled={false}
      toolbarEnabled={false}
      loadingEnabled
      loadingBackgroundColor={colors.background}
      loadingIndicatorColor={colors.primary}
    >
      {route.length > 1 ? (
        <Polyline coordinates={route} strokeColor={`${colors.primary}40`} strokeWidth={14} />
      ) : null}
      {route.length > 1 ? (
        <Polyline coordinates={route} strokeColor={colors.primary} strokeWidth={5} />
      ) : null}
      {route.length > 0 ? (
        <Marker coordinate={route[0]!} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={[styles.startDot, { borderColor: colors.primary }]}> 
            <View style={[styles.startDotInner, { backgroundColor: colors.primary }]} />
          </View>
        </Marker>
      ) : null}
      {route.length > 1 && isTracking ? (
        <Marker coordinate={route[route.length - 1]!} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={styles.currentOuter}>
            <View style={[styles.currentDot, { backgroundColor: colors.primary }]} />
          </View>
        </Marker>
      ) : null}
      {route.length > 0 ? (
        <Marker coordinate={route[route.length - 1]!} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <MaterialCommunityIcons name="walk" size={20} color={colors.accent} />
        </Marker>
      ) : null}
    </MapView>
  );
});

const styles = StyleSheet.create({
  startDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  startDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  currentOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
