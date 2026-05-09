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
  messagecount?: number;
  message_count?: number;
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

const formatRelative = (rawDate?: string) => {
  if (!rawDate) return '';
  try {
    const d = new Date(rawDate);
    const now = new Date();
    const days = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (days === 0)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return d.toLocaleDateString([], { weekday: 'long' });
    return d.toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return rawDate;
  }
};

const formatFull = (rawDate?: string) => {
  if (!rawDate) return '';
  try {
    const d = new Date(rawDate);
    return (
      d.toLocaleDateString([], {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      }) +
      ' · ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return rawDate;
  }
};

// ─────────────────────────────────────────────
// Session Card (new UI + old data shape)
// ─────────────────────────────────────────────
function SessionCard({
  item,
  index,
  onPress,
}: {
  item: ChatItem;
  index: number;
  onPress: (item: ChatItem) => void;
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

  const rawDate = item.createdat || item.created_at || item.date;
  const moodEmoji = getEmoji(item.mood);
  const dateShort = formatRelative(rawDate);
  const fullDate = formatFull(rawDate);
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
        activeOpacity={0.8}
        style={styles.sessionCard}
        onPress={() => onPress(item)}
      >
        {/* Left: mood avatar */}
        <View style={styles.sessionAvatar}>
          <Text style={styles.sessionAvatarEmoji}>{moodEmoji}</Text>
        </View>

        {/* Center: info */}
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>{title}</Text>

          <View style={styles.moodPillRow}>
            {moodLabel && (
              <View style={styles.moodPill}>
                <Text style={styles.moodPillText}>{moodLabel}</Text>
              </View>
            )}
            {msgCount != null && (
              <Text style={styles.messageCount}>{msgCount}</Text>
            )}
          </View>

          <Text style={styles.sessionDate}>{fullDate}</Text>
        </View>

        {/* Right: date + chevron */}
        <View style={styles.sessionRight}>
          <Text style={styles.sessionDateShort}>{dateShort}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Empty / Error / Loading states (new UI styled)
// ─────────────────────────────────────────────
function EmptyState() {
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

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
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

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch from API ──
  const fetchChats = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const data = await ApiService.getChatList();
      const sorted = [...data].sort((a: ChatItem, b: ChatItem) => {
        const da = new Date(a.createdat || a.created_at || 0).getTime();
        const db = new Date(b.createdat || b.created_at || 0).getTime();
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

  // ── Navigate into existing chat ──
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

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <LinearGradient
        colors={['#0B0819', '#16142B', '#0F1022']}
        style={styles.container}
      >
        {/* Background decorative circles */}
        <View style={styles.topCircle} />
        <View style={styles.bottomCircle} />

        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
          <View style={styles.inner}>
            {/* Back */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.title}>Your Conversations</Text>

            {/* Subtitle — dynamic count from real data */}
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
                <ActivityIndicator color="#8B6FF7" size="large" />
              </View>
            ) : error ? (
              <ErrorState message={error} onRetry={() => fetchChats()} />
            ) : (
              <FlatList
                data={chats}
                keyExtractor={(item, i) => String(item.chatid || item.id || i)}
                renderItem={({ item, index }) => (
                  <SessionCard
                    item={item}
                    index={index}
                    onPress={handlePress}
                  />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<EmptyState />}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => fetchChats(true)}
                    tintColor="#8B6FF7"
                    colors={['#8B6FF7']}
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
// Styles — identical to new project, zero changes
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090814',
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
    backgroundColor: 'rgba(88, 51, 181, 0.22)',
    top: -wp(20),
    left: -wp(18),
  },

  bottomCircle: {
    position: 'absolute',
    width: wp(72),
    height: wp(72),
    borderRadius: wp(72),
    backgroundColor: 'rgba(33, 70, 184, 0.18)',
    bottom: -wp(30),
    right: -wp(25),
  },

  /* BACK BUTTON */
  backBtn: {
    marginTop: hp(1),

    flexDirection: 'row',
    alignItems: 'center',

    gap: wp(1.5),

    backgroundColor: 'rgba(255,255,255,0.05)',

    borderRadius: wp(10),

    paddingVertical: hp(0.9),
    paddingHorizontal: wp(4),

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',

    alignSelf: 'flex-start',
  },

  backText: {
    color: '#CFC7EE',
    fontSize: wp(3.5),
    fontWeight: '700',
  },

  /* TITLE */
  title: {
    color: '#F3F2FA',
    fontSize: wp(7),
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: hp(0.8),
    marginTop: hp(1),
  },

  subtitle: {
    color: '#8F88AA',
    fontSize: wp(3.8),
    fontWeight: '500',
    marginBottom: hp(3),
    lineHeight: hp(2.8),
  },

  listContent: {
    paddingBottom: hp(3),
  },

  /* CARD */
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: wp(5),
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: wp(4),
    marginBottom: hp(1.5),
  },

  /* AVATAR */
  sessionAvatar: {
    width: wp(13),
    height: wp(13),
    borderRadius: wp(6.5),
    backgroundColor: 'rgba(139,111,247,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(139,111,247,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3.5),
  },

  sessionAvatarEmoji: {
    fontSize: wp(5.5),
  },

  /* CENTER INFO */
  sessionInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  sessionTitle: {
    color: '#F3F2FA',
    fontSize: wp(4.2),
    fontWeight: '700',
    marginBottom: hp(0.6),
  },

  moodPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.6),
  },

  moodPill: {
    backgroundColor: 'rgba(139,111,247,0.14)',
    borderRadius: wp(10),
    paddingVertical: hp(0.45),
    paddingHorizontal: wp(3),
    borderWidth: 1,
    borderColor: 'rgba(139,111,247,0.22)',
  },

  moodPillText: {
    color: '#CFC7EE',
    fontSize: wp(3.1),
    fontWeight: '700',
  },

  messageCount: {
    color: '#7A7499',
    fontSize: wp(3.2),
    fontWeight: '600',
    marginLeft: wp(2),
  },

  sessionDate: {
    color: '#7A7499',
    fontSize: wp(3.2),
    fontWeight: '500',
  },

  /* RIGHT SIDE */
  sessionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: wp(2),
  },

  sessionDateShort: {
    color: '#9A94B4',
    fontSize: wp(3),
    fontWeight: '600',
    marginBottom: hp(0.3),
  },

  chevron: {
    color: '#7F63E8',
    fontSize: wp(5),
    fontWeight: '700',
  },

  /* EMPTY / ERROR */
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
    color: '#F3F2FA',
    fontSize: wp(5),
    fontWeight: '700',
    marginBottom: hp(0.8),
  },

  emptySubText: {
    color: '#7A7499',
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
    backgroundColor: 'rgba(139,111,247,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139,111,247,0.25)',
  },

  retryText: {
    color: '#CFC7EE',
    fontWeight: '700',
    fontSize: wp(3.8),
  },
});
