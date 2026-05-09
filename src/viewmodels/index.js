import { useState, useCallback } from 'react';
import { EMOTIONS } from '../models';
import { ApiService } from '../services/ApiService';

// ─── Welcome ViewModel ─────────────────────────────────────
export const useWelcomeViewModel = navigation => {
  const handleStart = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  return { handleStart };
};

// ─── Emotional Entry ViewModel ─────────────────────────────
export const useEmotionalEntryViewModel = navigation => {
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [inputText, setInputText] = useState('');

  const canContinue = selectedEmotion !== null || inputText.trim().length > 0;

  const handleSelectEmotion = useCallback(id => {
    setSelectedEmotion(prev => (prev === id ? null : id));
  }, []);

  const handleContinue = useCallback(() => {
    if (!canContinue) return;

    navigation.navigate('Chat', {
      emotion: selectedEmotion,
      initialUserMessage: inputText.trim(),
    });
  }, [canContinue, selectedEmotion, inputText, navigation]);

  return {
    selectedEmotion,
    inputText,
    setInputText,
    canContinue,
    handleSelectEmotion,
    handleContinue,
    emotions: EMOTIONS,
  };
};

// ─── Helper ────────────────────────────────────────────────
// The Message model stores role: 'user' | 'assistant'
// The new ChatScreen's MessageBubble checks item.sender: 'user' | 'ai'
// This helper bridges both so neither screen nor model needs to change.
const buildMessage = ({ id, role, text }) => ({
  id: id ?? Date.now().toString() + Math.random(),
  text,
  role, // kept for API calls
  sender: role === 'user' ? 'user' : 'ai', // used by new ChatScreen UI
});

// ─── Chat ViewModel ────────────────────────────────────────
export const useChatViewModel = (navigation, route, options = {}) => {
  const { chatid, emotion, seedMessages = [] } = options;

  const buildInitialMessages = () => {
    if (seedMessages.length > 0) {
      return seedMessages.map(m => buildMessage(m));
    }

    return [
      buildMessage({
        id: '0',
        role: 'assistant',
        text: "I'm here with you. Tell me what's on your mind.",
      }),
    ];
  };

  const [messages, setMessages] = useState(buildInitialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(
    async (text = inputText) => {
      if (!text || !text.trim()) return;

      const trimmed = text.trim();

      const userMsg = buildMessage({
        id: Date.now().toString(),
        role: 'user',
        text: trimmed,
      });

      setMessages(prev => [...prev, userMsg]);
      setInputText('');
      setIsTyping(true);

      try {
        const reply = await ApiService.sendMessage({
          chatid,
          message: trimmed,
        });

        const botMsg = buildMessage({
          id: Date.now().toString() + '-bot',
          role: 'assistant',
          text: reply || 'I am listening...',
        });

        setMessages(prev => [...prev, botMsg]);
      } catch (e) {
        const errMsg = buildMessage({
          id: Date.now().toString() + '-err',
          role: 'assistant',
          text: 'Sorry, something went wrong. Please try again.',
        });

        setMessages(prev => [...prev, errMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [inputText, chatid],
  );

  return {
    emotion,
    messages,
    inputText,
    setInputText,
    isTyping,
    sendMessage,
  };
};

// ─── Home ViewModel ────────────────────────────────────────
export const useHomeViewModel = navigation => {
  const handleStart = useCallback(() => {
    navigation.navigate('EmotionalEntry');
  }, [navigation]);

  return { handleStart };
};
