import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  useWindowDimensions,
  Image,
  ActivityIndicator,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { getLogo } from '../utils/getLogo';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { wp, hp } from '../utils/responsive';

const API_BASE = 'https://unheardapi.primeapps.co.in/api/auth';
const API_TOKEN = 'Bearer Y7N7Mh9Z7ZLeMSYspeVwdXJ2Ky2LXc';

const OtpScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const { theme, isDark } = useTheme();

  const styles = createStyles(theme, isDark);

  const isSmallDevice = height < 700;
  const { width } = useWindowDimensions();

  const logoSize = width * 0.22;

  const { mobile, transaction } = route.params || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resending, setResending] = useState(false);

  const inputs = useRef<any[]>([]);
  const verifyLock = useRef(false);

  useEffect(() => {
    setTimeout(() => {
      inputs.current[0]?.focus();
    }, 300);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setTimeout(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '');

    if (clean.length > 1) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = clean;

    setOtp(updatedOtp);
    setError('');

    if (clean && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (!clean && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    const fullOtp = otp.join('');

    if (fullOtp.length === 6 && !loading && !verifyLock.current) {
      verifyLock.current = true;
      handleVerify(fullOtp);
    }
  }, [otp]);

  const handleVerify = async (fullOtp?: string) => {
    const finalOtp = fullOtp || otp.join('');

    if (finalOtp.length < 6 || loading) {
      verifyLock.current = false;
      return;
    }

    Keyboard.dismiss();

    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `${API_BASE}/verifyotp?mobile=${mobile}&transaction=${transaction}&otp=${finalOtp}`,
        {
          method: 'POST',
          headers: {
            Authorization: API_TOKEN,
          },
        },
      );

      const data = await res.json();

      console.log('VERIFY OTP RESPONSE => ', data);

      if (res.ok && data.status === 'success') {
        await AsyncStorage.multiSet([
          ['authToken', data.token || ''],
          ['mobile', data.mobile || ''],
          ['profileId', data.profileid || ''],
          ['userProfile', JSON.stringify(data)],
        ]);

        setTimeout(() => {
          verifyLock.current = false;

          if (data.isprofilenew === 'yes') {
            navigation.replace('Registration', {
              token: data.token,
              mobile: data.mobile,
              profileId: data.profileid,
            });
          } else {
            navigation.replace('EmotionalEntry', {
              token: data.token,
              profileId: data.profileid,
            });
          }
        }, 300);
      } else {
        setError(data.message || 'Invalid OTP');

        setOtp(['', '', '', '', '', '']);

        setTimeout(() => {
          inputs.current[0]?.focus();
        }, 150);

        verifyLock.current = false;
      }
    } catch (e) {
      console.log('VERIFY OTP ERROR => ', e);

      setError('Network error. Please try again.');

      setOtp(['', '', '', '', '', '']);

      setTimeout(() => {
        inputs.current[0]?.focus();
      }, 150);

      verifyLock.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setError('');

    try {
      await fetch(`${API_BASE}/requestotp?mobile=${mobile}`, {
        method: 'POST',
        headers: {
          Authorization: API_TOKEN,
        },
      });

      setOtp(['', '', '', '', '', '']);

      verifyLock.current = false;

      setResendCooldown(30);

      setTimeout(() => {
        inputs.current[0]?.focus();
      }, 150);
    } catch (e) {
      setError('Could not resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const isValid = otp.join('').length === 6;

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      <LinearGradient colors={theme.gradient} style={styles.container}>
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
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : hp(2)}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.scrollContent,
                  {
                    paddingBottom: hp(10),
                  },
                ]}
                automaticallyAdjustKeyboardInsets
                keyboardDismissMode="on-drag"
                bounces={false}
              >
                {/* Back */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                >
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                {/* Content */}
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
                        source={getLogo(isDark)}
                        style={styles.logo}
                        resizeMode="contain"
                      />
                    </View>
                  </View>

                  {/* Title */}
                  <Text
                    style={[
                      styles.title,
                      {
                        fontSize: isSmallDevice ? wp(8) : wp(9),
                      },
                    ]}
                  >
                    Verify OTP
                  </Text>

                  {/* Subtitle */}
                  <Text
                    style={[
                      styles.subtitle,
                      {
                        fontSize: wp(4),
                        lineHeight: hp(3.2),
                      },
                    ]}
                  >
                    We sent a 6-digit code{'\n'}
                    to +91 {mobile}
                  </Text>

                  {/* OTP */}
                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={ref => {
                          if (ref) {
                            inputs.current[index] = ref;
                          }
                        }}
                        value={digit}
                        onChangeText={text => handleChange(text, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        style={styles.otpInput}
                        selectionColor={theme.primary}
                      />
                    ))}
                  </View>

                  {!!error && (
                    <Text
                      style={{
                        color: '#ff6b6b',
                        marginBottom: hp(2),
                        fontSize: wp(3.7),
                        fontWeight: '600',
                        textAlign: 'center',
                      }}
                    >
                      {error}
                    </Text>
                  )}

                  {/* Button */}
                  <TouchableOpacity
                    activeOpacity={0.88}
                    disabled={!isValid || loading}
                    onPress={() => handleVerify()}
                    style={[
                      styles.button,
                      {
                        opacity: isValid && !loading ? 1 : 0.5,
                      },
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator
                        color={isDark ? '#1D1636' : '#FFFFFF'}
                      />
                    ) : (
                      <Text style={styles.buttonText}>Verify & Continue</Text>
                    )}
                  </TouchableOpacity>

                  {/* Resend */}
                  <View style={styles.resendRow}>
                    <Text style={styles.resendText}>Didn't receive?</Text>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={resendCooldown > 0 || resending}
                      onPress={handleResend}
                    >
                      <Text style={styles.resendButton}>
                        {resending
                          ? 'Sending...'
                          : resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : 'Resend OTP'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </LinearGradient>
    </>
  );
};

export default OtpScreen;

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

    backButton: {
      marginTop: hp(1),

      flexDirection: 'row',
      alignItems: 'center',

      gap: wp(1.5),

      backgroundColor: theme.overlay,

      borderRadius: wp(10),

      paddingVertical: hp(0.9),
      paddingHorizontal: wp(4),

      borderWidth: 1.2,
      borderColor: theme.border,

      alignSelf: 'flex-start',
    },

    backText: {
      color: theme.textPrimary,
      fontSize: wp(3.5),
      fontWeight: '700',
    },

    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: hp(1),
      paddingBottom: hp(8),
    },

    logoOuter: {
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.overlay,
    },

    logoInner: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.card,
    },

    logo: {
      width: '58%',
      height: '58%',
    },

    title: {
      color: theme.textPrimary,
      fontWeight: '800',
      textAlign: 'center',
      letterSpacing: -1,
    },

    subtitle: {
      color: theme.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
      marginTop: hp(1.5),
    },

    otpContainer: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: hp(5),
      marginBottom: hp(3),
    },

    otpInput: {
      width: wp(13),
      height: hp(7),
      borderRadius: wp(3.5),
      borderWidth: 1.2,
      borderColor: theme.inputBorder,
      backgroundColor: theme.inputBackground,
      color: theme.textPrimary,
      fontSize: wp(6),
      fontWeight: '800',
      textAlign: 'center',
    },

    button: {
      width: '100%',
      height: hp(6.5),
      borderRadius: wp(5),
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },

    buttonText: {
      color: isDark ? '#1D1636' : '#FFFFFF',
      fontSize: wp(4.5),
      fontWeight: '800',
    },

    resendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: hp(3),
      gap: wp(2),
      flexWrap: 'wrap',
      justifyContent: 'center',
    },

    resendText: {
      color: theme.textSecondary,
      fontSize: wp(3.8),
      fontWeight: '500',
    },

    resendButton: {
      color: theme.primary,
      fontSize: wp(3.8),
      fontWeight: '700',
    },
  });
