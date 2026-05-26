// screens/SettingsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity,
  ScrollView, StyleSheet, Platform, Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  loadPrefs, savePrefs, scheduleNotifications,
  requestPermission, NotificationPrefs, DEFAULT_PREFS,
} from '../hooks/useNotifications';
import { useHabits } from '../hooks/useHabits';
import { SettingsScreenProps } from '../navigation/types';

function timeStrToDate(t: string): Date {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { habits } = useHabits();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [showPicker, setShowPicker] = useState<'morning' | 'evening' | null>(null);

  useEffect(() => {
    loadPrefs().then(setPrefs);
  }, []);

  const updatePrefs = async (patch: Partial<NotificationPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await savePrefs(next);
    const maxStreak = Math.max(0, ...habits.map((h) => h.streak));
    const todayStr = new Date().toISOString().split('T')[0];
    const firstIncomplete = habits.find((h) => !h.completedDates.includes(todayStr));
    const nearChallenge = habits.find(
      (h) => h.challengeGoal && h.streak === h.challengeGoal - 1
    );
    await scheduleNotifications(
      next,
      maxStreak,
      firstIncomplete?.name ?? null,
      nearChallenge?.challengeGoal
    );
  };

  const handleTimeChange = (_: any, date?: Date) => {
    if (!date || !showPicker) return;
    const timeStr = dateToTimeStr(date);
    if (showPicker === 'morning') updatePrefs({ morningTime: timeStr });
    else updatePrefs({ eveningTime: timeStr });
    if (Platform.OS === 'android') setShowPicker(null);
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert('Notifications blocked', 'Enable notifications in your device Settings app.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>Notifications</Text>
      <TouchableOpacity style={styles.permBtn} onPress={handleRequestPermission}>
        <Text style={styles.permBtnText}>Re-request notification permission</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.rowTitle}>Morning reminder</Text>
          <Text style={styles.rowSub}>{prefs.morningTime}</Text>
        </View>
        <Switch
          value={prefs.morningEnabled}
          onValueChange={(v) => updatePrefs({ morningEnabled: v })}
          trackColor={{ true: '#6366f1' }}
        />
      </View>
      {prefs.morningEnabled && (
        <TouchableOpacity style={styles.timeBtn} onPress={() => setShowPicker('morning')}>
          <Text style={styles.timeBtnText}>Change morning time ({prefs.morningTime})</Text>
        </TouchableOpacity>
      )}

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <Text style={styles.rowTitle}>Evening check-in</Text>
          <Text style={styles.rowSub}>{prefs.eveningTime}</Text>
        </View>
        <Switch
          value={prefs.eveningEnabled}
          onValueChange={(v) => updatePrefs({ eveningEnabled: v })}
          trackColor={{ true: '#6366f1' }}
        />
      </View>
      {prefs.eveningEnabled && (
        <TouchableOpacity style={styles.timeBtn} onPress={() => setShowPicker('evening')}>
          <Text style={styles.timeBtnText}>Change evening time ({prefs.eveningTime})</Text>
        </TouchableOpacity>
      )}

      {showPicker && (
        <DateTimePicker
          value={timeStrToDate(showPicker === 'morning' ? prefs.morningTime : prefs.eveningTime)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      <Text style={[styles.section, { marginTop: 24 }]}>Feedback</Text>
      <View style={styles.row}>
        <Text style={styles.rowTitle}>Sound</Text>
        <Switch
          value={prefs.soundEnabled}
          onValueChange={(v) => updatePrefs({ soundEnabled: v })}
          trackColor={{ true: '#6366f1' }}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.rowTitle}>Haptics</Text>
        <Switch
          value={prefs.hapticsEnabled}
          onValueChange={(v) => updatePrefs({ hapticsEnabled: v })}
          trackColor={{ true: '#6366f1' }}
        />
      </View>

      <Text style={[styles.section, { marginTop: 24 }]}>Help</Text>
      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => navigation.navigate('HowItWorks')}
      >
        <Text style={styles.linkText}>How It Works</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 48 },
  section: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  permBtn: { backgroundColor: '#eef2ff', borderRadius: 10, padding: 12, marginBottom: 16, alignItems: 'center' },
  permBtnText: { color: '#6366f1', fontWeight: '600', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  rowLabel: { flex: 1 },
  rowTitle: { fontSize: 16, color: '#111827', fontWeight: '500', flex: 1 },
  rowSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  timeBtn: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 10, marginBottom: 8, alignItems: 'center' },
  timeBtnText: { color: '#6366f1', fontSize: 14 },
  linkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  linkText: { flex: 1, fontSize: 16, color: '#111827' },
  chevron: { fontSize: 20, color: '#9ca3af' },
});
