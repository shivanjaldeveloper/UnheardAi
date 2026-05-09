import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────
// Base Config
// ─────────────────────────────────────────────
const BASE_URL = 'https://unheardapi.primeapps.co.in/api/chat';

const API_BEARER = 'Bearer Y7N7Mh9Z7ZLeMSYspeVwdXJ2Ky2LXc';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const getUserToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');

    console.log('[ApiService] authToken:', token);

    if (!token) {
      throw new Error('No auth token found.');
    }

    return token;
  } catch (error) {
    console.log('[ApiService] Token Error:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// API Service
// ─────────────────────────────────────────────
export const ApiService = {
  // ───────────────────────────────────────────
  // Create Chat
  // POST /chatnew
  // ───────────────────────────────────────────
  createChat: async () => {
    try {
      const token = await getUserToken();

      const url = `${BASE_URL}/chatnew` + `?token=${encodeURIComponent(token)}`;

      console.log('[createChat] POST:', url);

      const response = await axios.post(url, null, {
        headers: {
          Authorization: API_BEARER,
        },
      });

      console.log(
        '[createChat] Response:',
        JSON.stringify(response.data, null, 2),
      );

      const { status, chatid } = response.data;

      if (status !== 'success' || !chatid) {
        throw new Error('Failed to create chat.');
      }

      return chatid;
    } catch (error) {
      console.log('[createChat] Error:', error?.response || error);

      throw (
        error?.response?.data?.message ||
        error?.message ||
        'Unable to create chat.'
      );
    }
  },

  // ───────────────────────────────────────────
  // Start Chat
  // POST /chatstart
  // ───────────────────────────────────────────
  startChat: async ({ chatid, mood, prompt }) => {
    try {
      const token = await getUserToken();

      const url =
        `${BASE_URL}/chatstart` +
        `?token=${encodeURIComponent(token)}` +
        `&chatid=${encodeURIComponent(chatid)}` +
        `&mood=${encodeURIComponent(mood)}` +
        `&prompt=${encodeURIComponent(prompt)}`;

      console.log('[startChat] POST:', url);

      const response = await axios.post(url, null, {
        headers: {
          Authorization: API_BEARER,
        },
      });

      console.log(
        '[startChat] Response:',
        JSON.stringify(response.data, null, 2),
      );

      const { status, title, reply } = response.data;

      if (status !== 'success') {
        throw new Error('Failed to start chat.');
      }

      return {
        title,
        reply,
      };
    } catch (error) {
      console.log('[startChat] Error:', error?.response || error);

      throw (
        error?.response?.data?.message ||
        error?.message ||
        'Unable to start chat.'
      );
    }
  },

  // ───────────────────────────────────────────
  // Send Message
  // POST /chatsendmessage
  // ───────────────────────────────────────────
  sendMessage: async ({ chatid, message }) => {
    try {
      const token = await getUserToken();

      const url =
        `${BASE_URL}/chatsendmessage` +
        `?token=${encodeURIComponent(token)}` +
        `&chatid=${encodeURIComponent(chatid)}` +
        `&message=${encodeURIComponent(message)}`;

      console.log('[sendMessage] POST:', url);

      const response = await axios.post(url, null, {
        headers: {
          Authorization: API_BEARER,
        },
      });

      console.log(
        '[sendMessage] Response:',
        JSON.stringify(response.data, null, 2),
      );

      const { status, reply } = response.data;

      if (status !== 'success' || !reply) {
        throw new Error('Failed to get AI reply.');
      }

      return reply;
    } catch (error) {
      console.log('[sendMessage] Error:', error?.response || error);

      throw (
        error?.response?.data?.message ||
        error?.message ||
        'Unable to send message.'
      );
    }
  },

  // ───────────────────────────────────────────
  // Chat List
  // POST /chatlist
  // ───────────────────────────────────────────
  getChatList: async () => {
    try {
      const token = await getUserToken();

      const url =
        `${BASE_URL}/chatlist` + `?token=${encodeURIComponent(token)}`;

      console.log('[getChatList] POST:', url);

      const response = await axios.post(url, null, {
        headers: {
          Authorization: API_BEARER,
        },
      });

      console.log(
        '[getChatList] Response:',
        JSON.stringify(response.data, null, 2),
      );

      const data = response.data;

      if (Array.isArray(data)) {
        return data;
      }

      if (data?.chats) {
        return data.chats;
      }

      if (data?.data) {
        return data.data;
      }

      if (data?.chatlist) {
        return data.chatlist;
      }

      return [];
    } catch (error) {
      console.log('[getChatList] Error:', error?.response || error);

      throw (
        error?.response?.data?.message ||
        error?.message ||
        'Unable to fetch chats.'
      );
    }
  },

  // ───────────────────────────────────────────
  // Optional Dummy APIs
  // ───────────────────────────────────────────
  findCounselor: async ({ filter }) => {
    await delay(1000);

    return {
      counselorId: 'c001',
      name: 'Support Specialist',
      waitTime: '~5 min',
    };
  },

  saveSession: async session => {
    await delay(500);

    return {
      success: true,
    };
  },

  saveMemoryConsent: async ({ consent }) => {
    await delay(300);

    return {
      success: true,
    };
  },
};
