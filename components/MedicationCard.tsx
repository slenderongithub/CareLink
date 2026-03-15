import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withSpring,
	withTiming,
} from 'react-native-reanimated';

import { Medication } from '../constants/mockData';
import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

type MedicationCardProps = {
	medication: Medication;
	onTakeNow: (id: string) => void;
	mode?: 'dashboard' | 'list';
};

const SPRING_CONFIG = { damping: 18, stiffness: 120 };

export function MedicationCard({ medication, onTakeNow, mode = 'list' }: MedicationCardProps) {
	const { colors, shadows } = useAppTheme();
	const [localStatus, setLocalStatus] = useState<'pending' | 'taken' | 'skipped'>(
		medication.status === 'taken' ? 'taken' : 'pending'
	);

	const cardScale = useSharedValue(0.92);
	const cardOpacity = useSharedValue(0);
	const burst = useSharedValue(0);

	useEffect(() => {
		cardScale.value = withSpring(1, SPRING_CONFIG);
		cardOpacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
	}, [cardOpacity, cardScale]);

	useEffect(() => {
		if (medication.status === 'taken') {
			setLocalStatus('taken');
		}
	}, [medication.status]);

	const isTaken = localStatus === 'taken';
	const isSkipped = localStatus === 'skipped';

	const containerStyle = useAnimatedStyle(() => ({
		opacity: cardOpacity.value,
		transform: [{ scale: cardScale.value }],
	}));

	const burstStyle = useAnimatedStyle(() => ({
		opacity: interpolate(burst.value, [0, 1], [0, 1]),
		transform: [{ scale: interpolate(burst.value, [0, 1], [0.6, 1.35]) }],
	}));

	const onTakePress = () => {
		if (isTaken) {
			return;
		}

		setLocalStatus('taken');
		onTakeNow(medication.id);
		burst.value = 0;
		burst.value = withSequence(withTiming(1, { duration: 240 }), withTiming(0, { duration: 240 }));
	};

	const onSkipPress = () => {
		if (isTaken) {
			return;
		}
		setLocalStatus('skipped');
	};

	const statusLabel = isTaken ? 'Taken' : isSkipped ? 'Skipped' : 'Pending';
	const statusIcon = isTaken ? 'check-circle' : isSkipped ? 'close-circle' : 'clock-alert-outline';
	const statusBg = isTaken ? colors.doneBadge : isSkipped ? colors.pendingBadge : colors.mutedSurface;
	const statusTextColor = isTaken ? colors.doneBadgeText : isSkipped ? colors.accent : colors.textSecondary;

	return (
		<Animated.View
			style={[
				styles.card,
				containerStyle,
				{ backgroundColor: colors.card, borderColor: colors.border },
				shadows.card,
			]}
		>
			<View style={styles.rowTop}>
				<View style={[styles.leadingIcon, { backgroundColor: colors.mutedSurface }]}>
					<MaterialCommunityIcons name="pill" size={28} color={colors.primary} />
				</View>

				<View style={styles.infoWrap}>
					<Text style={[styles.medName, { color: colors.textPrimary }]}>{medication.name}</Text>
					<Text style={[styles.medMeta, { color: colors.textSecondary }]}>{medication.dosage} at {medication.time}</Text>
				</View>

				<View style={[styles.statusChip, { backgroundColor: statusBg }]}> 
					<MaterialCommunityIcons name={statusIcon} size={16} color={statusTextColor} />
					<Text style={[styles.statusText, { color: statusTextColor }]}>{statusLabel}</Text>
				</View>
			</View>

			{mode === 'dashboard' ? null : (
				<Text style={[styles.supportingText, { color: colors.textSecondary }]}>Tap one of the actions below to update this medicine in the family feed.</Text>
			)}

			<View style={styles.actionsRow}>
				<Pressable
					onPress={onTakePress}
					style={[styles.actionButton, { backgroundColor: colors.successButton }]}
					accessibilityRole="button"
					accessibilityLabel={`Mark ${medication.name} as taken`}
					accessibilityHint="Updates medication status and notifies the family feed"
				>
					<MaterialCommunityIcons name="check-bold" size={28} color={colors.white} />
					<Text style={[styles.actionText, { color: colors.white }]}>Taken</Text>
				</Pressable>

				<Pressable
					onPress={onSkipPress}
					style={[styles.actionButton, { backgroundColor: colors.dangerButton }]}
					accessibilityRole="button"
					accessibilityLabel={`Skip ${medication.name}`}
					accessibilityHint="Marks this medicine as skipped without completing it"
				>
					<MaterialCommunityIcons name="close-thick" size={28} color={colors.white} />
					<Text style={[styles.actionText, { color: colors.white }]}>Skip</Text>
				</Pressable>
			</View>

			<Animated.View style={[styles.burstWrap, burstStyle]} pointerEvents="none">
				<MaterialCommunityIcons name="check-decagram" size={40} color={colors.successButton} />
			</Animated.View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: RADIUS.lg,
		borderWidth: 1,
		padding: 22,
		gap: 18,
		position: 'relative',
	},
	rowTop: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
	},
	leadingIcon: {
		width: 56,
		height: 56,
		borderRadius: RADIUS.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	infoWrap: {
		flex: 1,
	},
	medName: {
		fontFamily: FONTS.bold,
		fontSize: 20,
		lineHeight: 28,
	},
	medMeta: {
		marginTop: 6,
		fontFamily: FONTS.regular,
		fontSize: 17,
		lineHeight: 27,
	},
	statusChip: {
		borderRadius: RADIUS.full,
		minHeight: 40,
		paddingHorizontal: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	statusText: {
		fontFamily: FONTS.bold,
		fontSize: 14,
	},
	supportingText: {
		fontFamily: FONTS.regular,
		fontSize: 17,
		lineHeight: 27,
	},
	actionsRow: {
		flexDirection: 'row',
		gap: SPACING.sm,
	},
	actionButton: {
		flex: 1,
		minHeight: 68,
		borderRadius: RADIUS.full,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		gap: 10,
		paddingHorizontal: 14,
	},
	actionText: {
		fontFamily: FONTS.bold,
		fontSize: 20,
		lineHeight: 26,
	},
	burstWrap: {
		position: 'absolute',
		right: 16,
		top: 16,
	},
});
