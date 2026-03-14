import { StyleSheet, Text, View } from 'react-native';

import { MedicationCard } from '../components/MedicationCard';
import { ScreenContainer } from '../components/ScreenContainer';
import { FONTS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useCareData } from '../hooks/useCareData';

export function MedicationsScreen() {
  const { colors } = useAppTheme();
  const { medications, takeMedication } = useCareData();
  const pendingCount = medications.filter((item) => item.status === 'pending').length;

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Medications</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {pendingCount} pending today. Tap Take Now to notify the family and update status.
      </Text>

      <View style={styles.stack}>
        {medications.map((medication) => (
          <MedicationCard key={medication.id} medication={medication} onTakeNow={takeMedication} />
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
    lineHeight: 22,
    marginBottom: SPACING.xl,
    maxWidth: 320,
  },
  stack: {
    gap: SPACING.md,
  },
});