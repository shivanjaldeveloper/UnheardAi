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

import AsyncStorage from '@react-native-async-storage/async-storage';

import { wp, hp } from '../utils/responsive';

const API_BASE = 'https://unheardapi.primeapps.co.in/api';
const API_AUTH = 'Bearer Y7N7Mh9Z7ZLeMSYspeVwdXJ2Ky2LXc';

const RegistrationScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallDevice = height < 700;

  const logoSize = width * 0.22;

  const { token, mobile, profileId } = route?.params || {};

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<any>({});

  const isValid =
    fullName.trim().length > 0 &&
    username.trim().length > 0 &&
    email.trim().length > 0;

  const validate = () => {
    const newErrors: any = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Enter valid email';
    }

    return newErrors;
  };

  const handleContinue = async () => {
    if (loading) return;

    Keyboard.dismiss();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const url =
        `${API_BASE}/profile/profileupdate` +
        `?token=${encodeURIComponent(token)}` +
        `&email=${encodeURIComponent(email.trim().toLowerCase())}` +
        `&fullname=${encodeURIComponent(fullName.trim())}` +
        `&profileid=${encodeURIComponent(profileId)}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: API_AUTH,
        },
      });

      const data = await res.json();

      console.log('PROFILE UPDATE RESPONSE => ', data);

      if (res.ok && data.status === 'success') {
        await AsyncStorage.setItem(
          'userProfile',
          JSON.stringify({
            mobile,
            fullname: fullName.trim(),
            username: username.trim(),
            email: email.trim().toLowerCase(),
            token,
            profileId,
          }),
        );

        navigation.replace('EmotionalEntry', {
          token,
          profileId,
        });
      } else {
        setErrors({
          general: data.message || 'Profile update failed.',
        });
      }
    } catch (e) {
      console.log('REGISTRATION ERROR => ', e);

      setErrors({
        general: 'Network error. Please try again.',
      });
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
        {/* Background Glow */}
        <View style={styles.topGlow} />
        <View style={styles.bottomGlow} />

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

                {/* Subtitle */}
                <Text
                  style={[
                    styles.subtitle,
                    {
                      fontSize: wp(6),
                      lineHeight: hp(3.2),
                    },
                  ]}
                >
                  Tell us a little about Yourself
                </Text>

                {/* Phone Badge */}
                <View style={styles.phonePill}>
                  <Text style={styles.phonePillText}>+91 {mobile}</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                  {/* Full Name */}
                  <Text style={styles.label}>FULL NAME</Text>

                  <TextInput
                    value={fullName}
                    onChangeText={text => {
                      setFullName(text);

                      if (errors.fullName) {
                        setErrors((prev: any) => ({
                          ...prev,
                          fullName: null,
                        }));
                      }
                    }}
                    placeholder="How should we call you?"
                    placeholderTextColor="#5A5480"
                    style={styles.input}
                    returnKeyType="next"
                    autoCapitalize="words"
                    selectionColor="#8B6FF7"
                  />

                  {!!errors.fullName && (
                    <Text
                      style={{
                        color: '#ff6b6b',
                        marginBottom: hp(1),
                        marginTop: -hp(1),
                        fontSize: wp(3.2),
                      }}
                    >
                      {errors.fullName}
                    </Text>
                  )}

                  {/* Username */}
                  <Text style={styles.label}>USERNAME</Text>

                  <TextInput
                    value={username}
                    onChangeText={text => {
                      setUsername(text);

                      if (errors.username) {
                        setErrors((prev: any) => ({
                          ...prev,
                          username: null,
                        }));
                      }
                    }}
                    placeholder="e.g. quiet_thinker"
                    placeholderTextColor="#5A5480"
                    style={styles.input}
                    returnKeyType="next"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor="#8B6FF7"
                  />

                  {!!errors.username && (
                    <Text
                      style={{
                        color: '#ff6b6b',
                        marginBottom: hp(1),
                        marginTop: -hp(1),
                        fontSize: wp(3.2),
                      }}
                    >
                      {errors.username}
                    </Text>
                  )}

                  {/* Email */}
                  <Text style={styles.label}>EMAIL</Text>

                  <TextInput
                    value={email}
                    onChangeText={text => {
                      setEmail(text);

                      if (errors.email) {
                        setErrors((prev: any) => ({
                          ...prev,
                          email: null,
                        }));
                      }
                    }}
                    placeholder="your@email.com"
                    placeholderTextColor="#5A5480"
                    style={styles.input}
                    returnKeyType="done"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor="#8B6FF7"
                  />

                  {!!errors.email && (
                    <Text
                      style={{
                        color: '#ff6b6b',
                        marginBottom: hp(1),
                        marginTop: -hp(1),
                        fontSize: wp(3.2),
                      }}
                    >
                      {errors.email}
                    </Text>
                  )}

                  {!!errors.general && (
                    <Text
                      style={{
                        color: '#ff6b6b',
                        marginTop: hp(1),
                        textAlign: 'center',
                        fontSize: wp(3.5),
                      }}
                    >
                      {errors.general}
                    </Text>
                  )}
                </View>

                {/* Continue */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  disabled={!isValid || loading}
                  onPress={handleContinue}
                  style={[
                    styles.button,
                    {
                      opacity: isValid && !loading ? 1 : 0.5,
                    },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#1D1636" />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </TouchableOpacity>

                {/* Footer */}
                <Text
                  style={[
                    styles.privacyText,
                    {
                      marginBottom: insets.bottom > 0 ? insets.bottom : hp(2),
                    },
                  ]}
                >
                  Your details are private and never shared
                </Text>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </LinearGradient>
    </>
  );
};

export default RegistrationScreen;

/* KEEP YOUR EXISTING STYLES SAME */

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
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
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
    marginBottom: hp(0),
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

  subtitle: {
    color: '#F3F2FA',
    textAlign: 'center',
    fontWeight: '500',
    width: '100%',
    marginTop: hp(1.2),
  },

  phonePill: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: wp(10),
    paddingVertical: hp(1),
    paddingHorizontal: wp(5),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: hp(1),
    marginBottom: hp(3),
  },

  phonePillText: {
    color: '#D4CCF3',
    fontSize: wp(3.8),
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  form: {
    width: '100%',
  },

  label: {
    color: '#7A7499',
    fontSize: wp(2.8),
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: hp(0.8),
    marginTop: hp(0.5),
  },

  input: {
    width: '100%',
    height: hp(6.5),
    borderRadius: wp(4.5),
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#FFFFFF',
    fontSize: wp(4.2),
    paddingHorizontal: wp(4.5),
    fontWeight: '500',
    marginBottom: hp(2),
  },

  button: {
    width: '100%',
    height: hp(6.5),
    borderRadius: wp(5),
    backgroundColor: '#8B6FF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(1),
    marginBottom: hp(2.5),
  },

  buttonText: {
    color: '#1D1636',
    fontSize: wp(4.5),
    fontWeight: '800',
  },

  privacyText: {
    color: '#7A7499',
    fontSize: wp(3.4),
    fontWeight: '500',
    textAlign: 'center',
  },
});
