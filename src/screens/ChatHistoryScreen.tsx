import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';

import { wp, hp } from '../utils/responsive';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { ApiService } from '../services/ApiService';

import { useTheme } from '../theme/ThemeContext';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ChatItem = {
  chatid?: string;
  id?: string;
  title?: string;
  chattitle?: string;
  mood?: string;

  createdat?: string;
  created_at?: string;

  date?: string;
  time?: string;

  messagecount?: number | string;
  message_count?: number | string;

  lastmessage?: string;
};
// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const MOOD_EMOJI: Record<string, string> = {
  low: '🌧️',
  stressed: '🌪️',
  okay: '😊',
  'just want to talk': '💬',
  unknown: '💬',
};

const getEmoji = (mood?: string) => {
  if (!mood) return '💬';
  return MOOD_EMOJI[mood.toLowerCase()] ?? '💬';
};

const parseChatDate = (date?: string, time?: string) => {
  if (!date) return null;

  try {
    // API format => DD-MM-YYYY
    const [day, month, year] = date.split('-');

    const finalTime = time || '00:00:00';

    // Create valid ISO date
    return new Date(`${year}-${month}-${day}T${finalTime}`);
  } catch {
    return null;
  }
};

const formatRelative = (date?: string, time?: string) => {
  const d = parseChatDate(date, time);

  if (!d || isNaN(d.getTime())) return '';

  const now = new Date();

  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return d.toLocaleDateString([], {
      weekday: 'short',
    });
  }

  return d.toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
  });
};

const formatFull = (date?: string, time?: string) => {
  const d = parseChatDate(date, time);

  if (!d || isNaN(d.getTime())) return '';

  return d.toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
// ─────────────────────────────────────────────
// Session Card
// ─────────────────────────────────────────────
function SessionCard({
  item,
  index,
  onPress,
  styles,
  theme,
}: {
  item: ChatItem;
  index: number;
  onPress: (item: ChatItem) => void;
  styles: any;
  theme: any;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 70,
        useNativeDriver: true,
      }),

      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 55,
        friction: 9,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const moodEmoji = getEmoji(item.mood);

  const dateShort = formatRelative(item.date, item.time);

  const fullDate = formatFull(item.date, item.time);

  const title = item.title || item.chattitle || 'Untitled Session';

  const moodLabel = item.mood
    ? item.mood.charAt(0).toUpperCase() + item.mood.slice(1)
    : null;

  const msgCount = item.messagecount || item.message_count || null;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.sessionCard}
        onPress={() => onPress(item)}
      >
        {/* Avatar */}
        <View style={styles.sessionAvatar}>
          <Text style={styles.sessionAvatarEmoji}>{moodEmoji}</Text>
        </View>

        {/* Info */}
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle} numberOfLines={1}>
            {title}
          </Text>

          <View style={styles.moodPillRow}>
            {moodLabel && (
              <View style={styles.moodPill}>
                <Text style={styles.moodPillText}>{moodLabel}</Text>
              </View>
            )}

            {msgCount != null && (
              <Text style={styles.messageCount}>{msgCount} messages</Text>
            )}
          </View>

          <Text style={styles.sessionDate}>{fullDate}</Text>
        </View>

        {/* Right */}
        <View style={styles.sessionRight}>
          <Text style={styles.sessionDateShort}>{dateShort}</Text>

          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────
function EmptyState({ styles }: any) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>💭</Text>

      <Text style={styles.emptyText}>No sessions yet</Text>

      <Text style={styles.emptySubText}>
        Your conversations will appear here
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Error State
// ─────────────────────────────────────────────
function ErrorState({
  message,
  onRetry,
  styles,
}: {
  message: string;
  onRetry: () => void;
  styles: any;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>⚠️</Text>

      <Text style={styles.emptyText}>Unable to load sessions</Text>

      <Text style={styles.emptySubText}>{message}</Text>

      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
const ChatHistoryScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const { theme, isDark } = useTheme();

  const styles = createStyles(theme, isDark);

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ───────────────────────────────────────────
  // Fetch Chats
  // ───────────────────────────────────────────
  const fetchChats = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);

    setError(null);

    try {
      const data = await ApiService.getChatList();

      const sorted = [...data].sort((a: ChatItem, b: ChatItem) => {
        const da = parseChatDate(a.date, a.time)?.getTime() || 0;

        const db = parseChatDate(b.date, b.time)?.getTime() || 0;

        return db - da;
      });

      setChats(sorted);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, []);

  // ───────────────────────────────────────────
  // Open Chat
  // ───────────────────────────────────────────
  const handlePress = useCallback(
    (item: ChatItem) => {
      navigation.navigate('Chat', {
        chatid: item.chatid || item.id,
        emotion: item.mood,
        chatTitle: item.title || item.chattitle,
        isHistory: true,
      });
    },
    [navigation],
  );

  // ───────────────────────────────────────────
  // UI
  // ───────────────────────────────────────────
  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      <LinearGradient colors={theme.gradient} style={styles.container}>
        {/* Glow */}
        <View style={styles.topCircle} />
        <View style={styles.bottomCircle} />

        <SafeAreaView
          style={[
            styles.safeArea,
            {
              paddingTop: insets.top,
            },
          ]}
        >
          <View style={styles.inner}>
            {/* Back */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.title}>Your Conversations</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              {loading
                ? 'Loading your sessions…'
                : `${chats.length} saved emotional session${
                    chats.length !== 1 ? 's' : ''
                  }`}
            </Text>

            {/* Body */}
            {loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color={theme.primary} size="large" />
              </View>
            ) : error ? (
              <ErrorState
                message={error}
                onRetry={() => fetchChats()}
                styles={styles}
              />
            ) : (
              <FlatList
                data={chats}
                keyExtractor={(item, i) => String(item.chatid || item.id || i)}
                renderItem={({ item, index }) => (
                  <SessionCard
                    item={item}
                    index={index}
                    onPress={handlePress}
                    styles={styles}
                    theme={theme}
                  />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<EmptyState styles={styles} />}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => fetchChats(true)}
                    tintColor={theme.primary}
                    colors={[theme.primary]}
                  />
                }
              />
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

export default ChatHistoryScreen;

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    safeArea: {
      flex: 1,
    },

    inner: {
      flex: 1,
      paddingHorizontal: wp(6),
      paddingTop: hp(1),
    },

    topCircle: {
      position: 'absolute',
      width: wp(65),
      height: wp(65),
      borderRadius: wp(65),
      backgroundColor: theme.glowTop,
      top: -wp(20),
      left: -wp(18),
    },

    bottomCircle: {
      position: 'absolute',
      width: wp(72),
      height: wp(72),
      borderRadius: wp(72),
      backgroundColor: theme.glowBottom,
      bottom: -wp(30),
      right: -wp(25),
    },

    // BACK BUTTON
    backBtn: {
      marginTop: hp(1),

      flexDirection: 'row',
      alignItems: 'center',

      borderRadius: wp(10),

      paddingVertical: hp(0.9),
      paddingHorizontal: wp(4),

      backgroundColor: theme.overlay,

      borderWidth: 1,
      borderColor: theme.border,

      alignSelf: 'flex-start',
    },

    backText: {
      color: theme.textPrimary,
      fontSize: wp(3.5),
      fontWeight: '700',
    },

    // TITLE
    title: {
      color: theme.textPrimary,
      fontSize: wp(7),
      fontWeight: '800',
      letterSpacing: -1,
      marginBottom: hp(0.8),
      marginTop: hp(1),
    },

    subtitle: {
      color: theme.textSecondary,
      fontSize: wp(3.8),
      fontWeight: '500',
      marginBottom: hp(3),
      lineHeight: hp(2.8),
    },

    listContent: {
      paddingBottom: hp(3),
    },

    // CARD
    sessionCard: {
      flexDirection: 'row',
      alignItems: 'center',

      backgroundColor: theme.inputBackground,

      borderRadius: wp(5),

      borderWidth: 1.2,
      borderColor: theme.border,

      padding: wp(4),

      marginBottom: hp(1.5),
    },

    // AVATAR
    sessionAvatar: {
      width: wp(13),
      height: wp(13),

      borderRadius: wp(6.5),

      backgroundColor: isDark
        ? 'rgba(139,111,247,0.16)'
        : 'rgba(110,86,207,0.12)',

      borderWidth: 1,
      borderColor: isDark ? 'rgba(139,111,247,0.28)' : 'rgba(110,86,207,0.22)',

      justifyContent: 'center',
      alignItems: 'center',

      marginRight: wp(3.5),
    },

    sessionAvatarEmoji: {
      fontSize: wp(5.5),
    },

    // CENTER INFO
    sessionInfo: {
      flex: 1,
      justifyContent: 'center',
    },

    sessionTitle: {
      color: theme.textPrimary,
      fontSize: wp(4.2),
      fontWeight: '700',
      marginBottom: hp(0.6),
    },

    moodPillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(0.6),
      flexWrap: 'wrap',
    },

    moodPill: {
      backgroundColor: isDark
        ? 'rgba(139,111,247,0.14)'
        : 'rgba(110,86,207,0.10)',

      borderRadius: wp(10),

      paddingVertical: hp(0.45),
      paddingHorizontal: wp(3),

      borderWidth: 1,
      borderColor: isDark ? 'rgba(139,111,247,0.22)' : 'rgba(110,86,207,0.18)',
    },

    moodPillText: {
      color: theme.primary,
      fontSize: wp(3.1),
      fontWeight: '700',
    },

    messageCount: {
      color: theme.textSecondary,
      fontSize: wp(3.2),
      fontWeight: '600',
      marginLeft: wp(2),
    },

    sessionDate: {
      color: theme.textSecondary,
      fontSize: wp(3.2),
      fontWeight: '500',
    },

    // RIGHT SIDE
    sessionRight: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      marginLeft: wp(2),
    },

    sessionDateShort: {
      color: theme.textSecondary,
      fontSize: wp(3),
      fontWeight: '600',
      marginBottom: hp(0.3),
    },

    chevron: {
      color: theme.primary,
      fontSize: wp(5),
      fontWeight: '700',
    },

    // EMPTY / ERROR
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: hp(18),
    },

    emptyEmoji: {
      fontSize: wp(12),
      marginBottom: hp(1.5),
    },

    emptyText: {
      color: theme.textPrimary,
      fontSize: wp(5),
      fontWeight: '700',
      marginBottom: hp(0.8),
    },

    emptySubText: {
      color: theme.textSecondary,
      fontSize: wp(3.7),
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: hp(2.7),
      paddingHorizontal: wp(10),
    },

    retryBtn: {
      marginTop: hp(2),

      paddingHorizontal: wp(7),
      paddingVertical: hp(1.2),

      borderRadius: wp(10),

      backgroundColor: isDark
        ? 'rgba(139,111,247,0.10)'
        : 'rgba(110,86,207,0.08)',

      borderWidth: 1,
      borderColor: isDark ? 'rgba(139,111,247,0.25)' : 'rgba(110,86,207,0.18)',
    },

    retryText: {
      color: theme.primary,
      fontWeight: '700',
      fontSize: wp(3.8),
    },
  });
