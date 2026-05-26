// screens/ProgressScreen.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';
import { useHabits } from '../hooks/useHabits';

const { width } = Dimensions.get('window');

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function ProgressScreen() {
  const { habits } = useHabits();
  const last30 = getLast30Days();

  // Per-day completion rate (0–1) across all habits
  const chartData = last30.map((date, i) => {
    if (habits.length === 0) return { x: i + 1, y: 0 };
    const completed = habits.filter((h) => h.completedDates.includes(date)).length;
    return { x: i + 1, y: parseFloat((completed / habits.length).toFixed(2)) };
  });

  const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0);
  const avgStreak = habits.length
    ? (habits.reduce((sum, h) => sum + h.streak, 0) / habits.length).toFixed(1)
    : '0';

  const recentLog: { date: string; name: string; emoji: string }[] = [];
  last30.slice().reverse().forEach((date) => {
    habits.forEach((h) => {
      if (h.completedDates.includes(date)) {
        recentLog.push({ date, name: h.name, emoji: h.emoji });
      }
    });
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Your Progress</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalCompletions}</Text>
          <Text style={styles.statLabel}>Total completions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{avgStreak}</Text>
          <Text style={styles.statLabel}>Avg streak (days)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{habits.length}</Text>
          <Text style={styles.statLabel}>Active habits</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Daily completion rate — last 30 days</Text>
        <View style={{ height: 200, width: width - 48 }}>
          <CartesianChart
            data={chartData}
            xKey="x"
            yKeys={['y']}
            padding={{ top: 10, bottom: 30, left: 40, right: 10 }}
            domainPadding={{ left: 4, right: 4 }}
          >
            {({ points, chartBounds }) => (
              <Bar
                points={points.y}
                chartBounds={chartBounds}
                color="#6366f1"
                roundedCorners={{ topLeft: 3, topRight: 3 }}
              />
            )}
          </CartesianChart>
        </View>
      </View>

      <View style={styles.logCard}>
        <Text style={styles.chartTitle}>History log</Text>
        {recentLog.length === 0 ? (
          <Text style={styles.emptyLog}>Complete habits to see your history here.</Text>
        ) : (
          recentLog.slice(0, 30).map((entry, i) => (
            <View key={i} style={styles.logRow}>
              <Text style={styles.logEmoji}>{entry.emoji}</Text>
              <Text style={styles.logName}>{entry.name}</Text>
              <Text style={styles.logDate}>
                {new Date(entry.date + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statNum: { fontSize: 24, fontWeight: '800', color: '#6366f1' },
  statLabel: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 2 },
  chartCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  chartTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  logCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  emptyLog: { color: '#9ca3af', fontSize: 14 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  logEmoji: { fontSize: 20, marginRight: 10 },
  logName: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  logDate: { fontSize: 12, color: '#9ca3af' },
});
