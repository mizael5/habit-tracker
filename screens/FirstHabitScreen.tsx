// screens/FirstHabitScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/types';
import { useHabits } from '../hooks/useHabits';
import { HabitType } from '../types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'FirstHabit'>;

const EMOJI_OPTIONS = ['⭐','🔥','💪','🧘','📚','🎯','💧','🏃','😴','🥗','🎸','✍️','🧹','💊','🌱','🎨'];

export function FirstHabitScreen({ navigation, route }: Props) {
  const { userName } = route.params;
  const { addHabit } = useHabits();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const [type, setType] = useState<HabitType>('binary');
  const [targetCount, setTargetCount] = useState('3');

  const handleFinish = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give your first habit a name.');
      return;
    }
    addHabit({
      name,
      emoji,
      type,
      targetCount: type === 'volume' ? (parseInt(targetCount, 10) || 3) : 1,
    });
    await AsyncStorage.setItem('onboarded', 'true');
    // RootNavigator polls for this key and switches to tabs
  };

  const greeting = userName ? `Hi ${userName}! 👋` : 'Create your first habit';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{greeting}</Text>
      <Text style={styles.subtitle}>Set up your first habit to get started.</Text>

      <Text style={styles.label}>Habit Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Morning run"
        autoFocus
        maxLength={40}
        returnKeyType="done"
      />

      <Text style={styles.label}>Emoji</Text>
      <View style={styles.emojiGrid}>
        {EMOJI_OPTIONS.map((e) => (
          <TouchableOpacity
            key={e}
            style={[styles.emojiOption, emoji === e && styles.emojiSelected]}
            onPress={() => setEmoji(e)}
          >
            <Text style={styles.emojiText}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'binary' && styles.typeBtnActive]}
          onPress={() => setType('binary')}
        >
          <Text style={[styles.typeBtnText, type === 'binary' && styles.typeBtnTextActive]}>✓  Daily (once)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'volume' && styles.typeBtnActive]}
          onPress={() => setType('volume')}
        >
          <Text style={[styles.typeBtnText, type === 'volume' && styles.typeBtnTextActive]}>#  Count-based</Text>
        </TouchableOpacity>
      </View>

      {type === 'volume' && (
        <>
          <Text style={styles.label}>Daily target</Text>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            value={targetCount}
            onChangeText={setTargetCount}
            keyboardType="number-pad"
            placeholder="3"
            maxLength={2}
          />
        </>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleFinish}>
        <Text style={styles.btnText}>Start tracking →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  inputSmall: { width: 80 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiOption: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
  emojiSelected: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  emojiText: { fontSize: 24 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f9fafb', alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
  typeBtnActive: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  typeBtnTextActive: { color: '#6366f1' },
  btn: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 32 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
