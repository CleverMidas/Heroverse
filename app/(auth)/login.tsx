import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, ImageBackground, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const backgroundImage = require('@/assets/sign_bg.jpg');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      router.replace('/(tabs)');
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: Platform.OS === 'web' ? window.location.origin : undefined,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
    }

    setLoading(false);
  };

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>
              <View style={styles.content}>
                <View style={styles.header}>
                  <Text style={styles.title}>Welcome Back</Text>
                </View>

                {error ? (
                  <View style={styles.errorContainer}>
                    <AlertCircle color="#DC2626" size={20} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Mail size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Lock size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.inputWithButton]}
                      placeholder="Password"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                    />
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="rgba(255, 255, 255, 0.7)" />
                      ) : (
                        <Eye size={20} color="rgba(255, 255, 255, 0.7)" />
                      )}
                    </Pressable>
                  </View>

                  <TouchableOpacity
                    style={styles.authButton}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={loading ? ['#94A3B8', '#64748B'] : ['#3B82F6', '#2563EB']}
                      style={styles.authGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.authButtonText}>Sign In</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => router.push('/(auth)/signup')}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.toggleText}>Don't have an account? Sign Up</Text>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.googleButtonContent, loading && styles.buttonDisabled]}>
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <View style={styles.googleIcon}>
                            <Text style={styles.googleIconText}>G</Text>
                          </View>
                          <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={styles.terms}>
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: height * 0.05,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    minHeight: height * 0.6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(254, 226, 226, 0.95)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    marginBottom: 18,
    paddingHorizontal: 18,
    height: 58,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inputWithButton: {
    paddingRight: 40,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  authButton: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  authGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  toggleText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: '500',
  },
  googleButton: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    height: 56,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: { opacity: 0.5 },
  terms: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', marginTop: 24, paddingHorizontal: 16 },
});
