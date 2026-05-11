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

import { useTheme } from '../theme/ThemeContext';
import { getLogo } from '../utils/getLogo';

const API_BASE = 'https://unheardapi.primeapps.co.in/api/auth';

const API_TOKEN = 'Bearer Y7N7Mh9Z7ZLeMSYspeVwdXJ2Ky2LXc';

const LoginScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const { theme, isDark } = useTheme();

  const styles = createStyles(theme, isDark);

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
                        source={getLogo(isDark)}
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
                      placeholderTextColor={theme.placeholder}
                      keyboardType="number-pad"
                      maxLength={10}
                      style={styles.input}
                      selectionColor={theme.primary}
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
                      <ActivityIndicator
                        color={isDark ? '#1D1636' : '#FFFFFF'}
                      />
                    ) : (
                      <Text style={styles.buttonText}>Send OTP</Text>
                    )}
                  </TouchableOpacity>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
      letterSpacing: -1,
      textAlign: 'center',
    },

    subtitle: {
      color: theme.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },

    inputContainer: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: wp(5),
      backgroundColor: theme.inputBackground,
      borderWidth: 1.2,
      borderColor: theme.inputBorder,
      overflow: 'hidden',
    },

    countryCodeContainer: {
      width: wp(20),
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      borderRightWidth: 1,
      borderColor: theme.inputBorder,
    },

    countryCode: {
      color: theme.textPrimary,
      fontSize: wp(4.8),
      fontWeight: '700',
    },

    input: {
      flex: 1,
      height: '100%',
      color: theme.textPrimary,
      fontSize: wp(4.8),
      paddingHorizontal: wp(4.5),
      fontWeight: '600',
    },

    button: {
      width: '100%',
      borderRadius: wp(5),
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },

    buttonText: {
      color: isDark ? '#1D1636' : '#FFFFFF',
      fontSize: wp(4.8),
      fontWeight: '800',
    },

    errorText: {
      color: '#FF7B7B',
      marginTop: hp(1.4),
      fontSize: wp(3.5),
      fontWeight: '500',
      textAlign: 'center',
    },

    infoText: {
      color: theme.textSecondary,
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
      color: theme.textSecondary,
      fontSize: wp(3.5),
      fontWeight: '500',
      textAlign: 'center',
      letterSpacing: 0.2,
    },
  });
