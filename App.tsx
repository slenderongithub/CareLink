import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, useFonts } from '@expo-google-fonts/dm-sans';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DynamicIsland } from './components/DynamicIsland';
import { COLORS } from './constants/theme';
import { AppThemeProvider, useAppTheme } from './hooks/useAppTheme';
import { CareDataProvider } from './hooks/useCareData';
import { IslandNotificationProvider, useIslandNotifications } from './hooks/useIslandNotifications';
import { RoomStoreProvider } from './hooks/useRoomStore';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View
            style={{
              flex: 1,
              backgroundColor: COLORS.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size="large" color={COLORS.primary} />
            <StatusBar style="dark" />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <RoomStoreProvider>
            <CareDataProvider>
              <IslandNotificationProvider>
                <AppShell />
              </IslandNotificationProvider>
            </CareDataProvider>
          </RoomStoreProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const { isDark, nextColors, toggleToken, commitToggle } = useAppTheme();
  const { notification, clearNotification } = useIslandNotifications();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (toggleToken === 0) return;

    progress.value = 0;
    progress.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }, (finished) => {
      'worklet';
      if (finished) {
        runOnJS(commitToggle)();
        progress.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) });
      }
    });
  }, [toggleToken]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <>
      <RootNavigator />
      <DynamicIsland notification={notification} onConfirm={clearNotification} onDismiss={clearNotification} />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: nextColors.background,
          },
          overlayStyle,
        ]}
      />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}