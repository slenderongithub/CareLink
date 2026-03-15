import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useCareData } from '../hooks/useCareData';

const SCREEN_W = Dimensions.get('window').width;
const API_BASE = 'http://10.0.2.2:3001';

const EMERGENCY_KEYWORDS = [
  'fall',
  'fell',
  'chest pain',
  'dizzy',
  'emergency',
  'stroke',
  'heart attack',
  'bleeding',
  'faint',
  'unconscious',
  "can't breathe",
  'help me',
];

const containsEmergency = (text: string) =>
  EMERGENCY_KEYWORDS.some((keyword) => text.toLowerCase().includes(keyword));

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
};

export default function ChatScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { medications, careScore, healthData } = useCareData();

  const flatListRef = useRef<FlatList<Message>>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Hello! I'm your CareLink AI assistant. Ask me about health, medications, wellness, or daily progress.",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 180);
    }
  }, [messages]);

  const buildHealthContext = useCallback(() => {
    const medicationsTaken = medications.filter((item) => item.status === 'taken').length;
    const stepsToday = healthData.steps.length > 0 ? healthData.steps[healthData.steps.length - 1]!.value : 0;
    const heartRate = healthData.heartRate.length > 0 ? healthData.heartRate[healthData.heartRate.length - 1]!.value : 0;

    return {
      steps: stepsToday,
      medicationsTaken,
      medicationsTotal: medications.length,
      heartRate,
      careScore,
    };
  }, [careScore, healthData, medications]);

  const sendMessage = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) {
      return;
    }

    Keyboard.dismiss();

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((previous) => [...previous, userMsg]);
    setInputText('');

    if (containsEmergency(trimmed)) {
      const emergencyMsg: Message = {
        id: `sys-${Date.now()}`,
        text:
          'EMERGENCY DETECTED\n\n- Stay calm and sit down if possible\n- Call emergency services (112 / 911)\n- Alert a family member immediately\n- Do not move if you suspect a fall injury',
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages((previous) => [...previous, emergencyMsg]);

      Alert.alert(
        'Emergency Detected',
        'It sounds like urgent help may be needed. Call emergency services now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call 112', style: 'destructive' },
        ]
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          healthContext: buildHealthContext(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        text: data.reply || 'I could not process that right now. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((previous) => [...previous, aiMsg]);
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          id: `err-${Date.now()}`,
          text: 'Connection issue. Please make sure the backend server is running and reachable.',
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [buildHealthContext, inputText, isLoading]);

  const speakMessage = useCallback(
    (text: string) => {
      if (isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
        return;
      }

      const clean = text.replace(/[^\w\s.,!?;:'\-\n]/g, '').trim();
      setIsSpeaking(true);

      Speech.speak(clean, {
        language: 'en-US',
        rate: 0.88,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [isSpeaking]
  );

  const startRecording = useCallback(async () => {
    if (isRecording || isTranscribing) {
      return;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone Required', 'Please allow microphone access to use voice transcription.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const nextRecording = new Audio.Recording();
      await nextRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await nextRecording.startAsync();
      setRecording(nextRecording);
      setIsRecording(true);
    } catch {
      setRecording(null);
      setIsRecording(false);
      Alert.alert('Recording Error', 'Could not start recording. Please try again.');
    }
  }, [isRecording, isTranscribing]);

  const stopRecordingAndTranscribe = useCallback(async () => {
    if (!recording) {
      return;
    }

    setIsTranscribing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (!uri) {
        throw new Error('Missing recording file URI');
      }

      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch(`${API_BASE}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: 'audio/m4a',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const transcript = typeof data.transcript === 'string' ? data.transcript.trim() : '';

      if (!transcript) {
        Alert.alert('No Speech Detected', 'Could not detect speech clearly. Try again closer to the microphone.');
        return;
      }

      setInputText((previous) => {
        const spacer = previous.trim() ? ' ' : '';
        return `${previous}${spacer}${transcript}`.trimStart();
      });
    } catch {
      Alert.alert('Transcription Failed', 'Could not transcribe audio right now. Please try again.');
      setIsRecording(false);
      setRecording(null);
    } finally {
      setIsTranscribing(false);
    }
  }, [recording]);

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isUser = item.sender === 'user';
      const isSystem = item.sender === 'system';

      return (
        <Animated.View
          entering={FadeInUp.delay(index > messages.length - 3 ? 70 : 0).duration(320)}
          style={[styles.bubbleRow, isUser ? styles.bubbleRowRight : styles.bubbleRowLeft]}
        >
          {!isUser ? (
            <View
              style={[
                styles.avatar,
                { backgroundColor: isSystem ? '#EF444420' : `${colors.primary}20` },
              ]}
            >
              <MaterialCommunityIcons
                name={isSystem ? 'alert-circle' : 'robot-happy'}
                size={20}
                color={isSystem ? '#EF4444' : colors.primary}
              />
            </View>
          ) : null}

          <View
            style={[
              styles.bubble,
              isUser
                ? [styles.userBubble, { backgroundColor: colors.primary }]
                : isSystem
                  ? [styles.systemBubble, { backgroundColor: '#EF444415', borderColor: '#EF444440' }]
                  : [styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }],
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                {
                  color: isUser ? '#FFFFFF' : isSystem ? '#EF4444' : colors.textPrimary,
                },
              ]}
            >
              {item.text}
            </Text>

            {item.sender === 'ai' ? (
              <TouchableOpacity
                onPress={() => speakMessage(item.text)}
                style={[styles.ttsBtn, { borderColor: colors.border }]}
                accessibilityLabel="Read message aloud"
              >
                <MaterialCommunityIcons
                  name={isSpeaking ? 'volume-off' : 'volume-high'}
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={[styles.ttsLabel, { color: colors.textSecondary }]}>
                  {isSpeaking ? 'Stop' : 'Listen'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
      );
    },
    [colors, isSpeaking, messages.length, speakMessage]
  );

  const TypingDots = () => {
    const dot1 = useSharedValue(0.3);
    const dot2 = useSharedValue(0.3);
    const dot3 = useSharedValue(0.3);

    useEffect(() => {
      dot1.value = withRepeat(withTiming(1, { duration: 500 }), -1, true);
      setTimeout(() => {
        dot2.value = withRepeat(withTiming(1, { duration: 500 }), -1, true);
      }, 170);
      setTimeout(() => {
        dot3.value = withRepeat(withTiming(1, { duration: 500 }), -1, true);
      }, 340);
    }, [dot1, dot2, dot3]);

    const s1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
    const s2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
    const s3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

    return (
      <Animated.View entering={FadeInDown.duration(280)} style={[styles.bubbleRow, styles.bubbleRowLeft]}>
        <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}> 
          <MaterialCommunityIcons name="robot-happy" size={20} color={colors.primary} />
        </View>
        <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.typingDots}>
            <Animated.View style={[styles.dot, { backgroundColor: colors.textSecondary }, s1]} />
            <Animated.View style={[styles.dot, { backgroundColor: colors.textSecondary }, s2]} />
            <Animated.View style={[styles.dot, { backgroundColor: colors.textSecondary }, s3]} />
          </View>
        </View>
      </Animated.View>
    );
  };

  const suggestions = [
    'How am I doing today?',
    'Any health tips?',
    'Medication reminders',
    'Help me sleep better',
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Animated.View
        entering={FadeInDown.duration(380)}
        style={[
          styles.header,
          {
            paddingTop: insets.top + 34,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}15` }]}> 
          <MaterialCommunityIcons name="robot-happy-outline" size={28} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>CareLink AI</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Your health assistant</Text>
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.messageList, { paddingBottom: 12 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            messages.length <= 1 ? (
              <View style={styles.suggestionsWrap}>
                <Text style={[styles.suggestLabel, { color: colors.textSecondary }]}>Try asking:</Text>
                <View style={styles.suggestRow}>
                  {suggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      style={[
                        styles.suggestPill,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                        },
                      ]}
                      onPress={() => setInputText(suggestion)}
                    >
                      <Text style={[styles.suggestText, { color: colors.textPrimary }]}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={isLoading ? <TypingDots /> : null}
        />

        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 14) + 92,
            },
          ]}
        >
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <TouchableOpacity
              onPress={isRecording ? stopRecordingAndTranscribe : startRecording}
              style={[
                styles.micBtn,
                { backgroundColor: isRecording ? '#EF4444' : colors.mutedSurface },
              ]}
              accessibilityRole="button"
              accessibilityLabel={isRecording ? 'Stop recording and transcribe' : 'Start voice transcription'}
              disabled={isTranscribing || isLoading}
            >
              <MaterialCommunityIcons
                name={isRecording ? 'stop' : 'microphone'}
                size={18}
                color={isRecording ? '#FFFFFF' : colors.textSecondary}
              />
            </TouchableOpacity>

            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder={isTranscribing ? 'Transcribing voice...' : 'Type a message...'}
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline
              maxLength={500}
              editable={!isLoading && !isTranscribing}
            />

            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading || isTranscribing}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: inputText.trim() ? colors.primary : colors.mutedSurface,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={inputText.trim() ? '#FFFFFF' : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 20 },
  headerSub: { fontFamily: FONTS.medium, fontSize: 12, marginTop: 1 },
  messageList: {
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    maxWidth: SCREEN_W * 0.88,
  },
  bubbleRowLeft: { alignSelf: 'flex-start', alignItems: 'flex-end' },
  bubbleRowRight: { alignSelf: 'flex-end' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  bubble: {
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: SCREEN_W * 0.75,
    borderWidth: 1,
  },
  userBubble: {
    borderBottomRightRadius: 6,
    borderColor: 'transparent',
  },
  aiBubble: {
    borderBottomLeftRadius: 6,
  },
  systemBubble: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  bubbleText: {
    fontFamily: FONTS.medium,
    lineHeight: 24,
    fontSize: 17,
  },
  ttsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  ttsLabel: { fontFamily: FONTS.medium, fontSize: 12 },
  typingDots: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  suggestionsWrap: { paddingHorizontal: 4, marginBottom: SPACING.md },
  suggestLabel: { fontFamily: FONTS.medium, fontSize: 13, marginBottom: 10 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  suggestText: { fontFamily: FONTS.medium, fontSize: 14 },
  inputBar: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 17,
    maxHeight: 100,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
