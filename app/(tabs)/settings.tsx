import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, ImageBackground, Dimensions, Switch, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';

const { width, height } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import {
  User,
  LogOut,
  Shield,
  HelpCircle,
  Mail,
  ChevronRight,
  Zap,
  Info,
  Wallet,
  Bell,
  Globe,
  Link2,
  Gift,
  Copy,
  Twitter,
  MessageCircle,
  Lock,
  Coins,
  TrendingUp,
  Users,
  Check,
  X,
  Edit3,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, signOut, updateProfile, changePassword } = useAuth();
  const { userHeroes } = useGame();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeHeroes = userHeroes.filter(h => h.is_active);
  const totalEarningRate = activeHeroes.reduce(
    (sum, h) => sum + h.heroes.hero_rarities.supercash_per_hour,
    0
  );

  const referralCode = `HERO${profile?.id?.slice(0, 6).toUpperCase() || 'XXXXXX'}`;

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      signOut();
      router.replace('/(auth)/login');
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              await signOut();
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    }
  };

  const handleCopyReferral = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenEditModal = () => {
    setNewUsername(profile?.username || '');
    setNewPassword('');
    setConfirmPassword('');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    if (newUsername.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
    }

    setSaving(true);
    
    const profileSuccess = await updateProfile({ username: newUsername.trim() });
    let passwordSuccess = true;
    
    if (newPassword) {
      passwordSuccess = await changePassword(newPassword);
    }

    setSaving(false);

    if (profileSuccess && passwordSuccess) {
      setShowEditModal(false);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', newPassword ? 'Profile and password updated!' : 'Profile updated!');
    } else if (!profileSuccess) {
      Alert.alert('Error', 'Failed to update profile');
    } else {
      Alert.alert('Error', 'Failed to change password');
    }
  };

  const generalMenuItems = [
    {
      icon: User,
      title: 'Account',
      description: 'Manage your profile',
      color: '#FBBF24',
      onPress: handleOpenEditModal,
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Password & 2FA',
      color: '#22C55E',
      onPress: () => {},
    },
    {
      icon: Globe,
      title: 'Language',
      description: 'English (US)',
      color: '#3B82F6',
      onPress: () => {},
    },
  ];

  const web3MenuItems = [
    {
      icon: Wallet,
      title: 'Connect Wallet',
      description: 'Link your Web3 wallet',
      color: '#8B5CF6',
      badge: 'New',
      onPress: () => {},
    },
    {
      icon: Lock,
      title: 'Staking Settings',
      description: 'Auto-stake preferences',
      color: '#F59E0B',
      onPress: () => {},
    },
    {
      icon: Link2,
      title: 'NFT Settings',
      description: 'Marketplace preferences',
      color: '#EC4899',
      onPress: () => {},
    },
  ];

  const supportMenuItems = [
    {
      icon: HelpCircle,
      title: 'Help Center',
      description: 'FAQs & tutorials',
      color: '#06B6D4',
      onPress: () => {},
    },
    {
      icon: MessageCircle,
      title: 'Contact Support',
      description: 'Get help from our team',
      color: '#10B981',
      onPress: () => {},
    },
    {
      icon: Info,
      title: 'About HeroVerse',
      description: 'Version & legal info',
      color: '#6366F1',
      onPress: () => {},
    },
  ];

  return (
    <ImageBackground 
      source={require('@/assets/photo_2025-12-10_12-50-44.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Zap color="#FBBF24" size={28} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {profile?.username || user?.email?.split('@')[0] || 'Hero'}
                </Text>
                <View style={styles.profileEmail}>
                  <Mail color="#64748B" size={12} />
                  <Text style={styles.profileEmailText}>{user?.email}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={handleOpenEditModal}>
                <Edit3 color="#FBBF24" size={14} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.profileStats}>
              <View style={styles.profileStatItem}>
                <Coins color="#FBBF24" size={14} />
                <Text style={styles.profileStatValue}>{(profile?.supercash_balance || 0).toLocaleString()}</Text>
                <Text style={styles.profileStatLabel}>SuperCash</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStatItem}>
                <Users color="#22C55E" size={14} />
                <Text style={styles.profileStatValue}>{userHeroes.length}</Text>
                <Text style={styles.profileStatLabel}>Heroes</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStatItem}>
                <TrendingUp color="#3B82F6" size={14} />
                <Text style={styles.profileStatValue}>{totalEarningRate}</Text>
                <Text style={styles.profileStatLabel}>SC/hr</Text>
              </View>
            </View>
          </View>

          {/* Wallet Section */}
          <TouchableOpacity style={styles.walletBanner}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.3)', 'rgba(59, 130, 246, 0.3)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletBannerGradient}
            >
              <View style={styles.walletBannerIcon}>
                <Wallet color="#FFFFFF" size={22} />
              </View>
              <View style={styles.walletBannerText}>
                <Text style={styles.walletBannerTitle}>Connect Wallet</Text>
                <Text style={styles.walletBannerDesc}>Enable Web3 features & earn $HERO</Text>
              </View>
              <ChevronRight color="#FFFFFF" size={18} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Referral Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Referral Program</Text>
            <View style={styles.referralCard}>
              <View style={styles.referralHeader}>
                <View style={styles.referralIconContainer}>
                  <Gift color="#FBBF24" size={20} />
                </View>
                <View style={styles.referralInfo}>
                  <Text style={styles.referralTitle}>Invite Friends & Earn</Text>
                  <Text style={styles.referralDesc}>Get 100 $HERO for each friend</Text>
                </View>
              </View>
              <View style={styles.referralCodeContainer}>
                <Text style={styles.referralCodeLabel}>Your Referral Code</Text>
                <View style={styles.referralCodeBox}>
                  <Text style={styles.referralCode}>{referralCode}</Text>
                  <TouchableOpacity 
                    style={[styles.copyButton, copied && styles.copyButtonSuccess]} 
                    onPress={handleCopyReferral}
                  >
                    {copied ? (
                      <Check color="#22C55E" size={16} />
                    ) : (
                      <Copy color="#FBBF24" size={16} />
                    )}
                  </TouchableOpacity>
                </View>
                {copied && (
                  <Text style={styles.copiedText}>Copied to clipboard!</Text>
                )}
              </View>
              <View style={styles.referralStats}>
                <View style={styles.referralStatItem}>
                  <Text style={styles.referralStatValue}>0</Text>
                  <Text style={styles.referralStatLabel}>Invites</Text>
                </View>
                <View style={styles.referralStatItem}>
                  <Text style={styles.referralStatValue}>0</Text>
                  <Text style={styles.referralStatLabel}>$HERO Earned</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.notificationCard}>
              <View style={styles.notificationItem}>
                <View style={styles.notificationLeft}>
                  <View style={[styles.notificationIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                    <Bell color="#FBBF24" size={18} />
                  </View>
                  <View>
                    <Text style={styles.notificationTitle}>Push Notifications</Text>
                    <Text style={styles.notificationDesc}>Earnings, events & updates</Text>
                  </View>
                </View>
                <Switch
                  value={pushNotifications}
                  onValueChange={setPushNotifications}
                  trackColor={{ false: '#334155', true: 'rgba(251, 191, 36, 0.5)' }}
                  thumbColor={pushNotifications ? '#FBBF24' : '#64748B'}
                />
              </View>
              <View style={styles.notificationDivider} />
              <View style={styles.notificationItem}>
                <View style={styles.notificationLeft}>
                  <View style={[styles.notificationIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Mail color="#3B82F6" size={18} />
                  </View>
                  <View>
                    <Text style={styles.notificationTitle}>Email Notifications</Text>
                    <Text style={styles.notificationDesc}>Weekly reports & news</Text>
                  </View>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: '#334155', true: 'rgba(59, 130, 246, 0.5)' }}
                  thumbColor={emailNotifications ? '#3B82F6' : '#64748B'}
                />
              </View>
            </View>
          </View>

          {/* General Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General</Text>
            <View style={styles.menuSection}>
              {generalMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, index === generalMenuItems.length - 1 && styles.menuItemLast]}
                  onPress={item.onPress}
                >
                  <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                    <item.icon color={item.color} size={18} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuDescription}>{item.description}</Text>
                  </View>
                  <ChevronRight color="#64748B" size={18} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Web3 Settings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Web3</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Beta</Text>
              </View>
            </View>
            <View style={styles.menuSection}>
              {web3MenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, index === web3MenuItems.length - 1 && styles.menuItemLast]}
                  onPress={item.onPress}
                >
                  <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                    <item.icon color={item.color} size={18} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuDescription}>{item.description}</Text>
                  </View>
                  {item.badge && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <ChevronRight color="#64748B" size={18} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.menuSection}>
              {supportMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, index === supportMenuItems.length - 1 && styles.menuItemLast]}
                  onPress={item.onPress}
                >
                  <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                    <item.icon color={item.color} size={18} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuDescription}>{item.description}</Text>
                  </View>
                  <ChevronRight color="#64748B" size={18} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Social Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Follow Us</Text>
            <View style={styles.socialGrid}>
              <TouchableOpacity style={styles.socialButton}>
                <Twitter color="#1DA1F2" size={20} />
                <Text style={styles.socialText}>Twitter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <MessageCircle color="#5865F2" size={20} />
                <Text style={styles.socialText}>Discord</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Globe color="#FFFFFF" size={20} />
                <Text style={styles.socialText}>Website</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut color="#EF4444" size={18} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          {/* Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>HeroVerse v1.0.0</Text>
            <Text style={styles.copyrightText}>© 2026 HeroVerse. All rights reserved.</Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setShowEditModal(false)}
                >
                  <X color="#94A3B8" size={24} />
                </TouchableOpacity>

                <View style={styles.modalIcon}>
                  <User color="#FBBF24" size={32} />
                </View>

                <Text style={styles.modalTitle}>Edit Profile</Text>
                <Text style={styles.modalSubtitle}>Update your profile settings</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput
                    style={styles.input}
                    value={newUsername}
                    onChangeText={setNewUsername}
                    placeholder="Enter username"
                    placeholderTextColor="#64748B"
                    maxLength={20}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.inputHint}>{newUsername.length}/20 characters</Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionLabel}>Change Password (Optional)</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      placeholderTextColor="#64748B"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity 
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.eyeButtonText}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>
                  {newPassword.length > 0 && newPassword.length < 6 ? (
                    <Text style={styles.errorHint}>Min 6 characters required</Text>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {newPassword && confirmPassword && newPassword !== confirmPassword ? (
                    <Text style={styles.errorHint}>Passwords do not match</Text>
                  ) : null}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowEditModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#0F172A" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  // Profile Card
  profileCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileEmailText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FBBF24',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 10,
    padding: 12,
  },
  profileStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  profileStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileStatLabel: {
    fontSize: 9,
    color: '#94A3B8',
  },
  profileStatDivider: {
    width: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
  },
  // Wallet Banner
  walletBanner: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 18,
  },
  walletBannerGradient: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 12,
  },
  walletBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletBannerText: {
    flex: 1,
  },
  walletBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  walletBannerDesc: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Sections
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  // Referral Card
  referralCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  referralIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  referralInfo: {
    flex: 1,
  },
  referralTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  referralDesc: {
    fontSize: 10,
    color: '#94A3B8',
  },
  referralCodeContainer: {
    marginBottom: 12,
  },
  referralCodeLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 6,
  },
  referralCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderStyle: 'dashed',
  },
  referralCode: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 4,
  },
  copyButtonSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 4,
  },
  copiedText: {
    fontSize: 10,
    color: '#22C55E',
    marginTop: 6,
  },
  referralStats: {
    flexDirection: 'row',
    gap: 12,
  },
  referralStatItem: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  referralStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  referralStatLabel: {
    fontSize: 9,
    color: '#94A3B8',
  },
  // Notifications
  notificationCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notificationDesc: {
    fontSize: 10,
    color: '#94A3B8',
  },
  notificationDivider: {
    height: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    marginHorizontal: 12,
  },
  // Menu Section
  menuSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.1)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 10,
    color: '#94A3B8',
  },
  newBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#22C55E',
  },
  // Social Grid
  socialGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  socialText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Sign Out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  // Version
  versionContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 9,
    color: '#475569',
  },
  bottomSpacer: {
    height: 24,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 6,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  inputHint: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'right',
  },
  errorHint: {
    fontSize: 10,
    color: '#EF4444',
    marginTop: 6,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  eyeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FBBF24',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});
