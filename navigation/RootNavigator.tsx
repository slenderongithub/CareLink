import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';

import { FONTS, RADIUS } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { DashboardScreen } from '../screens/DashboardScreen';
import { FamilyActivityScreen } from '../screens/FamilyActivityScreen';
import { MedicationsScreen } from '../screens/MedicationsScreen';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const { colors, isDark, shadows } = useAppTheme();

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
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: isDark ? '#6F8A88' : '#89A3A1',
          tabBarLabelStyle: {
            fontFamily: FONTS.medium,
            fontSize: 11,
            marginBottom: 4,
          },
          tabBarStyle: {
            height: 78,
            paddingBottom: 10,
            paddingTop: 10,
            borderTopWidth: 0,
            backgroundColor: colors.card,
            position: 'absolute',
            left: 18,
            right: 18,
            bottom: 18,
            borderRadius: RADIUS.lg,
            ...shadows.card,
          },
          tabBarIcon: ({ color, size, focused }) => {
            const name =
              route.name === 'Dashboard'
                ? focused
                  ? 'view-dashboard'
                  : 'view-dashboard-outline'
                : route.name === 'Medications'
                  ? focused
                    ? 'pill'
                    : 'pill'
                  : focused
                    ? 'account-group'
                    : 'account-group-outline';

            return <MaterialCommunityIcons name={name} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Medications" component={MedicationsScreen} />
        <Tab.Screen name="Family Activity" component={FamilyActivityScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}