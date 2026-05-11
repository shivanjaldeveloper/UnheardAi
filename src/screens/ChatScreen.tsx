import React, { useState, useRef, useEffect, useCallback } from 'react';
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

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
};

// ─────────────────────────────────────────────
// Typing indicator
// ─────────────────────────────────────────────
const TypingIndicator = () => {
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
const MessageBubble = React.memo(({ item }: { item: Message }) => {
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
      {/* AI Logo */}
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Image
            source={require('../assets/images/unheard-logo.png')}
            style={styles.aiLogo}
          />
        </View>
      )}

      {/* Bubble */}
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
});

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
const ChatScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();

  // ── Extract route params from EmotionalEntryScreen ──
  const { chatid, emotion, initialUserMessage, initialAssistantReply } =
    route.params ?? {};

  // ── Build seed messages from the initial exchange ──
  // Must use `role` (not `sender`) so the viewmodel's buildMessage()
  // can correctly map: role 'user' → sender 'user', everything else → sender 'ai'
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

  // ── Chat ViewModel (handles API messaging) ──
  const vm = useChatViewModel(navigation, route, {
    chatid,
    emotion,
    seedMessages,
  });

  const flatListRef = useRef<FlatList>(null);

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const keyboardHeight = useRef(new Animated.Value(0)).current;

  // ───────────────────────────────────────────
  // Keyboard Handling
  // ───────────────────────────────────────────
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

  // ───────────────────────────────────────────
  // Send Message
  // ───────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (vm.inputText.trim()) {
      vm.sendMessage();
      Keyboard.dismiss();
    }
  }, [vm]);

  // ───────────────────────────────────────────
  // Auto Scroll
  // ───────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [vm.messages, vm.isTyping]);

  // ───────────────────────────────────────────
  // UI
  // ───────────────────────────────────────────
  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <LinearGradient
        colors={['#0B0819', '#11102A', '#0F1022']}
        style={styles.container}
      >
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
                source={require('../assets/images/unheard-logo.png')}
                style={styles.headerAvatarImage}
                resizeMode="contain"
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
            renderItem={({ item }) => <MessageBubble item={item} />}
            ListFooterComponent={vm.isTyping ? <TypingIndicator /> : null}
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
                placeholderTextColor="#5A5480"
                style={styles.input}
                multiline
                maxLength={500}
                blurOnSubmit={false}
                onSubmitEditing={handleSend}
                allowFontScaling={false}
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
const styles = StyleSheet.create({
  container: {
    flex: 1,
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

    backgroundColor: 'rgba(255,255,255,0.05)',

    borderRadius: 999,

    paddingVertical: 7,
    paddingHorizontal: 14,

    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.35)', // white outline
  },

  backText: {
    color: '#CFC7EE',
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
    backgroundColor: '#6F53B8',
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#8B6FF7',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 0,
    },

    elevation: 6,
  },

  headerAvatarEmoji: {
    fontSize: 20,
  },

  headerTitle: {
    color: '#F3F2FA',
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
    color: '#9A94B4',
    fontSize: 12,
    fontWeight: '500',
  },

  headerSpacer: {
    width: 36,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(111,83,184,0.22)',
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
    backgroundColor: '#6F53B8',
    justifyContent: 'center',
    alignItems: 'center',

    alignSelf: 'flex-end',

    marginBottom: 2,

    shadowColor: '#8B6FF7',
    shadowOpacity: 0.4,
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
    backgroundColor: '#1E1B35',
    borderBottomLeftRadius: 5,
  },

  userBubble: {
    backgroundColor: '#7B5EEA',
    borderBottomRightRadius: 5,
  },

  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },

  aiBubbleText: {
    color: '#EAE8F5',
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
    backgroundColor: '#8B6FF7',
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

    backgroundColor: '#16142B',

    borderRadius: 28,

    paddingLeft: 18,
    paddingRight: 6,

    paddingTop: 8,
    paddingBottom: 8,

    gap: 6,

    borderWidth: 1,
    borderColor: 'rgba(139,111,247,0.28)',

    marginBottom: 20,

    shadowColor: '#8B6FF7',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 5,
  },

  input: {
    flex: 1,

    color: '#FFFFFF',

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

    backgroundColor: '#8B6FF7',

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 1,

    shadowColor: '#8B6FF7',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 4,
  },
  headerAvatarImage: {
    width: 34,
    height: 34,
  },

  sendIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
});
