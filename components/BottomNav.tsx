import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RADIUS } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

const NAV_HEIGHT = 78;
const NAV_HORIZONTAL_MARGIN = 36;
const INDICATOR_HEIGHT = 52;
const INDICATOR_PADDING = 10;

function routeIcon(routeName: string, focused: boolean) {
  if (routeName === 'Dashboard') {
    return focused ? 'view-dashboard' : 'view-dashboard-outline';
  }
  if (routeName === 'Medications') {
    return 'pill';
  }
  if (routeName === 'Fitness') {
    return focused ? 'run-fast' : 'run';
  }
  if (routeName === 'Chat') {
    return focused ? 'robot-happy' : 'robot-happy-outline';
  }
  if (routeName === 'Family Activity') {
    return focused ? 'account-group' : 'account-group-outline';
  }
  return focused ? 'home-account' : 'account-box-outline';
}

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();

  const navWidth = screenWidth - NAV_HORIZONTAL_MARGIN;
  const tabWidth = navWidth / state.routes.length;
  const indicatorWidth = tabWidth - INDICATOR_PADDING * 2;
  const indicatorX = useSharedValue(state.index * tabWidth + INDICATOR_PADDING);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth + INDICATOR_PADDING, {
      damping: 18,
      stiffness: 140,
      mass: 0.8,
    });
  }, [indicatorX, state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth,
  }));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}> 
      <View style={[styles.shadow, { width: navWidth }]}> 
        <BlurView
          intensity={60}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.blurContainer,
            {
              width: navWidth,
              borderColor: colors.border,
              backgroundColor: isDark ? 'rgba(42,26,18,0.6)' : 'rgba(255,255,255,0.6)',
            },
          ]}
        >
          <Animated.View
            style={[
              styles.indicator,
              {
                backgroundColor: `${colors.primary}26`,
                borderColor: `${colors.primary}66`,
              },
              indicatorStyle,
            ]}
          />

          <View style={styles.content}>
            {state.routes.map((route, index) => {
              const descriptor = descriptors[route.key];
              if (!descriptor) {
                return null;
              }
              const isFocused = state.index === index;
              const label =
                descriptor.options.tabBarLabel !== undefined
                  ? String(descriptor.options.tabBarLabel)
                  : descriptor.options.title !== undefined
                    ? descriptor.options.title
                    : route.name;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isFocused }}
                  accessibilityLabel={`${label} tab`}
                  style={styles.tabItem}
                >
                  <MaterialCommunityIcons
                    name={routeIcon(route.name, isFocused)}
                    size={28}
                    color={isFocused ? colors.primary : colors.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shadow: {
    height: NAV_HEIGHT,
    borderRadius: NAV_HEIGHT / 2,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
  },
  blurContainer: {
    height: NAV_HEIGHT,
    borderRadius: NAV_HEIGHT / 2,
    overflow: 'hidden',
    borderWidth: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    height: NAV_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  indicator: {
    position: 'absolute',
    height: INDICATOR_HEIGHT,
    top: (NAV_HEIGHT - INDICATOR_HEIGHT) / 2,
    left: 0,
    borderRadius: INDICATOR_HEIGHT / 2,
    borderWidth: 1,
  },
});
