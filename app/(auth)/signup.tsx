import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Dimensions, ImageBackground, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const backgroundImage = require('@/assets/sign_bg.jpg');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

interface FieldValidation {
  isValid: boolean;
  isChecking: boolean;
  error: string | null;
}

export default function SignupScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [usernameValidation, setUsernameValidation] = useState<FieldValidation>({ isValid: false, isChecking: false, error: null });
  const [emailValidation, setEmailValidation] = useState<FieldValidation>({ isValid: false, isChecking: false, error: null });
  const [passwordValidation, setPasswordValidation] = useState<FieldValidation>({ isValid: false, isChecking: false, error: null });
  const [confirmPasswordValidation, setConfirmPasswordValidation] = useState<FieldValidation>({ isValid: false, isChecking: false, error: null });

  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkUsernameExists = useCallback(async (value: string) => {
    if (!value || !USERNAME_REGEX.test(value)) return;
    
    setUsernameValidation(prev => ({ ...prev, isChecking: true }));
    
    try {
      const { data, error } = await (supabase.rpc as any)('check_username_exists', { username_to_check: value });
      
      if (error) {
        setUsernameValidation({ isValid: true, isChecking: false, error: null });
        return;
      }
      
      if (data === true) {
        setUsernameValidation({ isValid: false, isChecking: false, error: 'Username already taken' });
      } else {
        setUsernameValidation({ isValid: true, isChecking: false, error: null });
      }
    } catch {
      setUsernameValidation({ isValid: true, isChecking: false, error: null });
    }
  }, []);

  const checkEmailExists = useCallback(async (value: string) => {
    if (!value || !EMAIL_REGEX.test(value)) return;
    
    setEmailValidation(prev => ({ ...prev, isChecking: true }));
    
    try {
      const { data, error } = await (supabase.rpc as any)('check_email_exists', { email_to_check: value });
      
      if (error) {
        setEmailValidation({ isValid: true, isChecking: false, error: null });
        return;
      }
      
      if (data === true) {
        setEmailValidation({ isValid: false, isChecking: false, error: 'Email already registered' });
      } else {
        setEmailValidation({ isValid: true, isChecking: false, error: null });
      }
    } catch {
      setEmailValidation({ isValid: true, isChecking: false, error: null });
    }
  }, []);

  useEffect(() => {
    if (!username) {
      setUsernameValidation({ isValid: false, isChecking: false, error: null });
      return;
    }

    if (!USERNAME_REGEX.test(username)) {
      setUsernameValidation({ 
        isValid: false, 
        isChecking: false, 
        error: username.length < 3 ? 'Username must be at least 3 characters' : 
               username.length > 20 ? 'Username must be at most 20 characters' :
               'Username can only contain letters, numbers, and underscores' 
      });
      return;
    }

    setUsernameValidation(prev => ({ ...prev, isChecking: true, error: null }));
    
    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    usernameDebounceRef.current = setTimeout(() => checkUsernameExists(username), 500);
    
    return () => {
      if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    };
  }, [username, checkUsernameExists]);

  useEffect(() => {
    if (!email) {
      setEmailValidation({ isValid: false, isChecking: false, error: null });
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setEmailValidation({ isValid: false, isChecking: false, error: 'Please enter a valid email address' });
      return;
    }

    setEmailValidation(prev => ({ ...prev, isChecking: true, error: null }));
    
    if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
    emailDebounceRef.current = setTimeout(() => checkEmailExists(email), 500);
    
    return () => {
      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
    };
  }, [email, checkEmailExists]);

  useEffect(() => {
    if (!password) {
      setPasswordValidation({ isValid: false, isChecking: false, error: null });
      return;
    }

    if (password.length < 6) {
      setPasswordValidation({ isValid: false, isChecking: false, error: 'Password must be at least 6 characters' });
    } else {
      setPasswordValidation({ isValid: true, isChecking: false, error: null });
    }
  }, [password]);

  useEffect(() => {
    if (!confirmPassword) {
      setConfirmPasswordValidation({ isValid: false, isChecking: false, error: null });
      return;
    }

    if (confirmPassword !== password) {
      setConfirmPasswordValidation({ isValid: false, isChecking: false, error: 'Passwords do not match' });
    } else if (password.length >= 6) {
      setConfirmPasswordValidation({ isValid: true, isChecking: false, error: null });
    } else {
      setConfirmPasswordValidation({ isValid: false, isChecking: false, error: null });
    }
  }, [confirmPassword, password]);

  const isFormValid = usernameValidation.isValid && emailValidation.isValid && passwordValidation.isValid && confirmPasswordValidation.isValid;

  const handleSignup = async () => {
    setError(null);

    if (!username) {
      setError('Username is required');
      return;
    }

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (!isFormValid) {
      if (usernameValidation.error) setError(usernameValidation.error);
      else if (emailValidation.error) setError(emailValidation.error);
      else if (passwordValidation.error) setError(passwordValidation.error);
      else if (confirmPasswordValidation.error) setError(confirmPasswordValidation.error);
      else setError('Please fix the errors above');
      return;
    }

    setLoading(true);

    const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: username,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        setError('This email is already registered. Please sign in instead.');
        setEmailValidation({ isValid: false, isChecking: false, error: 'Email already registered' });
      } else if (signUpError.message.includes('valid email')) {
        setError('Please enter a valid email address.');
        setEmailValidation({ isValid: false, isChecking: false, error: 'Invalid email address' });
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    // Check if user was actually created (some Supabase configs return success but no user for existing emails)
    if (!signUpData.user) {
      setError('This email is already registered. Please sign in instead.');
      setEmailValidation({ isValid: false, isChecking: false, error: 'Email already registered' });
      setLoading(false);
      return;
    }

    // Update username in profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', signUpData.user.id);
    
    if (updateError) {
      if (updateError.message.includes('unique') || updateError.message.includes('duplicate') || updateError.code === '23505') {
        setError('This username is already taken. Please choose another.');
        setUsernameValidation({ isValid: false, isChecking: false, error: 'Username already taken' });
        setLoading(false);
        return;
      }
      console.warn('Failed to update username:', updateError);
    }

    router.replace('/(tabs)');
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
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

  const getInputStyle = (validation: FieldValidation, hasValue: boolean) => {
    if (!hasValue) return styles.inputContainer;
    if (validation.isChecking) return [styles.inputContainer, styles.inputChecking];
    if (validation.error) return [styles.inputContainer, styles.inputError];
    if (validation.isValid) return [styles.inputContainer, styles.inputValid];
    return styles.inputContainer;
  };

  const renderFieldStatus = (validation: FieldValidation, hasValue: boolean) => {
    if (!hasValue) return null;
    if (validation.isChecking) {
      return <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.7)" style={styles.fieldStatus} />;
    }
    if (validation.error) {
      return <AlertCircle color="#EF4444" size={18} style={styles.fieldStatus} />;
    }
    if (validation.isValid) {
      return <CheckCircle color="#22C55E" size={18} style={styles.fieldStatus} />;
    }
    return null;
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
              <View style={styles.content}>
                <View style={styles.header}>
                  <Text style={styles.title}>Create Account</Text>
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <AlertCircle color="#DC2626" size={20} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.formContainer}>
                  <View>
                    <View style={getInputStyle(usernameValidation, !!username)}>
                      <User size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Username"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoComplete="username"
                      />
                      {renderFieldStatus(usernameValidation, !!username)}
                    </View>
                    {usernameValidation.error && (
                      <Text style={styles.fieldError}>{usernameValidation.error}</Text>
                    )}
                  </View>

                  <View>
                    <View style={getInputStyle(emailValidation, !!email)}>
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
                      {renderFieldStatus(emailValidation, !!email)}
                    </View>
                    {emailValidation.error && (
                      <Text style={styles.fieldError}>{emailValidation.error}</Text>
                    )}
                  </View>

                  <View>
                    <View style={getInputStyle(passwordValidation, !!password)}>
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
                      {renderFieldStatus(passwordValidation, !!password)}
                      <Pressable style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={20} color="rgba(255, 255, 255, 0.7)" /> : <Eye size={20} color="rgba(255, 255, 255, 0.7)" />}
                      </Pressable>
                    </View>
                    {passwordValidation.error && (
                      <Text style={styles.fieldError}>{passwordValidation.error}</Text>
                    )}
                  </View>

                  <View>
                    <View style={getInputStyle(confirmPasswordValidation, !!confirmPassword)}>
                      <Lock size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, styles.inputWithButton]}
                        placeholder="Confirm Password"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                      />
                      {renderFieldStatus(confirmPasswordValidation, !!confirmPassword)}
                      <Pressable style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff size={20} color="rgba(255, 255, 255, 0.7)" /> : <Eye size={20} color="rgba(255, 255, 255, 0.7)" />}
                      </Pressable>
                    </View>
                    {confirmPasswordValidation.error && (
                      <Text style={styles.fieldError}>{confirmPasswordValidation.error}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.authButton, (!isFormValid || loading) && styles.authButtonDisabled]}
                    onPress={handleSignup}
                    disabled={loading || !isFormValid}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={loading ? ['#94A3B8', '#64748B'] : isFormValid ? ['#22C55E', '#16A34A'] : ['#64748B', '#475569']}
                      style={styles.authGradient}
                    >
                      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.authButtonText}>Sign Up</Text>}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.toggleButton} onPress={() => router.push('/(auth)/login')} disabled={loading} activeOpacity={0.7}>
                    <Text style={styles.toggleText}>Already have an account? Sign In</Text>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignup} disabled={loading} activeOpacity={0.8}>
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

                <Text style={styles.terms}>By continuing, you agree to our Terms of Service and Privacy Policy</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  backgroundImage: { flex: 1, width: width, height: height },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, minHeight: height },
  container: { flex: 1, justifyContent: 'flex-end', paddingBottom: height * 0.03 },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(254, 226, 226, 0.95)', padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(220, 38, 38, 0.3)' },
  errorText: { flex: 1, color: '#DC2626', fontSize: 14, fontWeight: '500' },
  formContainer: { width: '100%', gap: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 14, paddingHorizontal: 18, height: 58, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.2)' },
  inputChecking: { borderColor: 'rgba(59, 130, 246, 0.5)', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  inputError: { borderColor: 'rgba(239, 68, 68, 0.6)', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  inputValid: { borderColor: 'rgba(34, 197, 94, 0.6)', backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 17, color: '#FFFFFF', fontWeight: '500' },
  inputWithButton: { paddingRight: 70 },
  eyeButton: { position: 'absolute', right: 16, padding: 8 },
  fieldStatus: { marginLeft: 8 },
  fieldError: { color: '#EF4444', fontSize: 12, marginTop: 4, marginBottom: 10, marginLeft: 18, fontWeight: '500' },
  authButton: { marginTop: 16, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  authButtonDisabled: { opacity: 0.8 },
  authGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', height: 58 },
  authButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  toggleButton: { paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  toggleText: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  dividerText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, marginHorizontal: 16, fontWeight: '500' },
  googleButton: { borderRadius: 14, overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)' },
  googleButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, height: 56 },
  googleIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  googleIconText: { color: '#3B82F6', fontSize: 14, fontWeight: 'bold' },
  googleButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  terms: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', marginTop: 20, paddingHorizontal: 16 },
});
