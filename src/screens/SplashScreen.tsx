import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import LinearGradient from 'react-native-linear-gradient';

import { COLORS } from '../constants/colors';
import { wp, hp } from '../utils/responsive';

const API_BASE = 'https://unheardapi.primeapps.co.in/api/auth';

const API_TOKEN = 'Bearer Y7N7Mh9Z7ZLeMSYspeVwdXJ2Ky2LXc';

const SplashScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallDevice = height < 700;

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Small splash delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get saved token
        const token = await AsyncStorage.getItem('authToken');

        // No token → Login
        if (!token) {
          navigation.replace('Login');
          return;
        }

        // Verify token with API
        const response = await fetch(`${API_BASE}/verifytoken?token=${token}`, {
          method: 'POST',
          headers: {
            Authorization: API_TOKEN,
          },
        });

        const data = await response.json();

        console.log('[verifytoken] Response:', data);

        // Token valid
        if (response.ok && data.status === 'success') {
          // Save latest data
          await AsyncStorage.multiSet([
            ['authToken', data.token || ''],
            ['mobile', data.mobile || ''],
            ['profileId', data.profileid || ''],
            ['userProfile', JSON.stringify(data)],
          ]);

          navigation.replace('EmotionalEntry', {
            token: data.token,
            profileId: data.profileid,
          });
        } else {
          // Invalid token
          await AsyncStorage.multiRemove([
            'authToken',
            'mobile',
            'profileId',
            'userProfile',
          ]);

          navigation.replace('Login');
        }
      } catch (error) {
        console.log('[SplashScreen] Error:', error);

        navigation.replace('Login');
      }
    };

    initializeApp();
  }, [navigation]);

  const logoSize = width * 0.22;
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
        {/* Background Glow Top */}
        <View style={styles.topGlow} />

        {/* Background Glow Bottom */}
        <View style={styles.bottomGlow} />

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
          {/* Center Content */}
          <View style={styles.centerContent}>
            {/* Logo */}
            <View
              style={[
                styles.logoOuter,
                {
                  width: logoSize,
                  height: logoSize,
                  borderRadius: logoSize / 2,
                },
              ]}
            >
              <View
                style={[
                  styles.logoInner,
                  {
                    width: logoSize * 0.78,
                    height: logoSize * 0.78,
                    borderRadius: (logoSize * 0.78) / 2,
                  },
                ]}
              >
                <Image
                  source={require('../assets/images/unheard-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* App Name */}
            <Text
              style={[
                styles.title,
                {
                  fontSize: isSmallDevice ? wp(11) : wp(12),
                  marginTop: hp(0),
                },
              ]}
            >
              Unheard
            </Text>

            {/* Subtitle */}
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: isSmallDevice ? wp(3) : wp(4),
                  lineHeight: isSmallDevice ? hp(3) : hp(3.4),
                  marginTop: hp(0.1),
                },
              ]}
            >
              Say what you couldn't{'\n'}
              say anywhere
            </Text>
          </View>

          {/* Footer */}
          <View
            style={[
              styles.footerContainer,
              {
                paddingBottom: insets.bottom > 0 ? insets.bottom : hp(2),
              },
            ]}
          />
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
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

  logoOuter: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  logoInner: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#211B3A',
  },

  logo: {
    width: '58%',
    height: '58%',
  },
  title: {
    color: COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: -1.5,
  },

  subtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },

  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },

  footerText: {
    color: '#908AA8',
    fontSize: wp(3.5),
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
