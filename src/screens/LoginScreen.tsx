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
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { wp, hp } from '../utils/responsive';

const API_BASE = 'https://unheardapi.primeapps.co.in/api/auth';

const API_TOKEN = 'Bearer Y7N7Mh9Z7ZLeMSYspeVwdXJ2Ky2LXc';

const LoginScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isValid = phone.length >= 10;
  const isSmallDevice = height < 700;

  const logoSize = width * 0.22;

  const handleRequestOtp = async () => {
    Keyboard.dismiss();

    setError('');

    if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/requestotp?mobile=${phone}`, {
        method: 'POST',
        headers: {
          Authorization: API_TOKEN,
        },
      });

      const data = await response.json();

      console.log('[requestotp] Response:', data);

      if (response.ok) {
        navigation.navigate('Otp', {
          mobile: phone,
          transaction: data.transaction || data.transactionId || '',
        });
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (e) {
      console.log('[requestotp] Error:', e);

      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
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
            {/* Background Glow */}
            <View style={styles.topGlow} />
            <View style={styles.bottomGlow} />

            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : hp(3)}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
                automaticallyAdjustKeyboardInsets
              >
                {/* Main Content */}
                <View style={styles.content}>
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

                  {/* Heading */}
                  <Text
                    style={[
                      styles.title,
                      {
                        fontSize: isSmallDevice ? wp(7) : wp(8),
                        marginTop: hp(2),
                      },
                    ]}
                  >
                    Welcome back
                  </Text>

                  {/* Subtitle */}
                  <Text
                    style={[
                      styles.subtitle,
                      {
                        fontSize: wp(4.0),
                        lineHeight: hp(3.4),
                        marginTop: hp(1),
                      },
                    ]}
                  >
                    Enter your mobile number
                  </Text>

                  {/* Input */}
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        marginTop: hp(5),
                        height: hp(6.5),
                      },
                    ]}
                  >
                    <View style={styles.countryCodeContainer}>
                      <Text style={styles.countryCode}>+91</Text>
                    </View>

                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Mobile number"
                      placeholderTextColor="#6F6892"
                      keyboardType="number-pad"
                      maxLength={10}
                      style={styles.input}
                      selectionColor="#8B6FF7"
                    />
                  </View>

                  {/* Button */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    disabled={!isValid || loading}
                    onPress={handleRequestOtp}
                    style={[
                      styles.button,
                      {
                        opacity: isValid ? 1 : 0.5,
                        marginTop: hp(2.4),
                        height: hp(6.5),
                      },
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#1D1636" />
                    ) : (
                      <Text style={styles.buttonText}>Send OTP</Text>
                    )}{' '}
                  </TouchableOpacity>
                  {error ? (
                    <Text
                      style={{
                        color: '#FF7B7B',
                        marginTop: hp(1.4),
                        fontSize: wp(3.5),
                        fontWeight: '500',
                        textAlign: 'center',
                      }}
                    >
                      {error}
                    </Text>
                  ) : null}

                  {/* Bottom Info */}
                  <Text
                    style={[
                      styles.infoText,
                      {
                        marginTop: hp(2.6),
                      },
                    ]}
                  >
                    We'll send a one-time password to verify your number
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
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </LinearGradient>
    </>
  );
};

export default LoginScreen;

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
    justifyContent: 'space-between',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(7),
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
    color: '#F3F2FA',
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
  },

  subtitle: {
    color: '#B7B0D1',
    textAlign: 'center',
    fontWeight: '500',
  },

  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: wp(5),
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },

  countryCodeContainer: {
    width: wp(20),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  countryCode: {
    color: '#D4CCF3',
    fontSize: wp(4.8),
    fontWeight: '700',
  },

  input: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: wp(4.8),
    paddingHorizontal: wp(4.5),
    fontWeight: '600',
  },

  button: {
    width: '100%',
    borderRadius: wp(5),
    backgroundColor: '#8B6FF7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#1D1636',
    fontSize: wp(4.8),
    fontWeight: '800',
  },

  infoText: {
    color: '#928BAA',
    textAlign: 'center',
    fontSize: wp(3.7),
    lineHeight: hp(2.8),
    paddingHorizontal: wp(4),
    fontWeight: '500',
  },

  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
  },

  footerText: {
    color: '#908AA8',
    fontSize: wp(3.5),
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
