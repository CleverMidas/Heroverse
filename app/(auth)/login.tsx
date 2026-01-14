import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, ImageBackground, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { EMAIL_REGEX } from '@/lib/validation';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react-native';
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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailValid, setEmailValid] = useState(false);

  const isFormValid = emailValid && password.length >= 1;

  useEffect(() => {
    if (!email) { setEmailError(null); setEmailValid(false); return; }
    if (!EMAIL_REGEX.test(email)) { setEmailError('Please enter a valid email address'); setEmailValid(false); }
    else { setEmailError(null); setEmailValid(true); }
  }, [email]);

  const handleLogin = async () => {
    setError(null);
    if (!email) { setError('Please enter your email'); return; }
    if (!emailValid) { setError('Please enter a valid email address'); return; }
    if (!password) { setError('Please enter your password'); return; }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) setError('Invalid email or password. Please try again.');
      else if (signInError.message.includes('Email not confirmed')) setError('Please verify your email before signing in.');
      else setError(signInError.message);
    } else { router.replace('/(tabs)'); }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: Platform.OS === 'web' ? window.location.origin : undefined } });
    if (oauthError) setError(oauthError.message);
    setLoading(false);
  };

  const getEmailInputStyle = () => {
    if (!email) return styles.inputContainer;
    if (emailError) return [styles.inputContainer, styles.inputError];
    if (emailValid) return [styles.inputContainer, styles.inputValid];
    return styles.inputContainer;
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.container}><View style={styles.content}><View style={styles.header}><Text style={styles.title}>Welcome Back</Text></View>{error && <View style={styles.errorContainer}><AlertCircle color="#DC2626" size={20} /><Text style={styles.errorText}>{error}</Text></View>}<View style={styles.formContainer}><View><View style={getEmailInputStyle()}><Mail size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Email" placeholderTextColor="rgba(255, 255, 255, 0.5)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />{email && (emailError ? <AlertCircle color="#EF4444" size={18} style={styles.fieldStatus} /> : emailValid && <CheckCircle color="#22C55E" size={18} style={styles.fieldStatus} />)}</View>{emailError && <Text style={styles.fieldError}>{emailError}</Text>}</View><View style={styles.passwordContainer}><View style={styles.inputContainer}><Lock size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} /><TextInput style={[styles.input, styles.inputWithButton]} placeholder="Password" placeholderTextColor="rgba(255, 255, 255, 0.5)" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="password" /><Pressable style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={20} color="rgba(255, 255, 255, 0.7)" /> : <Eye size={20} color="rgba(255, 255, 255, 0.7)" />}</Pressable></View></View><TouchableOpacity style={[styles.authButton, (!isFormValid || loading) && styles.authButtonDisabled]} onPress={handleLogin} disabled={loading || !isFormValid} activeOpacity={0.8}><LinearGradient colors={loading ? ['#94A3B8', '#64748B'] : isFormValid ? ['#3B82F6', '#2563EB'] : ['#64748B', '#475569']} style={styles.authGradient}>{loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.authButtonText}>Sign In</Text>}</LinearGradient></TouchableOpacity><TouchableOpacity style={styles.toggleButton} onPress={() => router.push('/(auth)/signup')} disabled={loading} activeOpacity={0.7}><Text style={styles.toggleText}>Don't have an account? Sign Up</Text></TouchableOpacity><View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View><TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={loading} activeOpacity={0.8}><View style={[styles.googleButtonContent, loading && styles.buttonDisabled]}>{loading ? <ActivityIndicator color="#FFFFFF" /> : <><View style={styles.googleIcon}><Text style={styles.googleIconText}>G</Text></View><Text style={styles.googleButtonText}>Continue with Google</Text></>}</View></TouchableOpacity></View><Text style={styles.terms}>By continuing, you agree to our Terms of Service and Privacy Policy</Text></View></View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  backgroundImage: { flex: 1, width, height },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, minHeight: height },
  container: { flex: 1, justifyContent: 'flex-end', paddingBottom: height * 0.05 },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24, minHeight: height * 0.6 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(254, 226, 226, 0.95)', padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(220, 38, 38, 0.3)' },
  errorText: { flex: 1, color: '#DC2626', fontSize: 14, fontWeight: '500' },
  formContainer: { width: '100%' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 14, paddingHorizontal: 18, height: 58, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.2)' },
  inputError: { borderColor: 'rgba(239, 68, 68, 0.6)', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  inputValid: { borderColor: 'rgba(34, 197, 94, 0.6)', backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 17, color: '#FFFFFF', fontWeight: '500' },
  inputWithButton: { paddingRight: 40 },
  eyeButton: { position: 'absolute', right: 16, padding: 8 },
  fieldStatus: { marginLeft: 8 },
  fieldError: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 18, fontWeight: '500' },
  passwordContainer: { marginTop: 18 },
  authButton: { marginTop: 24, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  authButtonDisabled: { opacity: 0.8 },
  authGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', height: 58 },
  authButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  toggleButton: { paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  toggleText: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  dividerText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, marginHorizontal: 16, fontWeight: '500' },
  googleButton: { borderRadius: 14, overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)' },
  googleButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, height: 56 },
  googleIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  googleIconText: { color: '#3B82F6', fontSize: 14, fontWeight: 'bold' },
  googleButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  terms: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', marginTop: 24, paddingHorizontal: 16 },
});
