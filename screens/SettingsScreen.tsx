// screens/SettingsScreen.tsx
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, Switch, TouchableOpacity,
  ScrollView, StyleSheet, Platform, Alert, TextInput,
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
  const { habits, devSetupChallengeCompletion, devClearToday } = useHabits();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [showPicker, setShowPicker] = useState<'morning' | 'evening' | null>(null);
  const [webTimeStr, setWebTimeStr] = useState('');

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
        <TouchableOpacity style={styles.timeBtn} onPress={() => { setWebTimeStr(prefs.morningTime); setShowPicker('morning'); }}>
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
        <TouchableOpacity style={styles.timeBtn} onPress={() => { setWebTimeStr(prefs.eveningTime); setShowPicker('evening'); }}>
          <Text style={styles.timeBtnText}>Change evening time ({prefs.eveningTime})</Text>
        </TouchableOpacity>
      )}

      {showPicker && Platform.OS === 'web' ? (
        <View style={styles.webPickerRow}>
          <TextInput
            style={styles.webTimeInput}
            value={webTimeStr}
            onChangeText={setWebTimeStr}
            placeholder="HH:MM"
            maxLength={5}
            autoFocus
          />
          <TouchableOpacity
            style={styles.webTimeSetBtn}
            onPress={() => {
              if (/^\d{2}:\d{2}$/.test(webTimeStr)) {
                if (showPicker === 'morning') updatePrefs({ morningTime: webTimeStr });
                else updatePrefs({ eveningTime: webTimeStr });
              }
              setShowPicker(null);
            }}
          >
            <Text style={styles.webTimeSetBtnText}>Set</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.webTimeCancelBtn} onPress={() => setShowPicker(null)}>
            <Text style={styles.webTimeCancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : showPicker ? (
        <DateTimePicker
          value={timeStrToDate(showPicker === 'morning' ? prefs.morningTime : prefs.eveningTime)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      ) : null}

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

      <Text style={[styles.section, { marginTop: 32, color: '#f59e0b' }]}>🛠 Dev Tools</Text>
      <Text style={styles.devHint}>
        Simulate challenge completion: sets history so the next habit tap fires the celebration.
      </Text>
      {habits.length === 0 && (
        <Text style={styles.devEmpty}>No habits yet — add one on the Today tab.</Text>
      )}
      {habits.map((h) => (
        <View key={h.id} style={styles.devCard}>
          <Text style={styles.devHabitName}>{h.emoji} {h.name}</Text>
          <Text style={styles.devHabitMeta}>
            Streak: {h.streak} · Challenge: {h.challengeGoal ? `${h.streak}/${h.challengeGoal}d` : 'none'}
          </Text>
          <View style={styles.devBtnRow}>
            <TouchableOpacity
              style={[styles.devBtn, !h.challengeGoal && styles.devBtnDisabled]}
              disabled={!h.challengeGoal}
              onPress={() => {
                devSetupChallengeCompletion(h.id);
                Alert.alert('Ready!', `Tap "${h.name}" on Today to trigger the ${h.challengeGoal}-day challenge celebration.`);
              }}
            >
              <Text style={styles.devBtnText}>Set up for completion</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devBtn, styles.devBtnSecondary]}
              onPress={() => devClearToday(h.id)}
            >
              <Text style={[styles.devBtnText, { color: '#6b7280' }]}>Clear today</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <TouchableOpacity
        style={[styles.devBtn, { marginTop: 12, alignSelf: 'stretch' }]}
        onPress={() => {
          Alert.alert('Reset Onboarding', 'This will show the onboarding screens on next launch.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: () => AsyncStorage.removeItem('onboarded') },
          ]);
        }}
      >
        <Text style={styles.devBtnText}>Reset onboarding flag</Text>
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
  devHint: { fontSize: 13, color: '#9ca3af', marginBottom: 12, lineHeight: 18 },
  devEmpty: { fontSize: 14, color: '#9ca3af', fontStyle: 'italic' },
  devCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#fde68a' },
  devHabitName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  devHabitMeta: { fontSize: 12, color: '#9ca3af', marginBottom: 10 },
  devBtnRow: { flexDirection: 'row', gap: 8 },
  devBtn: { flex: 1, backgroundColor: '#fef3c7', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  devBtnSecondary: { backgroundColor: '#f3f4f6' },
  devBtnDisabled: { opacity: 0.4 },
  devBtnText: { fontSize: 13, fontWeight: '600', color: '#92400e' },
  webPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, backgroundColor: '#f3f4f6', borderRadius: 10, padding: 10 },
  webTimeInput: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  webTimeSetBtn: { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  webTimeSetBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  webTimeCancelBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  webTimeCancelBtnText: { color: '#9ca3af', fontSize: 14 },
});
