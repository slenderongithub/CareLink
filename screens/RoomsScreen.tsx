import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useCareData } from '../hooks/useCareData';
import { useIslandNotifications } from '../hooks/useIslandNotifications';
import { MemberRole, useRoomStore } from '../hooks/useRoomStore';

const ROLE_OPTIONS: Array<{ key: MemberRole; label: string; description: string }> = [
  {
    key: 'elder',
    label: 'Elder',
    description: 'Person who needs assistance.',
  },
  {
    key: 'guardian',
    label: 'Guardian',
    description: 'Sets up app and has full mod access.',
  },
  {
    key: 'patient',
    label: 'Patient',
    description: 'Person receiving care (alternate name).',
  },
  {
    key: 'full-control',
    label: 'Full Control',
    description: 'Can add medicines and set medicine timing.',
  },
];

function roleLabel(role: MemberRole) {
  return ROLE_OPTIONS.find((item) => item.key === role)?.label ?? role;
}

function roleDescription(role: MemberRole) {
  return ROLE_OPTIONS.find((item) => item.key === role)?.description ?? '';
}

export function RoomsScreen() {
  const { colors, shadows } = useAppTheme();
  const { isReady, user, room, signIn, signOut, createRoom, addMember } = useRoomStore();
  const { medications, addMedication, logVoiceUpdate } = useCareData();
  const { pushNotification } = useIslandNotifications();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roomName, setRoomName] = useState(room.roomName);
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedRole, setSelectedRole] = useState<MemberRole>('patient');
  const [medicineName, setMedicineName] = useState('');
  const [medicineDosage, setMedicineDosage] = useState('');
  const [medicineTime, setMedicineTime] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [voiceDurationMs, setVoiceDurationMs] = useState(0);
  const [voiceMessages, setVoiceMessages] = useState<Array<{ id: string; sender: string; durationMs: number; sentAt: string }>>([]);

  useEffect(() => {
    setRoomName(room.roomName);
  }, [room.roomName]);

  useEffect(() => {
    if (user.email) {
      setEmail(user.email);
    }
    if (user.name) {
      setName(user.name);
    }
  }, [user.email, user.name]);

  useEffect(() => {
    return () => {
      if (recording) {
        void recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const formatDuration = (durationMs: number) => {
    const safeMs = Math.max(0, durationMs);
    const totalSeconds = Math.floor(safeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleAuth = () => {
    if (!email.trim() || !password.trim()) {
      return;
    }
    signIn({ name: mode === 'signup' ? name : user.name || name, email });
  };

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      return;
    }
    createRoom(roomName);
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      return;
    }

    addMember({ name: newMemberName, role: selectedRole });
    setNewMemberName('');
  };

  const canManageMeds = selectedRole === 'full-control' || room.members.some((member) => member.role === 'full-control');

  const handleAddMedicine = () => {
    if (!medicineName.trim() || !medicineDosage.trim() || !medicineTime.trim()) {
      return;
    }

    addMedication({
      name: medicineName,
      dosage: medicineDosage,
      time: medicineTime,
    });

    setMedicineName('');
    setMedicineDosage('');
    setMedicineTime('');
  };

  const startRecording = async () => {
    if (isRecording) {
      return;
    }

    try {
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (!permissionResponse.granted) {
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const nextRecording = new Audio.Recording();
      await nextRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      nextRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setVoiceDurationMs(status.durationMillis ?? 0);
        }
      });
      nextRecording.setProgressUpdateInterval(250);
      await nextRecording.startAsync();

      setRecording(nextRecording);
      setIsRecording(true);
      setVoiceUri(null);
      setVoiceDurationMs(0);
    } catch {
      setIsRecording(false);
      setRecording(null);
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      const status = await recording.getStatusAsync();
      const uri = recording.getURI();

      if (status.durationMillis) {
        setVoiceDurationMs(status.durationMillis);
      }

      setVoiceUri(uri);
      setRecording(null);
      setIsRecording(false);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch {
      setRecording(null);
      setIsRecording(false);
    }
  };

  const handleSendVoiceMessage = () => {
    if (!voiceUri) {
      return;
    }

    const senderName = user.name?.trim() || 'Caregiver';
    const sentTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const safeDuration = voiceDurationMs || 1000;

    setVoiceMessages((previous) => [
      {
        id: `voice-${Date.now()}`,
        sender: senderName,
        durationMs: safeDuration,
        sentAt: sentTime,
      },
      ...previous,
    ]);

    logVoiceUpdate();
    pushNotification({
      type: 'voice',
      title: 'Voice Recording',
      subtitle: `${senderName} sent a voice message`,
      message: `New recording (${formatDuration(safeDuration)}) is ready for playback.`,
      icon: 'microphone-message',
      color: colors.primary,
    });

    setVoiceUri(null);
    setVoiceDurationMs(0);
  };

  if (!isReady) {
    return <ScreenContainer />;
  }

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Rooms</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in, create your family care room, and track enrolled members.</Text>

      {!user.isAuthenticated ? (
        <View style={[styles.card, { backgroundColor: colors.card }, shadows.card]}>
          <View style={styles.modeRow}>
            <Pressable
              style={[
                styles.modeButton,
                {
                  backgroundColor: mode === 'login' ? colors.primary : colors.mutedSurface,
                },
              ]}
              onPress={() => setMode('login')}
              accessibilityRole="button"
              accessibilityLabel="Switch to login mode"
              accessibilityHint="Shows login form fields"
            >
              <Text style={[styles.modeText, { color: mode === 'login' ? colors.white : colors.textPrimary }]}>Login</Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeButton,
                {
                  backgroundColor: mode === 'signup' ? colors.primary : colors.mutedSurface,
                },
              ]}
              onPress={() => setMode('signup')}
              accessibilityRole="button"
              accessibilityLabel="Switch to signup mode"
              accessibilityHint="Shows account creation fields"
            >
              <Text style={[styles.modeText, { color: mode === 'signup' ? colors.white : colors.textPrimary }]}>Sign Up</Text>
            </Pressable>
          </View>

          {mode === 'signup' ? (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
            />
          ) : null}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
          />

          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.successButton }]}
            onPress={handleAuth}
            accessibilityRole="button"
            accessibilityLabel={mode === 'login' ? 'Login securely' : 'Create account'}
            accessibilityHint="Submits credentials and enters room setup"
          >
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.white} />
            <Text style={[styles.primaryButtonText, { color: colors.white }]}>
              {mode === 'login' ? 'Login Securely' : 'Create Account'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          {!room.createdRoom ? (
            <View style={[styles.card, { backgroundColor: colors.card }, shadows.card]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Create a Room</Text>
              <Text style={[styles.cardCaption, { color: colors.textSecondary }]}>Invite family members and caregivers into one coordination space.</Text>
              <TextInput
                value={roomName}
                onChangeText={setRoomName}
                placeholder="Room name"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.successButton }]}
                onPress={handleCreateRoom}
                accessibilityRole="button"
                accessibilityLabel="Create room"
                accessibilityHint="Creates a new shared caregiver room"
              >
                <MaterialCommunityIcons name="account-group" size={18} color={colors.white} />
                <Text style={[styles.primaryButtonText, { color: colors.white }]}>Create Room</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, { backgroundColor: colors.pendingBadge }]}
                onPress={signOut}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                accessibilityHint="Signs out from this device"
              >
                <MaterialCommunityIcons name="logout" size={18} color={colors.accent} />
                <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Sign Out</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.card }, shadows.card]}>
              <View style={styles.roomHeader}>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{room.roomName}</Text>
                  <Text style={[styles.cardCaption, { color: colors.textSecondary }]}>Members enrolled in this group</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: colors.pendingBadge }]}> 
                  <MaterialCommunityIcons name="shield-account" size={14} color={colors.accent} />
                  <Text style={[styles.statusChipText, { color: colors.accent }]}>Room Active</Text>
                </View>
              </View>

              <View style={[styles.codeCard, { backgroundColor: colors.mutedSurface, borderColor: colors.border }]}> 
                <MaterialCommunityIcons name="lock" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.codeTitle, { color: colors.textPrimary }]}>Encrypted Room Code</Text>
                  <Text style={[styles.codeValue, { color: colors.primary }]}>{room.roomCode}</Text>
                </View>
              </View>

              <View style={styles.memberInputRow}>
                <TextInput
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                  placeholder="Add member name"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.inputInline, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                />
                <Pressable
                  style={[styles.addButton, { backgroundColor: colors.successButton }]}
                  onPress={handleAddMember}
                  accessibilityRole="button"
                  accessibilityLabel="Add member"
                  accessibilityHint="Adds a new member to the current room"
                >
                  <MaterialCommunityIcons name="plus" size={18} color={colors.white} />
                </Pressable>
              </View>

              <View style={styles.rolePickerRow}>
                {ROLE_OPTIONS.map((role) => {
                  const selected = selectedRole === role.key;
                  return (
                    <Pressable
                      key={role.key}
                      onPress={() => setSelectedRole(role.key)}
                      style={[
                        styles.roleButton,
                        {
                          backgroundColor: selected ? colors.primary : colors.mutedSurface,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select role ${role.label}`}
                      accessibilityHint={`Sets new member role to ${role.label}`}
                    >
                      <Text style={[styles.roleButtonText, { color: selected ? colors.white : colors.textPrimary }]}>
                        {role.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.memberList}>
                {room.members.map((member) => (
                  <View key={member.id} style={[styles.memberRow, { borderColor: colors.border, backgroundColor: colors.background }]}> 
                    <View style={styles.memberTopRow}>
                      <View style={[styles.memberAvatar, { backgroundColor: member.online ? colors.successButton : colors.dangerButton }]}> 
                        <Text style={[styles.memberInitial, { color: colors.white }]}>{member.name.slice(0, 1)}</Text>
                      </View>
                      <View style={styles.memberNameRoleWrap}>
                        <Text style={[styles.memberName, { color: colors.textPrimary }]}>{member.name}</Text>
                        <Text style={[styles.memberRole, { color: colors.textSecondary }]}>Role: {roleLabel(member.role)}</Text>
                      </View>
                      <View
                        style={[
                          styles.memberStatus,
                          { backgroundColor: member.online ? colors.doneBadge : colors.pendingBadge },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={member.online ? 'check-decagram' : 'close-circle'}
                          size={14}
                          color={member.online ? colors.doneBadgeText : colors.accent}
                        />
                        <Text
                          style={[
                            styles.memberStatusText,
                            { color: member.online ? colors.doneBadgeText : colors.accent },
                          ]}
                        >
                          {member.online ? 'Online' : 'Offline'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.memberRoleDescription, { color: colors.textSecondary }]}>{roleDescription(member.role)}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.controlCard, { borderColor: colors.border, backgroundColor: colors.mutedSurface }]}> 
                <Text style={[styles.controlTitle, { color: colors.textPrimary }]}>Role Controls</Text>
                <Text style={[styles.controlCaption, { color: colors.textSecondary }]}>Choose Full Control to manage medicines and set timing for the room.</Text>

                {canManageMeds ? (
                  <>
                    <TextInput
                      value={medicineName}
                      onChangeText={setMedicineName}
                      placeholder="Medicine name"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                    />
                    <TextInput
                      value={medicineDosage}
                      onChangeText={setMedicineDosage}
                      placeholder="Dosage (e.g. 500mg)"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                    />
                    <TextInput
                      value={medicineTime}
                      onChangeText={setMedicineTime}
                      placeholder="Time (e.g. 08:30 AM)"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                    />

                    <Pressable
                      style={[styles.primaryButton, { backgroundColor: colors.successButton }]}
                      onPress={handleAddMedicine}
                      accessibilityRole="button"
                      accessibilityLabel="Add medicine schedule"
                      accessibilityHint="Adds medicine and timing for this room"
                    >
                      <MaterialCommunityIcons name="pill-multiple" size={18} color={colors.white} />
                      <Text style={[styles.primaryButtonText, { color: colors.white }]}>Add Medicine Timing</Text>
                    </Pressable>

                    <View style={styles.scheduledList}>
                      {medications.slice(0, 4).map((medication) => (
                        <View key={medication.id} style={[styles.scheduledItem, { borderColor: colors.border, backgroundColor: colors.background }]}> 
                          <Text style={[styles.scheduledName, { color: colors.textPrimary }]}>{medication.name}</Text>
                          <Text style={[styles.scheduledMeta, { color: colors.textSecondary }]}>{medication.dosage} • {medication.time}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <Text style={[styles.controlCaption, { color: colors.accent }]}>Select Full Control role to unlock medicine and timing controls.</Text>
                )}
              </View>

              <View style={[styles.voiceCard, { borderColor: colors.border, backgroundColor: colors.mutedSurface }]}> 
                <Text style={[styles.controlTitle, { color: colors.textPrimary }]}>Voice Recording</Text>
                <Text style={[styles.controlCaption, { color: colors.textSecondary }]}>Record a voice update and send it to trigger the Dynamic Island notification.</Text>

                <View style={styles.voiceActionRow}>
                  {!isRecording ? (
                    <Pressable
                      style={[styles.voiceActionButton, { backgroundColor: colors.dangerButton }]}
                      onPress={startRecording}
                      accessibilityRole="button"
                      accessibilityLabel="Start recording"
                      accessibilityHint="Starts capturing a voice message"
                    >
                      <MaterialCommunityIcons name="record-circle" size={18} color={colors.white} />
                      <Text style={[styles.voiceActionText, { color: colors.white }]}>Record</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[styles.voiceActionButton, { backgroundColor: colors.accent }]}
                      onPress={stopRecording}
                      accessibilityRole="button"
                      accessibilityLabel="Stop recording"
                      accessibilityHint="Stops and saves your recorded voice message"
                    >
                      <MaterialCommunityIcons name="stop" size={18} color={colors.white} />
                      <Text style={[styles.voiceActionText, { color: colors.white }]}>Stop</Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={[
                      styles.voiceActionButton,
                      { backgroundColor: voiceUri ? colors.successButton : colors.pendingBadge },
                    ]}
                    onPress={handleSendVoiceMessage}
                    accessibilityRole="button"
                    accessibilityLabel="Send voice message"
                    accessibilityHint="Sends recording and shows dynamic island voice alert"
                    disabled={!voiceUri}
                  >
                    <MaterialCommunityIcons
                      name="send"
                      size={18}
                      color={voiceUri ? colors.white : colors.accent}
                    />
                    <Text style={[styles.voiceActionText, { color: voiceUri ? colors.white : colors.accent }]}>Send</Text>
                  </Pressable>
                </View>

                <Text style={[styles.voiceMeta, { color: colors.textSecondary }]}>Duration: {formatDuration(voiceDurationMs)}</Text>

                {voiceMessages.length > 0 ? (
                  <View style={styles.scheduledList}>
                    {voiceMessages.slice(0, 3).map((message) => (
                      <View
                        key={message.id}
                        style={[styles.scheduledItem, { borderColor: colors.border, backgroundColor: colors.background }]}
                      >
                        <Text style={[styles.scheduledName, { color: colors.textPrimary }]}>{message.sender}</Text>
                        <Text style={[styles.scheduledMeta, { color: colors.textSecondary }]}>
                          Voice note • {formatDuration(message.durationMs)} • {message.sentAt}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>

              <Pressable
                style={[styles.secondaryButton, { backgroundColor: colors.pendingBadge }]}
                onPress={signOut}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                accessibilityHint="Signs out from this device"
              >
                <MaterialCommunityIcons name="logout" size={18} color={colors.accent} />
                <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Sign Out</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </ScreenContainer>
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
    marginTop: 8,
    marginBottom: SPACING.lg,
    lineHeight: 27,
    maxWidth: 330,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  modeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modeButton: {
    flex: 1,
    borderRadius: RADIUS.full,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 17,
    lineHeight: 27,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FONTS.regular,
    fontSize: 17,
    lineHeight: 27,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    lineHeight: 27,
  },
  secondaryButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    lineHeight: 27,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 21,
  },
  cardCaption: {
    fontFamily: FONTS.regular,
    fontSize: 17,
    lineHeight: 27,
  },
  roomHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  statusChip: {
    borderRadius: RADIUS.full,
    minHeight: 32,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  statusChipText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  codeCard: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codeTitle: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  codeValue: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 2,
    letterSpacing: 0.6,
  },
  memberInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rolePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    width: '48%',
    borderWidth: 1,
    borderRadius: RADIUS.full,
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  inputInline: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    minHeight: 56,
    fontFamily: FONTS.regular,
    fontSize: 17,
    lineHeight: 27,
    textAlign: 'center',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberList: {
    gap: SPACING.sm,
  },
  memberRow: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 8,
  },
  memberTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberNameRoleWrap: {
    flex: 1,
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: {
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  memberName: {
    fontFamily: FONTS.bold,
    fontSize: 20,
  },
  memberRole: {
    fontFamily: FONTS.regular,
    fontSize: 17,
    lineHeight: 27,
    marginTop: 2,
  },
  memberRoleDescription: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 22,
    width: '100%',
  },
  memberStatus: {
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
    paddingHorizontal: 8,
  },
  memberStatusText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  controlCard: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  voiceCard: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  controlTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
  },
  controlCaption: {
    fontFamily: FONTS.regular,
    fontSize: 17,
    lineHeight: 27,
  },
  scheduledList: {
    gap: SPACING.xs,
  },
  scheduledItem: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scheduledName: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    lineHeight: 27,
  },
  scheduledMeta: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 26,
  },
  voiceActionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  voiceActionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  voiceActionText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  voiceMeta: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
  },
});