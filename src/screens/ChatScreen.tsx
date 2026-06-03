import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  Keyboard,
  Animated,
  Easing,
  Image,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChatViewModel } from '../viewmodels';

import { useTheme } from '../theme/ThemeContext';
import { getLogo } from '../utils/getLogo';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
};

// ─────────────────────────────────────────────
// Typing Indicator
// ─────────────────────────────────────────────
const TypingIndicator = ({ styles, theme }: any) => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),

          Animated.timing(dot, {
            toValue: 1,
            duration: 320,
            easing: Easing.ease,
            useNativeDriver: true,
          }),

          Animated.timing(dot, {
            toValue: 0,
            duration: 320,
            easing: Easing.ease,
            useNativeDriver: true,
          }),

          Animated.delay((dots.length - i) * 160),
        ]),
      ),
    );

    Animated.parallel(animations).start();

    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.messageRow}>
      <View style={styles.aiAvatar}>
        <Text style={styles.aiAvatarEmoji}>🌊</Text>
      </View>

      <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
        <View style={styles.dotsRow}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: theme.primary,

                  opacity: dot,

                  transform: [
                    {
                      translateY: dot.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// Message Bubble
// ─────────────────────────────────────────────
const MessageBubble = React.memo(
  ({
    item,
    styles,
    isDark,
  }: {
    item: Message;
    styles: any;
    isDark: boolean;
  }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const slideAnim = useRef(new Animated.Value(12)).current;

    const isUser = item.sender === 'user';

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),

        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowRight : styles.messageRowLeft,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Image source={getLogo(isDark)} style={styles.headerAvatarImage} />
          </View>
        )}

        <View
          style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.userBubbleText : styles.aiBubbleText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </Animated.View>
    );
  },
);

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
const ChatScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();

  const { theme, isDark } = useTheme();

  const styles = createStyles(theme, isDark);

  const { chatid, emotion, initialUserMessage, initialAssistantReply } =
    route.params ?? {};

  const seedMessages = [];

  if (initialUserMessage) {
    seedMessages.push({
      id: 'seed-user',
      role: 'user',
      text: initialUserMessage,
    });
  }

  if (initialAssistantReply) {
    seedMessages.push({
      id: 'seed-assistant',
      role: 'assistant',
      text: initialAssistantReply,
    });
  }

  const vm = useChatViewModel(navigation, route, {
    chatid,
    emotion,
    seedMessages,
  });

  const flatListRef = useRef<FlatList>(null);

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const keyboardHeight = useRef(new Animated.Value(0)).current;

  // Keyboard
  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';

    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, e => {
      setKeyboardVisible(true);

      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 120);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);

      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Send
  const handleSend = useCallback(() => {
    if (vm.inputText.trim()) {
      vm.sendMessage();

      Keyboard.dismiss();
    }
  }, [vm]);

  // Auto Scroll
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [vm.messages, vm.isTyping]);

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      <LinearGradient colors={theme.gradient} style={styles.container}>
        {/* Top Safe Area */}
        <View
          style={{
            height: insets.top,
          }}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerAvatar}>
              <Image
                source={getLogo(isDark)}
                style={styles.headerAvatarImage}
              />
            </View>

            <View>
              <Text style={styles.headerTitle}>Unheard</Text>

              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />

                <Text style={styles.headerSubtitle}>Listening…</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.divider} />

        {/* Messages */}
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={vm.messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MessageBubble item={item} styles={styles} isDark={isDark} />
            )}
            ListFooterComponent={
              vm.isTyping ? (
                <TypingIndicator styles={styles} theme={theme} />
              ) : null
            }
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
          />

          {/* Input */}
          <Animated.View
            style={[
              styles.inputWrapper,
              {
                paddingBottom:
                  Platform.OS === 'android'
                    ? keyboardVisible
                      ? 8
                      : Math.max(insets.bottom, 12)
                    : Math.max(insets.bottom, 8),

                transform: [
                  {
                    translateY:
                      Platform.OS === 'android'
                        ? Animated.multiply(keyboardHeight, -1)
                        : 0,
                  },
                ],
              },
            ]}
          >
            <View style={styles.inputBar}>
              <TextInput
                value={vm.inputText}
                onChangeText={vm.setInputText}
                placeholder="Share whatever you're feeling…"
                placeholderTextColor={theme.textSecondary}
                style={styles.input}
                multiline
                maxLength={500}
                blurOnSubmit={false}
                onSubmitEditing={handleSend}
                allowFontScaling={false}
                selectionColor={theme.primary}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSend}
                disabled={vm.inputText.trim().length === 0}
                style={[
                  styles.sendBtn,
                  {
                    opacity: vm.inputText.trim().length > 0 ? 1 : 0.38,
                  },
                ]}
              >
                <Image
                  source={require('../assets/images/send.png')}
                  style={styles.sendIcon}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>
    </>
  );
};

export default ChatScreen;

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },

    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',

      gap: 6,

      backgroundColor: theme.overlay,

      borderRadius: 999,

      paddingVertical: 7,
      paddingHorizontal: 14,

      borderWidth: 1.2,
      borderColor: theme.border,

      shadowColor: isDark ? 'transparent' : '#000',
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: isDark ? 0 : 2,
    },

    backText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },

    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    headerAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',

      shadowColor: theme.primary,
      shadowOpacity: isDark ? 0.45 : 0.18,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 0,
      },

      elevation: 6,
    },

    headerAvatarImage: {
      width: 34,
      height: 34,
    },

    headerTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: 0.3,
    },

    onlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 2,
    },

    onlineDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#7EE8A2',
    },

    headerSubtitle: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },

    headerSpacer: {
      width: 36,
    },

    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
    },

    // Messages
    messagesList: {
      paddingHorizontal: 14,
      paddingTop: 18,
      paddingBottom: 110,
      flexGrow: 1,
    },

    messageRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 14,
      gap: 8,
    },

    messageRowLeft: {
      justifyContent: 'flex-start',
    },

    messageRowRight: {
      justifyContent: 'flex-end',
    },

    // Avatars
    aiAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',

      alignSelf: 'flex-end',

      marginBottom: 2,

      shadowColor: theme.primary,
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 6,
      shadowOffset: {
        width: 0,
        height: 0,
      },

      elevation: 4,
    },

    aiAvatarEmoji: {
      fontSize: 15,
    },

    aiLogo: {
      width: 20,
      height: 20,
      resizeMode: 'contain',
    },

    // Bubbles
    bubble: {
      maxWidth: '74%',
      borderRadius: 18,
      paddingHorizontal: 15,
      paddingVertical: 11,
    },

    aiBubble: {
      backgroundColor: isDark ? '#1E1B35' : '#FFFFFF',

      borderBottomLeftRadius: 5,

      borderWidth: isDark ? 0 : 1,
      borderColor: theme.border,

      shadowColor: isDark ? 'transparent' : '#000',
      shadowOpacity: isDark ? 0 : 0.04,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: isDark ? 0 : 2,
    },

    userBubble: {
      backgroundColor: theme.primary,
      borderBottomRightRadius: 5,
    },

    bubbleText: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '500',
    },

    aiBubbleText: {
      color: theme.textPrimary,
    },

    userBubbleText: {
      color: '#FFFFFF',
    },

    // Typing
    typingBubble: {
      paddingVertical: 14,
      paddingHorizontal: 16,
    },

    dotsRow: {
      flexDirection: 'row',
      gap: 5,
      alignItems: 'center',
      height: 10,
    },

    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },

    // Input
    inputWrapper: {
      paddingHorizontal: 12,
      paddingTop: 6,
      backgroundColor: 'transparent',
    },

    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',

      minHeight: 56,

      backgroundColor: theme.inputBackground,

      borderRadius: 28,

      paddingLeft: 18,
      paddingRight: 6,

      paddingTop: 8,
      paddingBottom: 8,

      gap: 6,

      borderWidth: 1,
      borderColor: theme.border,

      marginBottom: 20,

      shadowColor: isDark ? theme.primary : '#000',
      shadowOpacity: isDark ? 0.15 : 0.05,
      shadowRadius: 14,
      shadowOffset: {
        width: 0,
        height: 2,
      },

      elevation: isDark ? 3 : 2,
    },

    input: {
      flex: 1,

      color: theme.textPrimary,

      fontSize: 15,
      fontWeight: '400',

      lineHeight: 20,

      maxHeight: 110,

      minHeight: 40,

      paddingTop: 0,
      paddingBottom: 0,

      textAlignVertical: 'center',

      includeFontPadding: false,
    },

    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,

      backgroundColor: theme.primary,

      justifyContent: 'center',
      alignItems: 'center',

      marginBottom: 1,

      shadowColor: theme.primary,
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 2,
      },

      elevation: 4,
    },

    sendIcon: {
      width: 22,
      height: 22,
      resizeMode: 'contain',
      tintColor: '#FFFFFF',
    },
  });
