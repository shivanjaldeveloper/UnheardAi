import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { wp, hp } from '../utils/responsive';
import { ApiService } from '../services/ApiService';

type Mood = 'Low' | 'Stressed' | 'Okay' | 'Just want to talk' | null;

const MOODS: { label: Mood; emoji: string }[] = [
  { label: 'Low', emoji: '🌧️' },
  { label: 'Stressed', emoji: '🌪️' },
  { label: 'Okay', emoji: '⛅' },
  { label: 'Just want to talk', emoji: '💬' },
];

const EmotionalEntryScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const [selectedMood, setSelectedMood] = useState<Mood>(null);
  const [thoughts, setThoughts] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = selectedMood !== null;

  const handleContinue = async () => {
    if (!isValid || isLoading) return;

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const chatid = await ApiService.createChat();
      const mood = selectedMood ?? 'unknown';

      const { reply, title } = await ApiService.startChat({
        chatid,
        mood,
        prompt: thoughts.trim(),
      });

      navigation.navigate('Chat', {
        chatid,
        emotion: mood,
        initialUserMessage: thoughts.trim(),
        initialAssistantReply: reply,
        chatTitle: title,
      });
    } catch (error: any) {
      console.error('[EmotionalEntry] flow error:', error);
      Alert.alert(
        'Something went wrong',
        error?.message || 'Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <LinearGradient
        colors={['#090814', '#121225', '#0B0B18']}
        style={styles.container}
      >
        {/* Background Glow */}
        <View style={styles.topGlow} />
        <View style={styles.bottomGlow} />

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView
            edges={['top', 'bottom']}
            style={[
              styles.safeArea,
              {
                paddingTop:
                  Platform.OS === 'android' ? insets.top + hp(1) : hp(1),
              },
            ]}
          >
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : hp(2)}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.scrollContent,
                  {
                    paddingBottom:
                      insets.bottom > 0 ? insets.bottom + hp(14) : hp(15),
                  },
                ]}
                automaticallyAdjustKeyboardInsets
                keyboardDismissMode="on-drag"
                bounces={false}
              >
                {/* Top Bar */}
                <View style={styles.topBar}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                  >
                    <Text style={styles.backText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.historyPill}
                    onPress={() => navigation.navigate('ChatHistory')}
                  >
                    <Text style={styles.historyText}>History</Text>
                  </TouchableOpacity>
                </View>

                {/* Heading */}
                <Text style={styles.title}>How are you feeling right now?</Text>

                {/* Subtitle */}
                <Text style={styles.subtitle}>share what's on your mind.</Text>

                {/* Mood Grid */}
                <View style={styles.moodGrid}>
                  {MOODS.map(({ label, emoji }) => {
                    const isSelected = selectedMood === label;

                    return (
                      <TouchableOpacity
                        key={label}
                        activeOpacity={0.85}
                        onPress={() => setSelectedMood(label)}
                        style={[
                          styles.moodCard,
                          isSelected && styles.moodCardSelected,
                        ]}
                      >
                        <Text style={styles.moodEmoji}>{emoji}</Text>

                        <Text
                          style={[
                            styles.moodLabel,
                            isSelected && styles.moodLabelSelected,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Thoughts Input */}
                <TextInput
                  value={thoughts}
                  onChangeText={setThoughts}
                  placeholder="What's on your mind?"
                  placeholderTextColor="#6E6887"
                  style={styles.thoughtInput}
                  multiline
                  textAlignVertical="top"
                  returnKeyType="done"
                  selectionColor="#8B6FF7"
                />

                {/* Button */}
                {isLoading ? (
                  <ActivityIndicator
                    color="#8B6FF7"
                    size="large"
                    style={{ marginTop: hp(2.5) }}
                  />
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    disabled={!isValid}
                    style={[
                      styles.button,
                      {
                        opacity: isValid ? 1 : 0.45,
                        marginTop: hp(2.5),
                        marginBottom:
                          insets.bottom > 0 ? insets.bottom + hp(1) : hp(3),
                      },
                    ]}
                    onPress={handleContinue}
                  >
                    <Text style={styles.buttonText}>Continue</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </LinearGradient>
    </>
  );
};

export default EmotionalEntryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090814',
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp(6),
    paddingTop: hp(1),
  },

  topGlow: {
    position: 'absolute',
    width: wp(65),
    height: wp(65),
    borderRadius: wp(65),
    backgroundColor: 'rgba(88, 51, 181, 0.22)',
    top: -wp(20),
    left: -wp(18),
  },

  bottomGlow: {
    position: 'absolute',
    width: wp(72),
    height: wp(72),
    borderRadius: wp(72),
    backgroundColor: 'rgba(33, 70, 184, 0.18)',
    bottom: -wp(30),
    right: -wp(25),
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(3),
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),

    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: wp(10),

    paddingVertical: hp(0.9),
    paddingHorizontal: wp(4),

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  backArrow: {
    color: '#CFC7EE',
    fontSize: wp(3.5),
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  backText: {
    color: '#CFC7EE',
    fontSize: wp(3.5),
    fontWeight: '700',
  },
  historyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: wp(10),
    paddingVertical: hp(0.9),
    paddingHorizontal: wp(4),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  historyIcon: {
    fontSize: wp(3.2),
  },

  historyText: {
    color: '#CFC7EE',
    fontSize: wp(3.5),
    fontWeight: '700',
  },

  title: {
    color: '#F3F2FA',
    fontSize: wp(5.0),
    lineHeight: hp(5),
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: hp(1.2),
  },

  subtitle: {
    color: '#928BAA',
    fontSize: wp(3.8),
    lineHeight: hp(2.8),
    fontWeight: '500',
    marginBottom: hp(2.2),
  },

  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: hp(2.5),
  },

  moodCard: {
    width: '48%',
    height: hp(13),
    borderRadius: wp(5),
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },

  moodCardSelected: {
    backgroundColor: 'rgba(139,111,247,0.16)',
    borderColor: '#8B6FF7',
  },

  moodEmoji: {
    fontSize: wp(7),
    marginBottom: hp(0.7),
  },

  moodLabel: {
    color: '#B7B0D1',
    fontSize: wp(3.8),
    fontWeight: '600',
    textAlign: 'center',
  },

  moodLabelSelected: {
    color: '#FFFFFF',
  },

  thoughtInput: {
    width: '100%',
    minHeight: hp(15),
    borderRadius: wp(5),
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.07)',
    color: '#FFFFFF',
    fontSize: wp(4),
    paddingHorizontal: wp(4.5),
    paddingTop: hp(2),
    paddingBottom: hp(2),
    fontWeight: '500',
    lineHeight: hp(2.8),
  },

  button: {
    width: '100%',
    height: hp(6.5),
    borderRadius: wp(5),
    backgroundColor: '#8B6FF7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#1D1636',
    fontSize: wp(4.5),
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
