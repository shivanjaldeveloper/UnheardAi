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
  Animated,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { wp, hp } from '../utils/responsive';
import { ApiService } from '../services/ApiService';

import { useTheme } from '../theme/ThemeContext';

type Mood = 'Low' | 'Stressed' | 'Okay' | 'Just want to talk' | null;

const MOODS: { label: Mood; emoji: string }[] = [
  { label: 'Low', emoji: '🌧️' },
  { label: 'Stressed', emoji: '🌪️' },
  { label: 'Okay', emoji: '⛅' },
  { label: 'Just want to talk', emoji: '💬' },
];

const EmotionalEntryScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const { theme, isDark, toggleTheme } = useTheme();

  const styles = createStyles(theme, isDark);

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
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      <LinearGradient colors={theme.gradient} style={styles.container}>
        {/* Glow */}
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
                keyboardDismissMode="on-drag"
                bounces={false}
                automaticallyAdjustKeyboardInsets
                contentContainerStyle={[
                  styles.scrollContent,
                  {
                    paddingBottom:
                      insets.bottom > 0 ? insets.bottom + hp(14) : hp(15),
                  },
                ]}
              >
                {/* TOP BAR */}
                <View style={styles.topBar}>
                  {/* THEME TOGGLE */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={toggleTheme}
                    style={[
                      styles.themeToggle,
                      {
                        backgroundColor: isDark
                          ? 'rgba(139,111,247,0.22)'
                          : 'rgba(110,86,207,0.12)',
                      },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.themeThumb,
                        {
                          transform: [
                            {
                              translateX: isDark ? wp(5.5) : 0,
                            },
                          ],
                        },
                      ]}
                    >
                      <Text style={styles.thumbIcon}>
                        {isDark ? '🌙' : '☀️'}
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>

                  {/* HISTORY */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.historyPill}
                    onPress={() => navigation.navigate('ChatHistory')}
                  >
                    <Text style={styles.historyText}>History</Text>
                  </TouchableOpacity>
                </View>

                {/* TITLE */}
                <Text style={styles.title}>How are you feeling right now?</Text>

                <Text style={styles.subtitle}>share what's on your mind.</Text>

                {/* MOODS */}
                <View style={styles.moodGrid}>
                  {MOODS.map(({ label, emoji }) => {
                    const isSelected = selectedMood === label;

                    return (
                      <TouchableOpacity
                        key={label}
                        activeOpacity={0.88}
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

                {/* INPUT */}
                <TextInput
                  value={thoughts}
                  onChangeText={setThoughts}
                  placeholder="What's on your mind?"
                  placeholderTextColor={isDark ? '#8B849F' : '#9CA3AF'}
                  style={styles.thoughtInput}
                  multiline
                  textAlignVertical="top"
                  returnKeyType="done"
                  selectionColor={theme.primary}
                />

                {/* BUTTON */}
                {isLoading ? (
                  <ActivityIndicator
                    size="large"
                    color={theme.primary}
                    style={{
                      marginTop: hp(2.5),
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    disabled={!isValid}
                    onPress={handleContinue}
                    style={[
                      styles.button,
                      {
                        opacity: isValid ? 1 : 0.65,
                        marginTop: hp(2.5),
                        marginBottom:
                          insets.bottom > 0 ? insets.bottom + hp(1) : hp(3),
                      },
                    ]}
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

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
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
      backgroundColor: theme.glowTop,
      top: -wp(20),
      left: -wp(18),
    },

    bottomGlow: {
      position: 'absolute',
      width: wp(72),
      height: wp(72),
      borderRadius: wp(72),
      backgroundColor: theme.glowBottom,
      bottom: -wp(30),
      right: -wp(25),
    },

    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(3),
    },

    themeToggleText: {
      fontSize: wp(5),
    },

    historyPill: {
      flexDirection: 'row',
      alignItems: 'center',

      backgroundColor: theme.overlay,

      borderRadius: wp(10),

      paddingVertical: hp(0.9),
      paddingHorizontal: wp(4),

      borderWidth: 1.2,
      borderColor: theme.border,
    },

    historyText: {
      color: theme.textPrimary,
      fontSize: wp(3.5),
      fontWeight: '700',
    },

    title: {
      color: theme.textPrimary,
      fontSize: wp(5.0),
      lineHeight: hp(5),
      fontWeight: '700',
      letterSpacing: -1,
      marginBottom: hp(-1),
    },

    subtitle: {
      color: theme.textSecondary,
      fontSize: wp(3.8),
      lineHeight: hp(2.8),
      fontWeight: '500',
      marginBottom: hp(2),
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

      backgroundColor: theme.inputBackground,

      borderWidth: 1.2,
      borderColor: theme.border,

      justifyContent: 'center',
      alignItems: 'center',

      marginBottom: hp(1.5),
    },

    moodCardSelected: {
      backgroundColor: isDark
        ? 'rgba(139,111,247,0.18)'
        : 'rgba(110,86,207,0.12)',

      borderColor: theme.primary,
    },

    moodEmoji: {
      fontSize: wp(7),
      marginBottom: hp(0.7),
    },

    moodLabel: {
      color: theme.textSecondary,
      fontSize: wp(3.8),
      fontWeight: '600',
      textAlign: 'center',
    },

    moodLabelSelected: {
      color: theme.textPrimary,
    },

    thoughtInput: {
      width: '100%',
      minHeight: hp(15),

      borderRadius: wp(5),

      backgroundColor: theme.inputBackground,

      borderWidth: 1.2,
      borderColor: theme.border,

      color: theme.textPrimary,

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

      backgroundColor: theme.primary,

      justifyContent: 'center',
      alignItems: 'center',
    },
    themeToggle: {
      width: wp(14),
      height: wp(7.5),

      borderRadius: wp(10),

      paddingHorizontal: wp(1),

      justifyContent: 'center',

      borderWidth: 1,
      borderColor: theme.border,
    },

    themeThumb: {
      width: wp(5.5),
      height: wp(5.5),

      borderRadius: wp(5),

      backgroundColor: theme.primary,

      justifyContent: 'center',
      alignItems: 'center',

      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowOffset: {
        width: 0,
        height: 2,
      },

      elevation: 3,
    },

    thumbIcon: {
      fontSize: wp(3),
    },

    buttonText: {
      color: '#FFFFFF',
      fontSize: wp(4.5),
      fontWeight: '800',
      letterSpacing: 0.2,
    },
  });
