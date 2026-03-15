import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useMemo } from 'react';

import { BottomNav } from '../components/BottomNav';
import { useAppTheme } from '../hooks/useAppTheme';
import ChatScreen from '../screens/ChatScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { FitnessScreen } from '../screens/FitnessScreen';
import { FamilyActivityScreen } from '../screens/FamilyActivityScreen';
import { MedicationsScreen } from '../screens/MedicationsScreen';
import { RoomsScreen } from '../screens/RoomsScreen';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const { colors, isDark } = useAppTheme();

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        background: colors.background,
        card: colors.card,
        primary: colors.primary,
        text: colors.textPrimary,
        border: 'transparent',
      },
    }),
    [colors.background, colors.card, colors.primary, colors.textPrimary, isDark]
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        initialRouteName="Rooms"
        tabBar={(props) => <BottomNav {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Medications" component={MedicationsScreen} />
        <Tab.Screen name="Fitness" component={FitnessScreen} />
        <Tab.Screen name="Family Activity" component={FamilyActivityScreen} />
        <Tab.Screen name="Rooms" component={RoomsScreen} />
        <Tab.Screen name="Chat" component={ChatScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
