import { View, Text, TouchableOpacity, ScrollView, Alert, Platform, Switch, Modal, TextInput, ActivityIndicator, ImageBackground, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
import { useState, useMemo, useEffect, useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { User, LogOut, Shield, HelpCircle, Mail, ChevronRight, Zap, Info, Bell, Globe, Gift, Copy, Twitter, MessageCircle, Coins, TrendingUp, Users, Check, X, Edit3, Sun, Moon, Plus, AlertCircle, CheckCircle } from 'lucide-react-native';

const backgroundImage = require('@/assets/home_bg.jpg');

interface ReferralStats {
  referral_code: string;
  invite_count: number;
  total_earned: number;
  used_referral_code: string | null;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, signOut, updateProfile, changePassword, refreshProfile } = useAuth();
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
        setReferralStats({
          referral_code: data.referral_code || profile?.referral_code || `HERO${profile?.id?.slice(0, 6).toUpperCase()}`,
          invite_count: data.invite_count || 0,
          total_earned: data.total_earned || 0,
          used_referral_code: data.used_referral_code || null
        });
        setHasUsedReferral(!!data.used_referral_code);
      } else {
        setReferralStats({
          referral_code: profile?.referral_code || `HERO${profile?.id?.slice(0, 6).toUpperCase()}`,
          invite_count: 0,
          total_earned: 0,
          used_referral_code: null
        });
      }
    } catch (e) {
      setReferralStats({
        referral_code: profile?.referral_code || `HERO${profile?.id?.slice(0, 6).toUpperCase()}`,
        invite_count: 0,
        total_earned: 0,
        used_referral_code: null
      });
    }
    setLoadingStats(false);
  }, [profile]);

  useEffect(() => {
    fetchReferralStats();
  }, [fetchReferralStats]);

  const handleSignOut = () => {
    if (Platform.OS === 'web') { signOut(); router.replace('/(auth)/login'); }
    else Alert.alert('Sign Out', 'Are you sure you want to sign out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login'); } }]);
  };

  const handleCopyReferral = async () => {
    await Clipboard.setStringAsync(referralStats?.referral_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    if (!referralCodeInput.trim()) {
      setReferralError('Please enter a referral code');
      return;
    }

    setApplyingCode(true);
    setReferralError(null);
    setReferralSuccess(null);

    try {
      const { data, error } = await (supabase.rpc as any)('apply_referral_code', { code: referralCodeInput.trim() });

      if (error) {
        setReferralError(error.message || 'Failed to apply code');
        setApplyingCode(false);
        return;
      }

      if (data?.success) {
        setReferralSuccess(`Code applied! ${data.referrer} received ${data.bonus_given} SC bonus.`);
        setHasUsedReferral(true);
        refreshProfile();
        setTimeout(() => {
          setShowReferralModal(false);
          setReferralCodeInput('');
          setReferralSuccess(null);
        }, 2500);
      } else {
        setReferralError(data?.error || 'Failed to apply code');
      }
    } catch (e: any) {
      setReferralError(e.message || 'Failed to apply code');
    }

    setApplyingCode(false);
  };

  const closeReferralModal = () => {
    setShowReferralModal(false);
    setReferralCodeInput('');
    setReferralError(null);
    setReferralSuccess(null);
  };

  const generalMenuItems = [
    { icon: User, title: 'Account', description: 'Manage your profile', color: theme.colors.primary, onPress: handleOpenEditModal },
    { icon: Shield, title: 'Privacy & Security', description: 'Password & 2FA', color: theme.colors.success, onPress: () => {} },
    { icon: Globe, title: 'Language', description: 'English (US)', color: theme.colors.info, onPress: () => {} },
  ];

  const supportMenuItems = [
    { icon: HelpCircle, title: 'Help Center', description: 'FAQs & tutorials', color: '#06B6D4', onPress: () => {} },
    { icon: MessageCircle, title: 'Contact Support', description: 'Get help from our team', color: '#10B981', onPress: () => {} },
    { icon: Info, title: 'About HeroVerse', description: 'Version & legal info', color: '#6366F1', onPress: () => {} },
  ];

  return (
    <ImageBackground source={backgroundImage} style={{ flex: 1, width, height }} resizeMode="cover">
      <View style={{ flex: 1, backgroundColor: overlayColor }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }} showsVerticalScrollIndicator={false}>
            <ProfileCard profile={profile} user={user} totalHeroCount={totalHeroCount} totalEarningRate={totalEarningRate} theme={theme} onEdit={handleOpenEditModal} />
            <AppearanceSection isDark={isDark} toggleTheme={toggleTheme} theme={theme} />
            <ReferralSection 
              referralCode={referralStats?.referral_code || ''} 
              inviteCount={referralStats?.invite_count || 0}
              totalEarned={referralStats?.total_earned || 0}
              usedReferralCode={referralStats?.used_referral_code || null}
              copied={copied} 
              onCopy={handleCopyReferral} 
              loading={loadingStats}
              hasUsedReferral={hasUsedReferral}
              onEnterCode={() => setShowReferralModal(true)}
              theme={theme} 
            />
            <NotificationsSection push={pushNotifications} email={emailNotifications} setPush={setPushNotifications} setEmail={setEmailNotifications} isDark={isDark} theme={theme} />
            <MenuSection title="General" items={generalMenuItems} theme={theme} />
            <MenuSection title="Support" items={supportMenuItems} theme={theme} />
            <SocialSection theme={theme} />
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.errorLight, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: `${theme.colors.error}30`, marginBottom: 16 }} onPress={handleSignOut}>
              <LogOut color={theme.colors.error} size={18} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.error }}>Sign Out</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>HeroVerse v1.0.0</Text>
              <Text style={{ fontSize: 9, color: theme.colors.textMuted }}>© 2026 HeroVerse. All rights reserved.</Text>
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>
          <EditProfileModal visible={showEditModal} onClose={() => setShowEditModal(false)} username={newUsername} setUsername={setNewUsername} password={newPassword} setPassword={setNewPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} showPassword={showPassword} setShowPassword={setShowPassword} saving={saving} onSave={handleSaveProfile} theme={theme} />
          
          <Modal visible={showReferralModal} transparent animationType="fade" onRequestClose={closeReferralModal}>
            <View style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <View style={{ backgroundColor: theme.colors.modalBackground, borderRadius: 20, padding: 24, width: '100%', maxWidth: 340 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center' }}>
                      <Gift color={theme.colors.primary} size={24} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text }}>Enter Referral Code</Text>
                  </View>
                  <TouchableOpacity onPress={closeReferralModal} style={{ padding: 4 }}>
                    <X color={theme.colors.textSecondary} size={24} />
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 20, lineHeight: 20 }}>
                  Enter a friend's referral code to give them a 100 SC bonus! You can only use one referral code.
                </Text>

                {referralError && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 10, marginBottom: 16 }}>
                    <AlertCircle color="#EF4444" size={18} />
                    <Text style={{ flex: 1, fontSize: 13, color: '#EF4444', fontWeight: '500' }}>{referralError}</Text>
                  </View>
                )}

                {referralSuccess && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: 12, borderRadius: 10, marginBottom: 16 }}>
                    <CheckCircle color="#22C55E" size={18} />
                    <Text style={{ flex: 1, fontSize: 13, color: '#22C55E', fontWeight: '500' }}>{referralSuccess}</Text>
                  </View>
                )}

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text, marginBottom: 8 }}>Referral Code</Text>
                  <TextInput
                    style={{ backgroundColor: theme.colors.surfaceSecondary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.cardBorder, letterSpacing: 2, fontWeight: '600' }}
                    placeholder="HEROXXXXXX"
                    placeholderTextColor={theme.colors.textMuted}
                    value={referralCodeInput}
                    onChangeText={(text) => setReferralCodeInput(text.toUpperCase())}
                    autoCapitalize="characters"
                    maxLength={10}
                  />
                </View>

                <TouchableOpacity onPress={handleApplyReferralCode} disabled={applyingCode || !referralCodeInput.trim()} style={{ opacity: applyingCode || !referralCodeInput.trim() ? 0.6 : 1 }}>
                  <View style={{ backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}>
                    {applyingCode ? (
                      <ActivityIndicator color="#0F172A" />
                    ) : (
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>Apply Code</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const ProfileCard = ({ profile, user, totalHeroCount, totalEarningRate, theme, onEdit }: any) => (
  <View style={{ backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: theme.colors.cardBorder }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}><View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}><Zap color={theme.colors.primary} size={28} /></View><View style={{ flex: 1 }}><Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 }}>{profile?.username || user?.email?.split('@')[0] || 'Hero'}</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Mail color={theme.colors.textMuted} size={12} /><Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>{user?.email}</Text></View></View><TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }} onPress={onEdit}><Edit3 color={theme.colors.primary} size={14} /><Text style={{ fontSize: 11, fontWeight: '600', color: theme.colors.primary }}>Edit</Text></TouchableOpacity></View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: theme.colors.surfaceSecondary, borderRadius: 10, padding: 12 }}><StatItem icon={Coins} color={theme.colors.primary} value={(profile?.supercash_balance || 0).toLocaleString()} label="SuperCash" theme={theme} /><View style={{ width: 1, backgroundColor: theme.colors.divider }} /><StatItem icon={Users} color={theme.colors.success} value={totalHeroCount} label="Heroes" theme={theme} /><View style={{ width: 1, backgroundColor: theme.colors.divider }} /><StatItem icon={TrendingUp} color={theme.colors.info} value={totalEarningRate} label="SC/hr" theme={theme} /></View>
  </View>
);

const StatItem = ({ icon: Icon, color, value, label, theme }: any) => (
  <View style={{ alignItems: 'center', gap: 4 }}><Icon color={color} size={14} /><Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text }}>{value}</Text><Text style={{ fontSize: 9, color: theme.colors.textSecondary }}>{label}</Text></View>
);

const AppearanceSection = ({ isDark, toggleTheme, theme }: any) => (
  <View style={{ marginBottom: 18 }}><Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 10 }}>Appearance</Text><View style={{ backgroundColor: theme.colors.card, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.cardBorder }}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center' }}>{isDark ? <Moon color={theme.colors.purple} size={20} /> : <Sun color={theme.colors.primary} size={20} />}</View><View><Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>Dark Mode</Text><Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>{isDark ? 'Currently using dark theme' : 'Currently using light theme'}</Text></View></View><Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#E2E8F0', true: 'rgba(139, 92, 246, 0.5)' }} thumbColor={isDark ? theme.colors.purple : '#FBBF24'} /></View></View></View>
);

const ReferralSection = ({ referralCode, inviteCount, totalEarned, usedReferralCode, copied, onCopy, loading, hasUsedReferral, onEnterCode, theme }: any) => (
  <View style={{ marginBottom: 18 }}><Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 10 }}>Referral Program</Text><View style={{ backgroundColor: theme.colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.colors.cardBorder }}><View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}><View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}><Gift color={theme.colors.primary} size={20} /></View><View style={{ flex: 1 }}><Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>Invite Friends & Earn</Text><Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>Get 100 SC for each friend</Text></View></View><View style={{ marginBottom: 12 }}><Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginBottom: 6 }}>Your Referral Code</Text><View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceSecondary, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: `${theme.colors.primary}50`, borderStyle: 'dashed' }}>{loading ? (<ActivityIndicator size="small" color={theme.colors.primary} style={{ flex: 1 }} />) : (<Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.primary, letterSpacing: 2 }}>{referralCode}</Text>)}<TouchableOpacity style={[{ padding: 4 }, copied && { backgroundColor: theme.colors.successLight, borderRadius: 4 }]} onPress={onCopy} disabled={loading}>{copied ? <Check color={theme.colors.success} size={16} /> : <Copy color={theme.colors.primary} size={16} />}</TouchableOpacity></View>{copied && <Text style={{ fontSize: 10, color: theme.colors.success, marginTop: 6 }}>Copied to clipboard!</Text>}</View><View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}><View style={{ flex: 1, backgroundColor: theme.colors.surfaceSecondary, borderRadius: 8, padding: 10, alignItems: 'center' }}><Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>{loading ? '-' : inviteCount}</Text><Text style={{ fontSize: 9, color: theme.colors.textSecondary }}>Invites</Text></View><View style={{ flex: 1, backgroundColor: theme.colors.surfaceSecondary, borderRadius: 8, padding: 10, alignItems: 'center' }}><Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.success }}>{loading ? '-' : totalEarned}</Text><Text style={{ fontSize: 9, color: theme.colors.textSecondary }}>SC Earned</Text></View></View>{!hasUsedReferral && (<TouchableOpacity onPress={onEnterCode} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }}><Plus color="#3B82F6" size={16} /><Text style={{ fontSize: 12, fontWeight: '600', color: '#3B82F6' }}>Enter a Referral Code</Text></TouchableOpacity>)}{hasUsedReferral && usedReferralCode && (<View style={{ backgroundColor: theme.colors.surfaceSecondary, borderRadius: 8, padding: 12 }}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View><Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginBottom: 4 }}>Used Referral Code</Text><Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.success, letterSpacing: 2 }}>{usedReferralCode}</Text></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}><Check color={theme.colors.success} size={14} /><Text style={{ fontSize: 10, fontWeight: '600', color: theme.colors.success }}>Applied</Text></View></View></View>)}</View></View>
);

const NotificationsSection = ({ push, email, setPush, setEmail, isDark, theme }: any) => (
  <View style={{ marginBottom: 18 }}><Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 10 }}>Notifications</Text><View style={{ backgroundColor: theme.colors.card, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.cardBorder }}><NotificationRow icon={Bell} title="Push Notifications" desc="Earnings, events & updates" color={theme.colors.primary} value={push} onChange={setPush} isDark={isDark} theme={theme} /><View style={{ height: 1, backgroundColor: theme.colors.divider, marginHorizontal: 12 }} /><NotificationRow icon={Mail} title="Email Notifications" desc="Weekly reports & news" color={theme.colors.info} value={email} onChange={setEmail} isDark={isDark} theme={theme} /></View></View>
);

const NotificationRow = ({ icon: Icon, title, desc, color, value, onChange, isDark, theme }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color}26`, justifyContent: 'center', alignItems: 'center' }}><Icon color={color} size={18} /></View><View><Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text }}>{title}</Text><Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>{desc}</Text></View></View><Switch value={value} onValueChange={onChange} trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: `${color}80` }} thumbColor={value ? color : theme.colors.textMuted} /></View>
);

const MenuSection = ({ title, items, theme }: any) => (
  <View style={{ marginBottom: 18 }}><Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 10 }}>{title}</Text><View style={{ backgroundColor: theme.colors.card, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.cardBorder }}>{items.map((item: any, index: number) => (<TouchableOpacity key={index} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: index === items.length - 1 ? 0 : 1, borderBottomColor: theme.colors.divider }} onPress={item.onPress}><View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${item.color}15`, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}><item.icon color={item.color} size={18} /></View><View style={{ flex: 1 }}><Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text, marginBottom: 2 }}>{item.title}</Text><Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>{item.description}</Text></View><ChevronRight color={theme.colors.textMuted} size={18} /></TouchableOpacity>))}</View></View>
);

const SocialSection = ({ theme }: any) => (
  <View style={{ marginBottom: 18 }}><Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 10 }}>Follow Us</Text><View style={{ flexDirection: 'row', gap: 10 }}>{[{ icon: Twitter, color: '#1DA1F2', label: 'Twitter' }, { icon: MessageCircle, color: '#5865F2', label: 'Discord' }, { icon: Globe, color: theme.colors.text, label: 'Website' }].map((item, i) => (<TouchableOpacity key={i} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.colors.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: theme.colors.cardBorder }}><item.icon color={item.color} size={20} /><Text style={{ fontSize: 11, fontWeight: '600', color: theme.colors.text }}>{item.label}</Text></TouchableOpacity>))}</View></View>
);

const EditProfileModal = ({ visible, onClose, username, setUsername, password, setPassword, confirmPassword, setConfirmPassword, showPassword, setShowPassword, saving, onSave, theme }: any) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: theme.colors.overlay }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ backgroundColor: theme.colors.modalBackground, borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.cardBorder }}>
          <TouchableOpacity style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 6 }} onPress={onClose}>
            <X color={theme.colors.textSecondary} size={24} />
          </TouchableOpacity>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(251, 191, 36, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <User color={theme.colors.primary} size={32} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 6 }}>Edit Profile</Text>
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 24 }}>Update your profile settings</Text>
          <View style={{ width: '100%', marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 8 }}>Username</Text>
            <TextInput style={{ backgroundColor: theme.colors.inputBackground, borderRadius: 12, padding: 14, fontSize: 16, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.cardBorder }} value={username} onChangeText={setUsername} placeholder="Enter username" placeholderTextColor={theme.colors.textMuted} maxLength={20} autoCapitalize="none" autoCorrect={false} />
            <Text style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 6, textAlign: 'right' }}>{username.length}/20 characters</Text>
          </View>
          <View style={{ width: '100%', height: 1, backgroundColor: theme.colors.divider, marginBottom: 16 }} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primary, marginBottom: 12, alignSelf: 'flex-start' }}>Change Password (Optional)</Text>
          <View style={{ width: '100%', marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 8 }}>New Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.inputBackground, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.cardBorder }}>
              <TextInput style={{ flex: 1, padding: 14, fontSize: 16, color: theme.colors.text }} value={password} onChangeText={setPassword} placeholder="Enter new password" placeholderTextColor={theme.colors.textMuted} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} />
              <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 14 }} onPress={() => setShowPassword(!showPassword)}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primary }}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {password.length > 0 && password.length < 6 && <Text style={{ fontSize: 10, color: theme.colors.error, marginTop: 6 }}>Min 6 characters required</Text>}
          </View>
          <View style={{ width: '100%', marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 8 }}>Confirm Password</Text>
            <TextInput style={{ backgroundColor: theme.colors.inputBackground, borderRadius: 12, padding: 14, fontSize: 16, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.cardBorder }} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" placeholderTextColor={theme.colors.textMuted} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} />
            {password && confirmPassword && password !== confirmPassword && <Text style={{ fontSize: 10, color: theme.colors.error, marginTop: 6 }}>Passwords do not match</Text>}
          </View>
          <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
            <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.colors.surfaceSecondary, alignItems: 'center' }} onPress={onClose}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center', opacity: saving ? 0.7 : 1 }} onPress={onSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#0F172A" size="small" /> : <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  </Modal>
);
