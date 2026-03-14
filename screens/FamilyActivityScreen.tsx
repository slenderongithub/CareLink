import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ActivityItem } from '../components/ActivityItem';
import { ScreenContainer } from '../components/ScreenContainer';
import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useCareData } from '../hooks/useCareData';

export function FamilyActivityScreen() {
  const { colors, shadows } = useAppTheme();
  const { activities, logCheckIn, logVoiceUpdate } = useCareData();

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Family Activity</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>A shared timeline of check-ins, medication logs, and appointments.</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionChip, { backgroundColor: colors.card }, shadows.card]} onPress={logCheckIn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="heart-outline" size={18} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.textPrimary }]}>Log check-in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionChip, { backgroundColor: colors.card }, shadows.card]} onPress={logVoiceUpdate} activeOpacity={0.85}>
          <MaterialCommunityIcons name="microphone-outline" size={18} color={colors.textPrimary} />
          <Text style={[styles.actionText, { color: colors.textPrimary }]}>Voice update</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.timelineCard, { backgroundColor: colors.card }, shadows.card]}>
        {activities.map((item, index) => (
          <ActivityItem key={item.id} item={item} index={index} />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: FONTS.bold,
    fontSize: 32,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    marginTop: 8,
    marginBottom: SPACING.lg,
    lineHeight: 22,
    maxWidth: 320,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionChip: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  timelineCard: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
});