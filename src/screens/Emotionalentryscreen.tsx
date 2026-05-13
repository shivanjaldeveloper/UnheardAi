import React, { useState, useRef } from 'react';
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

const MOODS: { label: Mood; emoji: string; desc: string }[] = [
  { label: 'Low', emoji: '🌧️', desc: 'Feeling down' },
  { label: 'Stressed', emoji: '🌪️', desc: 'Overwhelmed' },
  { label: 'Okay', emoji: '⛅', desc: 'Getting by' },
  { label: 'Just want to talk', emoji: '💬', desc: 'Open chat' },
];

const EmotionalEntryScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();
  const styles = createStyles(theme, isDark);

  const [selectedMood, setSelectedMood] = useState<Mood>(null);
  const [thoughts, setThoughts] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const scales = useRef(MOODS.map(() => new Animated.Value(1))).current;

  const animateCard = (i: number, toValue: number) =>
    Animated.spring(scales[i], {
      toValue,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();

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
      Alert.alert(
        'Something went wrong',
        error?.message || 'Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const HEADER_H = insets.top + hp(7);

  const headerGradient = isDark
    ? ['rgba(10,7,25,1)', 'rgba(10,7,25,0.96)', 'rgba(10,7,25,0)']
    : ['rgba(243,240,255,1)', 'rgba(243,240,255,0.96)', 'rgba(243,240,255,0)'];

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      <LinearGradient colors={theme.gradient} style={styles.root}>
        {/* Ambient glows */}
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        {/* ═══════════ FLOATING HEADER ═══════════ */}
        <LinearGradient
          colors={headerGradient}
          locations={[0, 0.65, 1]}
          style={[
            styles.header,
            {
              height: HEADER_H,
              paddingTop:
                insets.top + (Platform.OS === 'android' ? hp(1) : hp(0.6)),
            },
          ]}
        >
          {/* Theme toggle */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={toggleTheme}
            style={[
              styles.toggleTrack,
              {
                backgroundColor: isDark
                  ? 'rgba(139,111,247,0.22)'
                  : 'rgba(110,86,207,0.12)',
              },
            ]}
          >
            <Animated.View
              style={[
                styles.toggleThumb,
                { transform: [{ translateX: isDark ? wp(5.6) : 0 }] },
              ]}
            >
              <Text style={styles.toggleIcon}>{isDark ? '🌙' : '☀️'}</Text>
            </Animated.View>
          </TouchableOpacity>

          {/* History */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.historyPill}
            onPress={() => navigation.navigate('ChatHistory')}
          >
            <Text style={styles.historyText}>History</Text>
          </TouchableOpacity>
        </LinearGradient>
        {/* ════════════════════════════════════════ */}

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
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
                  styles.scroll,
                  {
                    paddingTop: HEADER_H + hp(1.8),
                    paddingBottom:
                      insets.bottom > 0 ? insets.bottom + hp(2) : hp(3),
                  },
                ]}
              >
                {/* ── Greeting ── */}
                <View style={styles.greetingBlock}>
                  <Text style={styles.eyebrow}>Good to see you 👋</Text>
                  <Text style={styles.title}>
                    How are you{'\n'}feeling right now?
                  </Text>
                  <Text style={styles.subtitle}>
                    pick a mood · share what's on your mind
                  </Text>
                </View>

                {/* ── Mood grid ── */}
                <View style={styles.moodGrid}>
                  {MOODS.map(({ label, emoji, desc }, i) => {
                    const isSelected = selectedMood === label;
                    return (
                      <Animated.View
                        key={label}
                        style={[
                          styles.moodCardWrap,
                          { transform: [{ scale: scales[i] }] },
                        ]}
                      >
                        <TouchableOpacity
                          activeOpacity={1}
                          onPressIn={() => animateCard(i, 0.95)}
                          onPressOut={() => animateCard(i, 1)}
                          onPress={() => setSelectedMood(label)}
                          style={[
                            styles.moodCard,
                            isSelected && styles.moodCardSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.moodGlow} />}
                          <Text style={styles.moodEmoji}>{emoji}</Text>
                          <Text
                            style={[
                              styles.moodLabel,
                              isSelected && styles.moodLabelOn,
                            ]}
                          >
                            {label}
                          </Text>
                          <Text
                            style={[
                              styles.moodDesc,
                              isSelected && styles.moodDescOn,
                            ]}
                          >
                            {desc}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>

                {/* ── Divider ── */}
                <View style={styles.divRow}>
                  <View style={styles.divLine} />
                  <Text style={styles.divLabel}>tell me more</Text>
                  <View style={styles.divLine} />
                </View>

                {/* ── Input ── */}
                <View
                  style={[styles.inputWrap, inputFocused && styles.inputWrapOn]}
                >
                  <TextInput
                    value={thoughts}
                    onChangeText={setThoughts}
                    placeholder="What's on your mind? (optional)"
                    placeholderTextColor={isDark ? '#504A66' : '#A09BB8'}
                    style={styles.input}
                    multiline
                    textAlignVertical="top"
                    returnKeyType="done"
                    selectionColor={theme.primary}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                  />
                </View>

                {/* ── CTA ── */}
                {isLoading ? (
                  <ActivityIndicator
                    size="large"
                    color={theme.primary}
                    style={{ marginTop: hp(2.5) }}
                  />
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.86}
                    disabled={!isValid}
                    onPress={handleContinue}
                    style={{ marginTop: hp(2) }}
                  >
                    <LinearGradient
                      colors={
                        isValid
                          ? isDark
                            ? ['#9B7FF4', '#6B52CC']
                            : ['#7C5CDB', '#5538B8']
                          : isDark
                          ? ['#2E2845', '#252040']
                          : ['#C5BCE8', '#B0A8D9']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.cta}
                    >
                      <Text
                        style={[styles.ctaText, !isValid && { opacity: 0.45 }]}
                      >
                        Continue
                      </Text>
                    </LinearGradient>
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

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1 },
    safeArea: { flex: 1 },

    /* Glow blobs */
    glowTop: {
      position: 'absolute',
      width: wp(60),
      height: wp(60),
      borderRadius: wp(60),
      backgroundColor: theme.glowTop,
      top: -wp(20),
      left: -wp(18),
    },
    glowBottom: {
      position: 'absolute',
      width: wp(65),
      height: wp(65),
      borderRadius: wp(65),
      backgroundColor: theme.glowBottom,
      bottom: -wp(28),
      right: -wp(22),
    },

    /* ── Header ── */
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(5),
      borderBottomWidth: 0.5,
      borderBottomColor: isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(110,86,207,0.15)',
    },

    /* Toggle */
    toggleTrack: {
      width: wp(13),
      height: wp(6.8),
      borderRadius: wp(10),
      paddingHorizontal: wp(0.7),
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(139,111,247,0.30)' : 'rgba(110,86,207,0.22)',
    },
    toggleThumb: {
      width: wp(5),
      height: wp(5),
      borderRadius: wp(5),
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOpacity: 0.4,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    toggleIcon: { fontSize: wp(2.7) },

    /* History */
    historyPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(110,86,207,0.08)',
      borderRadius: wp(10),
      paddingVertical: hp(0.75),
      paddingHorizontal: wp(3.8),
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.11)' : 'rgba(110,86,207,0.20)',
    },
    historyText: {
      color: theme.textPrimary,
      fontSize: wp(3.3),
      fontWeight: '700',
      letterSpacing: 0.2,
    },

    /* Scroll container */
    scroll: { flexGrow: 1, paddingHorizontal: wp(4.5) },

    /* ── Greeting ── */
    greetingBlock: { marginBottom: hp(2.2) },
    eyebrow: {
      color: isDark ? 'rgba(255,255,255,0.40)' : 'rgba(80,60,160,0.50)',
      fontSize: wp(3.3),
      fontWeight: '600',
      letterSpacing: 0.3,
      marginBottom: hp(0.5),
    },
    title: {
      color: theme.textPrimary,
      fontSize: wp(5.8), // ← slightly smaller than before
      fontWeight: '800',
      letterSpacing: -0.7,
      lineHeight: hp(4.2),
      marginBottom: hp(0.6),
    },
    subtitle: {
      color: isDark ? 'rgba(255,255,255,0.32)' : 'rgba(80,60,160,0.45)',
      fontSize: wp(3.3),
      fontWeight: '500',
    },

    /* ── Mood grid ── */
    moodGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: hp(1.8),
    },
    moodCardWrap: {
      width: '48.6%',
      marginBottom: hp(1.2), // gap between rows
    },
    moodCard: {
      height: hp(11.5), // ← reduced from hp(14) — much more compact
      borderRadius: wp(4.5),
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(110,86,207,0.04)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(110,86,207,0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    moodCardSelected: {
      backgroundColor: isDark
        ? 'rgba(139,111,247,0.14)'
        : 'rgba(110,86,207,0.10)',
      borderColor: theme.primary,
      borderWidth: 1.4,
    },
    moodGlow: {
      position: 'absolute',
      width: wp(16),
      height: wp(16),
      borderRadius: wp(16),
      backgroundColor: isDark
        ? 'rgba(139,111,247,0.16)'
        : 'rgba(110,86,207,0.10)',
      top: -wp(3),
      right: -wp(3),
    },
    moodEmoji: { fontSize: wp(6.8), marginBottom: hp(0.6) },
    moodLabel: {
      color: isDark ? 'rgba(255,255,255,0.60)' : 'rgba(60,40,120,0.60)',
      fontSize: wp(3.5),
      fontWeight: '700',
      textAlign: 'center',
    },
    moodLabelOn: { color: theme.textPrimary },
    moodDesc: {
      color: isDark ? 'rgba(255,255,255,0.24)' : 'rgba(80,60,160,0.36)',
      fontSize: wp(2.8),
      fontWeight: '500',
      marginTop: hp(0.2),
    },
    moodDescOn: {
      color: isDark ? 'rgba(255,255,255,0.44)' : 'rgba(80,60,160,0.55)',
    },

    /* ── Divider ── */
    divRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(1.6),
      columnGap: wp(2.5),
    },
    divLine: {
      flex: 1,
      height: 0.5,
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.09)'
        : 'rgba(110,86,207,0.13)',
    },
    divLabel: {
      color: isDark ? 'rgba(255,255,255,0.24)' : 'rgba(80,60,160,0.36)',
      fontSize: wp(2.9),
      fontWeight: '600',
      letterSpacing: 0.4,
    },

    /* ── Input ── */
    inputWrap: {
      borderRadius: wp(4),
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(110,86,207,0.04)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(110,86,207,0.12)',
    },
    inputWrapOn: {
      borderColor: theme.primary,
      borderWidth: 1.3,
      backgroundColor: isDark
        ? 'rgba(139,111,247,0.06)'
        : 'rgba(110,86,207,0.06)',
    },
    input: {
      minHeight: hp(11), // ← reduced from hp(14)
      color: theme.textPrimary,
      fontSize: wp(3.8),
      fontWeight: '500',
      lineHeight: hp(2.7),
      paddingHorizontal: wp(4),
      paddingTop: hp(1.6),
      paddingBottom: hp(1.6),
    },

    /* ── CTA ── */
    cta: {
      width: '100%',
      height: hp(6.2), // ← reduced from hp(7)
      borderRadius: wp(4.5),
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },
    ctaText: {
      color: '#FFFFFF',
      fontSize: wp(4.2), // ← slightly smaller
      fontWeight: '800',
      letterSpacing: 0.3,
    },
  });
