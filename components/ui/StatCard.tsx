import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  icon: LucideIcon;
  color: string;
  value: string | number;
  label: string;
  theme: any;
}

export function StatCard({ icon: Icon, color, value, label, theme }: StatCardProps) {
  return (
    <View style={[s.statCard, { backgroundColor: theme.colors.card, borderColor: color }]}>
      <View style={[s.statIcon, { backgroundColor: `${color}20` }]}><Icon color={color} size={16} /></View>
      <Text style={[s.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[s.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

interface StatItemProps {
  icon: LucideIcon;
  color: string;
  value: string | number;
  label: string;
  theme?: any;
}

export function StatItem({ icon: Icon, color, value, label }: StatItemProps) {
  return (
    <View style={s.itemRow}>
      <View style={s.itemIcon}><Icon color={color} size={14} /></View>
      <Text style={s.itemText}><Text style={s.itemValue}>{value}</Text><Text style={{ color }}>{label}</Text></Text>
    </View>
  );
}

export function Divider() {
  return <View style={s.divider} />;
}

interface QuickStatCardProps {
  icon: LucideIcon;
  color: string;
  value: string | number;
  label: string;
  theme: any;
}

export function QuickStatCard({ icon: Icon, color, value, label, theme }: QuickStatCardProps) {
  return (
    <View style={[s.quickCard, { backgroundColor: theme.colors.card, borderColor: color }]}>
      <Icon color={color} size={18} />
      <Text style={[s.quickValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[s.quickLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  statCard: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1 },
  statIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 9 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemIcon: { width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(0, 0, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },
  itemText: { fontSize: 12, color: 'rgba(0, 0, 0, 0.5)' },
  itemValue: { fontWeight: '700', color: '#1C1917' },
  divider: { width: 1, height: 20, backgroundColor: 'rgba(0, 0, 0, 0.15)', marginHorizontal: 12 },
  quickCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1 },
  quickValue: { fontSize: 16, fontWeight: '700', marginTop: 6, marginBottom: 2 },
  quickLabel: { fontSize: 10 },
});
