import { View, Text, TouchableOpacity, ScrollView, Alert, Platform, Switch, Modal, TextInput, ActivityIndicator, ImageBackground, Dimensions, StyleSheet } from 'react-native';
import { useState, useMemo, useEffect, useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { User, LogOut, Shield, HelpCircle, Mail, ChevronRight, Zap, Info, Bell, Globe, Gift, Copy, Twitter, MessageCircle, Coins, TrendingUp, Users, Check, X, Edit3, Sun, Moon, Plus, AlertCircle, CheckCircle, Smartphone, Key } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const BG = require('@/assets/home_bg.jpg');

interface ReferralStats { referral_code: string; invite_count: number; total_earned: number; used_referral_code: string | null; }
interface MFAFactor { id: string; type: string; friendly_name?: string; }

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, signOut, updateProfile, changePassword, refreshProfile, checkMFAStatus } = useAuth();
  const { stackedHeroes } = useGame();
  const { theme, isDark, toggleTheme } = useTheme();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [applyingCode, setApplyingCode] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [referralSuccess, setReferralSuccess] = useState<string | null>(null);
  const [hasUsedReferral, setHasUsedReferral] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<MFAFactor[]>([]);
  const [loadingMFA, setLoadingMFA] = useState(true);
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [mfaStep, setMfaStep] = useState<'setup' | 'verify' | 'disable'>('setup');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  const { totalHeroCount, totalEarningRate } = useMemo(() => ({
    totalHeroCount: stackedHeroes.reduce((sum, s) => sum + s.count, 0),
    totalEarningRate: stackedHeroes.reduce((sum, s) => sum + s.totalEarningRate, 0),
  }), [stackedHeroes]);

  const overlayColor = isDark ? 'rgba(10, 15, 30, 0.88)' : 'rgba(248, 250, 252, 0.75)';

  const fetchReferralStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const { data, error } = await (supabase.rpc as any)('get_referral_stats');
      if (!error && data?.success) {
        setReferralStats({ referral_code: data.referral_code || profile?.referral_code || `HERO${profile?.id?.slice(0, 6).toUpperCase()}`, invite_count: data.invite_count || 0, total_earned: data.total_earned || 0, used_referral_code: data.used_referral_code || null });
        setHasUsedReferral(!!data.used_referral_code);
      } else {
        setReferralStats({ referral_code: profile?.referral_code || `HERO${profile?.id?.slice(0, 6).toUpperCase()}`, invite_count: 0, total_earned: 0, used_referral_code: null });
      }
    } catch {
      setReferralStats({ referral_code: profile?.referral_code || `HERO${profile?.id?.slice(0, 6).toUpperCase()}`, invite_count: 0, total_earned: 0, used_referral_code: null });
    }
    setLoadingStats(false);
  }, [profile]);

  useEffect(() => { fetchReferralStats(); }, [fetchReferralStats]);

  const fetchMFAStatus = useCallback(async () => {
    setLoadingMFA(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data) {
        const verifiedFactors = data.totp.filter((f: any) => f.status === 'verified');
        setMfaFactors(verifiedFactors);
        setMfaEnabled(verifiedFactors.length > 0);
      }
    } catch { setMfaEnabled(false); }
    setLoadingMFA(false);
  }, []);

  useEffect(() => { fetchMFAStatus(); }, [fetchMFAStatus]);

  const handleEnrollMFA = async () => {
    setMfaError(null);
    setMfaLoading(true);
    try {
      const { data: existingFactors } = await supabase.auth.mfa.listFactors();
      const unverifiedFactors = existingFactors?.totp?.filter((f: any) => f.status === 'unverified') || [];
      for (const factor of unverifiedFactors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator App' });
      if (error) { setMfaError(error.message); setMfaLoading(false); return; }
      if (data) {
        setTotpSecret(data.totp.secret);
        setMfaFactorId(data.id);
        setMfaStep('verify');
      }
    } catch (e: any) { setMfaError(e.message || 'Failed to setup MFA'); }
    setMfaLoading(false);
  };

  const handleVerifyMFA = async () => {
    if (totpCode.length !== 6) { setMfaError('Please enter a 6-digit code'); return; }
    setMfaError(null);
    setMfaLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challengeError) { setMfaError(challengeError.message); setMfaLoading(false); return; }
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: mfaFactorId, challengeId: challengeData.id, code: totpCode });
      if (verifyError) { setMfaError('Invalid code. Please try again.'); setMfaLoading(false); return; }
      setMfaEnabled(true);
      fetchMFAStatus();
      await checkMFAStatus();
      closeMFAModal();
      Alert.alert('Success', 'Two-factor authentication has been enabled!');
    } catch (e: any) { setMfaError(e.message || 'Failed to verify code'); }
    setMfaLoading(false);
  };

  const handleDisableMFA = async () => {
    if (totpCode.length !== 6) { setMfaError('Please enter a 6-digit code to confirm'); return; }
    setMfaError(null);
    setMfaLoading(true);
    try {
      const factor = mfaFactors[0];
      if (!factor) { setMfaError('No MFA factor found'); setMfaLoading(false); return; }
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
      if (challengeError) { setMfaError(challengeError.message); setMfaLoading(false); return; }
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challengeData.id, code: totpCode });
      if (verifyError) { setMfaError('Invalid code. Please try again.'); setMfaLoading(false); return; }
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (unenrollError) { setMfaError(unenrollError.message); setMfaLoading(false); return; }
      setMfaEnabled(false);
      setMfaFactors([]);
      await checkMFAStatus();
      closeMFAModal();
      Alert.alert('Success', 'Two-factor authentication has been disabled.');
    } catch (e: any) { setMfaError(e.message || 'Failed to disable MFA'); }
    setMfaLoading(false);
  };

  const openMFASetup = () => { setMfaStep('setup'); setTotpCode(''); setTotpSecret(''); setMfaError(null); setShowMFAModal(true); handleEnrollMFA(); };
  const openMFADisable = () => { setMfaStep('disable'); setTotpCode(''); setMfaError(null); setShowMFAModal(true); };
  const closeMFAModal = () => { setShowMFAModal(false); setTotpCode(''); setTotpSecret(''); setMfaError(null); setMfaStep('setup'); };
  const handleCopySecret = async () => { await Clipboard.setStringAsync(totpSecret); setSecretCopied(true); setTimeout(() => setSecretCopied(false), 2000); };

  const handleSignOut = () => {
    if (Platform.OS === 'web') { signOut(); router.replace('/(auth)/login'); }
    else Alert.alert('Sign Out', 'Are you sure you want to sign out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login'); } }]);
  };

  const handleCopyReferral = async () => { await Clipboard.setStringAsync(referralStats?.referral_code || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleOpenEditModal = () => { setNewUsername(profile?.username || ''); setNewPassword(''); setConfirmPassword(''); setShowEditModal(true); };

  const handleSaveProfile = async () => {
    if (!newUsername.trim()) { Alert.alert('Error', 'Username cannot be empty'); return; }
    if (newUsername.trim().length < 3) { Alert.alert('Error', 'Username must be at least 3 characters'); return; }
    if (newPassword && newPassword.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    if (newPassword && newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    setSaving(true);
    const profileSuccess = await updateProfile({ username: newUsername.trim() });
    const passwordSuccess = newPassword ? await changePassword(newPassword) : true;
    setSaving(false);
    if (profileSuccess && passwordSuccess) { setShowEditModal(false); setNewPassword(''); setConfirmPassword(''); Alert.alert('Success', newPassword ? 'Profile and password updated!' : 'Profile updated!'); }
    else Alert.alert('Error', !profileSuccess ? 'Failed to update profile' : 'Failed to change password');
  };

  const handleApplyReferralCode = async () => {
    if (!referralCodeInput.trim()) { setReferralError('Please enter a referral code'); return; }
    setApplyingCode(true); setReferralError(null); setReferralSuccess(null);
    try {
      const { data, error } = await (supabase.rpc as any)('apply_referral_code', { code: referralCodeInput.trim() });
      if (error) { setReferralError(error.message || 'Failed to apply code'); setApplyingCode(false); return; }
      if (data?.success) {
        setReferralSuccess(`Code applied! ${data.referrer} received ${data.bonus_given} SC bonus.`);
        setHasUsedReferral(true); refreshProfile();
        setTimeout(() => { setShowReferralModal(false); setReferralCodeInput(''); setReferralSuccess(null); }, 2500);
      } else { setReferralError(data?.error || 'Failed to apply code'); }
    } catch (e: any) { setReferralError(e.message || 'Failed to apply code'); }
    setApplyingCode(false);
  };

  const closeReferralModal = () => { setShowReferralModal(false); setReferralCodeInput(''); setReferralError(null); setReferralSuccess(null); };

  const generalMenuItems = [
    { icon: User, title: 'Account', description: 'Manage your profile', color: theme.colors.primary, onPress: handleOpenEditModal },
    { icon: Globe, title: 'Language', description: 'English (US)', color: theme.colors.info, onPress: () => {} },
  ];

  const supportMenuItems = [
    { icon: HelpCircle, title: 'Help Center', description: 'FAQs & tutorials', color: '#06B6D4', onPress: () => {} },
    { icon: MessageCircle, title: 'Contact Support', description: 'Get help from our team', color: '#10B981', onPress: () => {} },
    { icon: Info, title: 'About HeroVerse', description: 'Version & legal info', color: '#6366F1', onPress: () => {} },
  ];

  return (
    <ImageBackground source={BG} style={s.bg} resizeMode="cover">
      <View style={[s.overlay, { backgroundColor: overlayColor }]}>
        <SafeAreaView style={s.flex1}>
          <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
            <ProfileCard profile={profile} user={user} totalHeroCount={totalHeroCount} totalEarningRate={totalEarningRate} theme={theme} onEdit={handleOpenEditModal} />
            <AppearanceSection isDark={isDark} toggleTheme={toggleTheme} theme={theme} />
            <MFASection mfaEnabled={mfaEnabled} loading={loadingMFA} onEnable={openMFASetup} onDisable={openMFADisable} theme={theme} />
            <ReferralSection referralCode={referralStats?.referral_code || ''} inviteCount={referralStats?.invite_count || 0} totalEarned={referralStats?.total_earned || 0} usedReferralCode={referralStats?.used_referral_code || null} copied={copied} onCopy={handleCopyReferral} loading={loadingStats} hasUsedReferral={hasUsedReferral} onEnterCode={() => setShowReferralModal(true)} theme={theme} />
            <NotificationsSection push={pushNotifications} email={emailNotifications} setPush={setPushNotifications} setEmail={setEmailNotifications} isDark={isDark} theme={theme} />
            <MenuSection title="General" items={generalMenuItems} theme={theme} />
            <MenuSection title="Support" items={supportMenuItems} theme={theme} />
            <SocialSection theme={theme} />
            <TouchableOpacity style={[s.signOutBtn, { backgroundColor: theme.colors.errorLight, borderColor: `${theme.colors.error}30` }]} onPress={handleSignOut}><LogOut color={theme.colors.error} size={18} /><Text style={[s.signOutText, { color: theme.colors.error }]}>Sign Out</Text></TouchableOpacity>
            <View style={s.footerCenter}><Text style={[s.footerVersion, { color: theme.colors.textMuted }]}>HeroVerse v1.0.0</Text><Text style={[s.footerCopy, { color: theme.colors.textMuted }]}>© 2026 HeroVerse. All rights reserved.</Text></View>
            <View style={s.spacer} />
          </ScrollView>
          <EditProfileModal visible={showEditModal} onClose={() => setShowEditModal(false)} username={newUsername} setUsername={setNewUsername} password={newPassword} setPassword={setNewPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} showPassword={showPassword} setShowPassword={setShowPassword} saving={saving} onSave={handleSaveProfile} theme={theme} />
          <Modal visible={showReferralModal} transparent animationType="fade" onRequestClose={closeReferralModal}>
            <View style={[s.modalBg, { backgroundColor: theme.colors.overlay }]}>
              <View style={[s.modalCard, { backgroundColor: theme.colors.modalBackground }]}>
                <View style={s.modalHeader}><View style={s.modalHeaderRow}><View style={s.modalHeaderIcon}><Gift color={theme.colors.primary} size={24} /></View><Text style={[s.modalHeaderTitle, { color: theme.colors.text }]}>Enter Referral Code</Text></View><TouchableOpacity onPress={closeReferralModal} style={s.closeTouch}><X color={theme.colors.textSecondary} size={24} /></TouchableOpacity></View>
                <Text style={[s.modalDesc, { color: theme.colors.textSecondary }]}>Enter a friend's referral code to give them a 100 SC bonus! You can only use one referral code.</Text>
                {referralError && <View style={s.errorRow}><AlertCircle color="#EF4444" size={18} /><Text style={s.errorText}>{referralError}</Text></View>}
                {referralSuccess && <View style={s.successRow}><CheckCircle color="#22C55E" size={18} /><Text style={s.successText}>{referralSuccess}</Text></View>}
                <View style={s.inputWrap}><Text style={[s.inputLabel, { color: theme.colors.text }]}>Referral Code</Text><TextInput style={[s.codeInput, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.cardBorder }]} placeholder="HEROXXXXXX" placeholderTextColor={theme.colors.textMuted} value={referralCodeInput} onChangeText={(text) => setReferralCodeInput(text.toUpperCase())} autoCapitalize="characters" maxLength={10} /></View>
                <TouchableOpacity onPress={handleApplyReferralCode} disabled={applyingCode || !referralCodeInput.trim()} style={[s.applyBtn, { backgroundColor: theme.colors.primary, opacity: applyingCode || !referralCodeInput.trim() ? 0.6 : 1 }]}>{applyingCode ? <ActivityIndicator color="#0F172A" /> : <Text style={s.applyText}>Apply Code</Text>}</TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal visible={showMFAModal} transparent animationType="fade" onRequestClose={closeMFAModal}>
            <View style={[s.modalBg, { backgroundColor: theme.colors.overlay }]}>
              <View style={[s.modalCard, { backgroundColor: theme.colors.modalBackground }]}>
                <View style={s.modalHeader}><View style={s.modalHeaderRow}><View style={[s.modalHeaderIcon, { backgroundColor: mfaStep === 'disable' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)' }]}><Shield color={mfaStep === 'disable' ? '#EF4444' : theme.colors.success} size={24} /></View><Text style={[s.modalHeaderTitle, { color: theme.colors.text }]}>{mfaStep === 'disable' ? 'Disable 2FA' : mfaStep === 'verify' ? 'Verify Setup' : 'Enable 2FA'}</Text></View><TouchableOpacity onPress={closeMFAModal} style={s.closeTouch}><X color={theme.colors.textSecondary} size={24} /></TouchableOpacity></View>
                {mfaStep === 'setup' && <View style={s.mfaSetupWrap}><ActivityIndicator size="large" color={theme.colors.primary} /><Text style={[s.mfaSetupText, { color: theme.colors.textSecondary }]}>Generating secret key...</Text></View>}
                {mfaStep === 'verify' && <View><Text style={[s.modalDesc, { color: theme.colors.textSecondary }]}>Add this secret key to your authenticator app (Google Authenticator, Authy, etc.):</Text><View style={[s.secretBox, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.cardBorder }]}><Text style={[s.secretText, { color: theme.colors.text }]} selectable>{totpSecret}</Text><TouchableOpacity style={[s.copySecretBtn, secretCopied && { backgroundColor: theme.colors.successLight }]} onPress={handleCopySecret}>{secretCopied ? <Check color={theme.colors.success} size={16} /> : <Copy color={theme.colors.primary} size={16} />}</TouchableOpacity></View>{secretCopied && <Text style={[s.copiedText, { color: theme.colors.success }]}>Copied to clipboard!</Text>}<Text style={[s.mfaInstructions, { color: theme.colors.textSecondary }]}>1. Open your authenticator app{'\n'}2. Add a new account{'\n'}3. Enter this secret key manually{'\n'}4. Enter the 6-digit code below</Text></View>}
                {mfaStep === 'disable' && <Text style={[s.modalDesc, { color: theme.colors.textSecondary }]}>Enter a code from your authenticator app to confirm disabling two-factor authentication.</Text>}
                {mfaError && <View style={s.errorRow}><AlertCircle color="#EF4444" size={18} /><Text style={s.errorText}>{mfaError}</Text></View>}
                {(mfaStep === 'verify' || mfaStep === 'disable') && <View style={s.inputWrap}><Text style={[s.inputLabel, { color: theme.colors.text }]}>Verification Code</Text><TextInput style={[s.codeInput, { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, borderColor: theme.colors.cardBorder, textAlign: 'center', letterSpacing: 8 }]} placeholder="000000" placeholderTextColor={theme.colors.textMuted} value={totpCode} onChangeText={(text) => setTotpCode(text.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={6} /></View>}
                {(mfaStep === 'verify' || mfaStep === 'disable') && <TouchableOpacity onPress={mfaStep === 'disable' ? handleDisableMFA : handleVerifyMFA} disabled={mfaLoading || totpCode.length !== 6} style={[s.applyBtn, { backgroundColor: mfaStep === 'disable' ? theme.colors.error : theme.colors.success, opacity: mfaLoading || totpCode.length !== 6 ? 0.6 : 1 }]}>{mfaLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={[s.applyText, { color: '#FFFFFF' }]}>{mfaStep === 'disable' ? 'Disable 2FA' : 'Verify & Enable'}</Text>}</TouchableOpacity>}
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const ProfileCard = ({ profile, user, totalHeroCount, totalEarningRate, theme, onEdit }: any) => (
  <View style={[s.profileCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
    <View style={s.profileRow}><View style={s.profileIcon}><Zap color={theme.colors.primary} size={28} /></View><View style={s.flex1}><Text style={[s.profileName, { color: theme.colors.text }]}>{profile?.username || user?.email?.split('@')[0] || 'Hero'}</Text><View style={s.profileEmailRow}><Mail color={theme.colors.textMuted} size={12} /><Text style={[s.profileEmail, { color: theme.colors.textSecondary }]}>{user?.email}</Text></View></View><TouchableOpacity style={s.editBtn} onPress={onEdit}><Edit3 color={theme.colors.primary} size={14} /><Text style={[s.editText, { color: theme.colors.primary }]}>Edit</Text></TouchableOpacity></View>
    <View style={[s.profileStatsRow, { backgroundColor: theme.colors.surfaceSecondary }]}><StatItem icon={Coins} color={theme.colors.primary} value={(profile?.supercash_balance || 0).toLocaleString()} label="SuperCash" theme={theme} /><View style={[s.profileDivider, { backgroundColor: theme.colors.divider }]} /><StatItem icon={Users} color={theme.colors.success} value={totalHeroCount} label="Heroes" theme={theme} /><View style={[s.profileDivider, { backgroundColor: theme.colors.divider }]} /><StatItem icon={TrendingUp} color={theme.colors.info} value={totalEarningRate} label="SC/hr" theme={theme} /></View>
  </View>
);

const StatItem = ({ icon: Icon, color, value, label, theme }: any) => (
  <View style={s.statItem}><Icon color={color} size={14} /><Text style={[s.statValue, { color: theme.colors.text }]}>{value}</Text><Text style={[s.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text></View>
);

const AppearanceSection = ({ isDark, toggleTheme, theme }: any) => (
  <View style={s.section}><Text style={[s.sectionTitle, { color: theme.colors.text }]}>Appearance</Text><View style={[s.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}><View style={s.appearRow}><View style={s.appearRowLeft}><View style={[s.appearIcon, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(251, 191, 36, 0.15)' }]}>{isDark ? <Moon color={theme.colors.purple} size={20} /> : <Sun color={theme.colors.primary} size={20} />}</View><View><Text style={[s.appearTitle, { color: theme.colors.text }]}>Dark Mode</Text><Text style={[s.appearSub, { color: theme.colors.textSecondary }]}>{isDark ? 'Currently using dark theme' : 'Currently using light theme'}</Text></View></View><Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#E2E8F0', true: 'rgba(139, 92, 246, 0.5)' }} thumbColor={isDark ? theme.colors.purple : '#FBBF24'} /></View></View></View>
);

const MFASection = ({ mfaEnabled, loading, onEnable, onDisable, theme }: any) => (
  <View style={s.section}><Text style={[s.sectionTitle, { color: theme.colors.text }]}>Security</Text><View style={[s.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, padding: 14 }]}>
    <View style={s.mfaRow}><View style={s.mfaLeft}><View style={[s.mfaIcon, { backgroundColor: mfaEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}><Shield color={mfaEnabled ? '#22C55E' : '#EF4444'} size={20} /></View><View style={s.flex1}><Text style={[s.mfaTitle, { color: theme.colors.text }]}>Two-Factor Authentication</Text><Text style={[s.mfaSub, { color: theme.colors.textSecondary }]}>{loading ? 'Checking status...' : mfaEnabled ? 'Your account is protected' : 'Add extra security to your account'}</Text></View></View>{loading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <View style={[s.mfaStatus, { backgroundColor: mfaEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}><Text style={[s.mfaStatusText, { color: mfaEnabled ? '#22C55E' : '#EF4444' }]}>{mfaEnabled ? 'ON' : 'OFF'}</Text></View>}</View>
    <View style={s.mfaInfoRow}><Smartphone color={theme.colors.textMuted} size={14} /><Text style={[s.mfaInfoText, { color: theme.colors.textMuted }]}>Uses authenticator app (Google Authenticator, Authy)</Text></View>
    <TouchableOpacity onPress={mfaEnabled ? onDisable : onEnable} disabled={loading} style={[s.mfaBtn, { backgroundColor: mfaEnabled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderColor: mfaEnabled ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)', opacity: loading ? 0.5 : 1 }]}><Key color={mfaEnabled ? '#EF4444' : '#22C55E'} size={16} /><Text style={[s.mfaBtnText, { color: mfaEnabled ? '#EF4444' : '#22C55E' }]}>{mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}</Text></TouchableOpacity>
  </View></View>
);

const ReferralSection = ({ referralCode, inviteCount, totalEarned, usedReferralCode, copied, onCopy, loading, hasUsedReferral, onEnterCode, theme }: any) => (
  <View style={s.section}><Text style={[s.sectionTitle, { color: theme.colors.text }]}>Referral Program</Text><View style={[s.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, padding: 14 }]}>
    <View style={s.refHeader}><View style={s.refIcon}><Gift color={theme.colors.primary} size={20} /></View><View style={s.flex1}><Text style={[s.refTitle, { color: theme.colors.text }]}>Invite Friends & Earn</Text><Text style={[s.refSub, { color: theme.colors.textSecondary }]}>Get 100 SC for each friend</Text></View></View>
    <View style={s.refCodeWrap}><Text style={[s.refCodeLabel, { color: theme.colors.textSecondary }]}>Your Referral Code</Text><View style={[s.refCodeRow, { backgroundColor: theme.colors.surfaceSecondary, borderColor: `${theme.colors.primary}50` }]}>{loading ? <ActivityIndicator size="small" color={theme.colors.primary} style={s.flex1} /> : <Text style={[s.refCodeText, { color: theme.colors.primary }]}>{referralCode}</Text>}<TouchableOpacity style={[s.copyBtn, copied && { backgroundColor: theme.colors.successLight }]} onPress={onCopy} disabled={loading}>{copied ? <Check color={theme.colors.success} size={16} /> : <Copy color={theme.colors.primary} size={16} />}</TouchableOpacity></View>{copied && <Text style={[s.copiedText, { color: theme.colors.success }]}>Copied to clipboard!</Text>}</View>
    <View style={s.refStatsRow}><View style={[s.refStatBox, { backgroundColor: theme.colors.surfaceSecondary }]}><Text style={[s.refStatVal, { color: theme.colors.text }]}>{loading ? '-' : inviteCount}</Text><Text style={[s.refStatLabel, { color: theme.colors.textSecondary }]}>Invites</Text></View><View style={[s.refStatBox, { backgroundColor: theme.colors.surfaceSecondary }]}><Text style={[s.refStatValGreen, { color: theme.colors.success }]}>{loading ? '-' : totalEarned}</Text><Text style={[s.refStatLabel, { color: theme.colors.textSecondary }]}>SC Earned</Text></View></View>
    {!hasUsedReferral && <TouchableOpacity onPress={onEnterCode} style={s.enterCodeBtn}><Plus color="#3B82F6" size={16} /><Text style={s.enterCodeText}>Enter a Referral Code</Text></TouchableOpacity>}
    {hasUsedReferral && usedReferralCode && <View style={[s.usedCodeWrap, { backgroundColor: theme.colors.surfaceSecondary }]}><View><Text style={[s.usedCodeLabel, { color: theme.colors.textSecondary }]}>Used Referral Code</Text><Text style={[s.usedCodeVal, { color: theme.colors.success }]}>{usedReferralCode}</Text></View><View style={[s.appliedBadge, { backgroundColor: theme.colors.successLight }]}><Check color={theme.colors.success} size={14} /><Text style={[s.appliedText, { color: theme.colors.success }]}>Applied</Text></View></View>}
  </View></View>
);

const NotificationsSection = ({ push, email, setPush, setEmail, isDark, theme }: any) => (
  <View style={s.section}><Text style={[s.sectionTitle, { color: theme.colors.text }]}>Notifications</Text><View style={[s.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, overflow: 'hidden' }]}>
    <NotificationRow icon={Bell} title="Push Notifications" desc="Earnings, events & updates" color={theme.colors.primary} value={push} onChange={setPush} isDark={isDark} theme={theme} />
    <View style={[s.notifDivider, { backgroundColor: theme.colors.divider }]} />
    <NotificationRow icon={Mail} title="Email Notifications" desc="Weekly reports & news" color={theme.colors.info} value={email} onChange={setEmail} isDark={isDark} theme={theme} />
  </View></View>
);

const NotificationRow = ({ icon: Icon, title, desc, color, value, onChange, isDark, theme }: any) => (
  <View style={s.notifRow}><View style={s.notifLeft}><View style={[s.notifIcon, { backgroundColor: `${color}26` }]}><Icon color={color} size={18} /></View><View><Text style={[s.notifTitle, { color: theme.colors.text }]}>{title}</Text><Text style={[s.notifDesc, { color: theme.colors.textSecondary }]}>{desc}</Text></View></View><Switch value={value} onValueChange={onChange} trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: `${color}80` }} thumbColor={value ? color : theme.colors.textMuted} /></View>
);

const MenuSection = ({ title, items, theme }: any) => (
  <View style={s.section}><Text style={[s.sectionTitle, { color: theme.colors.text }]}>{title}</Text><View style={[s.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, overflow: 'hidden' }]}>{items.map((item: any, index: number) => <TouchableOpacity key={index} style={[s.menuItem, { borderBottomWidth: index === items.length - 1 ? 0 : 1, borderBottomColor: theme.colors.divider }]} onPress={item.onPress}><View style={[s.menuIcon, { backgroundColor: `${item.color}15` }]}><item.icon color={item.color} size={18} /></View><View style={s.flex1}><Text style={[s.menuTitle, { color: theme.colors.text }]}>{item.title}</Text><Text style={[s.menuDesc, { color: theme.colors.textSecondary }]}>{item.description}</Text></View><ChevronRight color={theme.colors.textMuted} size={18} /></TouchableOpacity>)}</View></View>
);

const SocialSection = ({ theme }: any) => (
  <View style={s.section}><Text style={[s.sectionTitle, { color: theme.colors.text }]}>Follow Us</Text><View style={s.socialRow}>{[{ icon: Twitter, color: '#1DA1F2', label: 'Twitter' }, { icon: MessageCircle, color: '#5865F2', label: 'Discord' }, { icon: Globe, color: theme.colors.text, label: 'Website' }].map((item, i) => <TouchableOpacity key={i} style={[s.socialBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}><item.icon color={item.color} size={20} /><Text style={[s.socialText, { color: theme.colors.text }]}>{item.label}</Text></TouchableOpacity>)}</View></View>
);

const EditProfileModal = ({ visible, onClose, username, setUsername, password, setPassword, confirmPassword, setConfirmPassword, showPassword, setShowPassword, saving, onSave, theme }: any) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={[s.editModalBg, { backgroundColor: theme.colors.overlay }]}>
      <ScrollView contentContainerStyle={s.editScroll}>
        <View style={[s.editCard, { backgroundColor: theme.colors.modalBackground, borderColor: theme.colors.cardBorder }]}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}><X color={theme.colors.textSecondary} size={24} /></TouchableOpacity>
          <View style={s.editAvatarWrap}><User color={theme.colors.primary} size={32} /></View>
          <Text style={[s.editTitle, { color: theme.colors.text }]}>Edit Profile</Text>
          <Text style={[s.editSub, { color: theme.colors.textSecondary }]}>Update your profile settings</Text>
          <View style={s.inputGroup}><Text style={[s.inputLabel, { color: theme.colors.textSecondary }]}>Username</Text><TextInput style={[s.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.cardBorder }]} value={username} onChangeText={setUsername} placeholder="Enter username" placeholderTextColor={theme.colors.textMuted} maxLength={20} autoCapitalize="none" autoCorrect={false} /><Text style={[s.charCount, { color: theme.colors.textMuted }]}>{username.length}/20 characters</Text></View>
          <View style={[s.editDivider, { backgroundColor: theme.colors.divider }]} />
          <Text style={[s.pwdHeader, { color: theme.colors.primary }]}>Change Password (Optional)</Text>
          <View style={s.inputGroup}><Text style={[s.inputLabel, { color: theme.colors.textSecondary }]}>New Password</Text><View style={[s.pwdInputRow, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.cardBorder }]}><TextInput style={[s.pwdInput, { color: theme.colors.text }]} value={password} onChangeText={setPassword} placeholder="Enter new password" placeholderTextColor={theme.colors.textMuted} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} /><TouchableOpacity style={s.showPwd} onPress={() => setShowPassword(!showPassword)}><Text style={[s.showPwdText, { color: theme.colors.primary }]}>{showPassword ? 'Hide' : 'Show'}</Text></TouchableOpacity></View>{password.length > 0 && password.length < 6 && <Text style={s.pwdWarn}>Min 6 characters required</Text>}</View>
          <View style={s.inputGroup}><Text style={[s.inputLabel, { color: theme.colors.textSecondary }]}>Confirm Password</Text><TextInput style={[s.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.cardBorder }]} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" placeholderTextColor={theme.colors.textMuted} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} />{password && confirmPassword && password !== confirmPassword && <Text style={s.pwdWarn}>Passwords do not match</Text>}</View>
          <View style={s.editBtnRow}><TouchableOpacity style={[s.editCancelBtn, { backgroundColor: theme.colors.surfaceSecondary }]} onPress={onClose}><Text style={[s.editCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[s.editSaveBtn, { backgroundColor: theme.colors.primary, opacity: saving ? 0.7 : 1 }]} onPress={onSave} disabled={saving}>{saving ? <ActivityIndicator color="#0F172A" size="small" /> : <Text style={s.editSaveText}>Save</Text>}</TouchableOpacity></View>
        </View>
      </ScrollView>
    </View>
  </Modal>
);

const s = StyleSheet.create({
  bg: { flex: 1, width, height },
  overlay: { flex: 1 },
  flex1: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  spacer: { height: 24 },
  profileCard: { borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  profileIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  profileName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  profileEmailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileEmail: { fontSize: 11 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editText: { fontSize: 11, fontWeight: '600' },
  profileStatsRow: { flexDirection: 'row', justifyContent: 'space-around', borderRadius: 10, padding: 12 },
  profileDivider: { width: 1 },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 14, fontWeight: '700' },
  statLabel: { fontSize: 9 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  sectionCard: { borderRadius: 12, borderWidth: 1 },
  appearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  appearRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appearIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  appearTitle: { fontSize: 14, fontWeight: '600' },
  appearSub: { fontSize: 11 },
  refHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  refIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  refTitle: { fontSize: 13, fontWeight: '700' },
  refSub: { fontSize: 10 },
  refCodeWrap: { marginBottom: 12 },
  refCodeLabel: { fontSize: 10, marginBottom: 6 },
  refCodeRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, padding: 10, borderWidth: 1, borderStyle: 'dashed' },
  refCodeText: { flex: 1, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  copyBtn: { padding: 4, borderRadius: 4 },
  copiedText: { fontSize: 10, marginTop: 6 },
  refStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  refStatBox: { flex: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  refStatVal: { fontSize: 16, fontWeight: '700' },
  refStatValGreen: { fontSize: 16, fontWeight: '700' },
  refStatLabel: { fontSize: 9 },
  enterCodeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' },
  enterCodeText: { fontSize: 12, fontWeight: '600', color: '#3B82F6' },
  usedCodeWrap: { borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  usedCodeLabel: { fontSize: 10, marginBottom: 4 },
  usedCodeVal: { fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  appliedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  appliedText: { fontSize: 10, fontWeight: '600' },
  notifDivider: { height: 1, marginHorizontal: 12 },
  notifRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  notifLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  notifTitle: { fontSize: 13, fontWeight: '600' },
  notifDesc: { fontSize: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuTitle: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  menuDesc: { fontSize: 10 },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, padding: 12, borderWidth: 1 },
  socialText: { fontSize: 11, fontWeight: '600' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, padding: 14, borderWidth: 1, marginBottom: 16 },
  signOutText: { fontSize: 14, fontWeight: '600' },
  footerCenter: { alignItems: 'center', marginBottom: 8 },
  footerVersion: { fontSize: 11, marginBottom: 4 },
  footerCopy: { fontSize: 9 },
  modalBg: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 340 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalHeaderIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center' },
  modalHeaderTitle: { fontSize: 18, fontWeight: '700' },
  closeTouch: { padding: 4 },
  modalDesc: { fontSize: 13, marginBottom: 20, lineHeight: 20 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 10, marginBottom: 16 },
  errorText: { flex: 1, fontSize: 13, color: '#EF4444', fontWeight: '500' },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: 12, borderRadius: 10, marginBottom: 16 },
  successText: { flex: 1, fontSize: 13, color: '#22C55E', fontWeight: '500' },
  inputWrap: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  codeInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, borderWidth: 1, letterSpacing: 2, fontWeight: '600' },
  applyBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  applyText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  editModalBg: { flex: 1 },
  editScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  editCard: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center', borderWidth: 1 },
  closeBtn: { position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 6 },
  editAvatarWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  editTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  editSub: { fontSize: 12, marginBottom: 24 },
  inputGroup: { width: '100%', marginBottom: 20 },
  input: { borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1 },
  charCount: { fontSize: 10, marginTop: 6, textAlign: 'right' },
  editDivider: { width: '100%', height: 1, marginBottom: 16 },
  pwdHeader: { fontSize: 12, fontWeight: '600', marginBottom: 12, alignSelf: 'flex-start' },
  pwdInputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1 },
  pwdInput: { flex: 1, padding: 14, fontSize: 16 },
  showPwd: { paddingHorizontal: 14, paddingVertical: 14 },
  showPwdText: { fontSize: 12, fontWeight: '600' },
  pwdWarn: { fontSize: 10, color: '#EF4444', marginTop: 6 },
  editBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  editCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  editCancelText: { fontSize: 14, fontWeight: '600' },
  editSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  editSaveText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  mfaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  mfaLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  mfaIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  mfaTitle: { fontSize: 13, fontWeight: '700' },
  mfaSub: { fontSize: 10, marginTop: 2 },
  mfaStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  mfaStatusText: { fontSize: 11, fontWeight: '700' },
  mfaInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingLeft: 4 },
  mfaInfoText: { fontSize: 10 },
  mfaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, padding: 12, borderWidth: 1 },
  mfaBtnText: { fontSize: 13, fontWeight: '600' },
  mfaSetupWrap: { alignItems: 'center', paddingVertical: 30 },
  mfaSetupText: { marginTop: 16, fontSize: 14 },
  secretBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 12, borderWidth: 1, marginTop: 12, marginBottom: 8 },
  secretText: { flex: 1, fontSize: 13, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 1 },
  copySecretBtn: { padding: 8, borderRadius: 6 },
  mfaInstructions: { fontSize: 12, lineHeight: 22, marginTop: 16, marginBottom: 16 },
});
