import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RouteCoordinate } from '../constants/mockData';
import { useAppTheme } from '../hooks/useAppTheme';

type Props = {
  route: RouteCoordinate[];
  isTracking: boolean;
};

// ponytail: react-native-maps has no web support; web build shows a placeholder instead of a real map.
export const ActivityMap = forwardRef<View, Props>((_props, ref) => {
  const { colors } = useAppTheme();

  return (
    <View ref={ref} style={[StyleSheet.absoluteFillObject, styles.placeholder, { backgroundColor: colors.background }]}>
      <MaterialCommunityIcons name="map-marker-off" size={32} color={colors.primary} />
      <Text style={[styles.text, { color: colors.primary }]}>Map view unavailable on web</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
