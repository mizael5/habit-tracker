import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert
} from 'react-native';
import { useHabits } from '../hooks/useHabits';
import { HabitType } from '../types';
import { AddHabitScreenProps } from '../navigation/types';

const EMOJI_OPTIONS = ['⭐','🔥','💪','🧘','📚','🎯','💧','🏃','😴','🥗','🎸','✍️','🧹','💊','🌱','🎨'];

export function AddHabitScreen({ route, navigation }: AddHabitScreenProps) {
  const { habitId } = route.params ?? {};
  const { habits, addHabit, editHabit, deleteHabit } = useHabits();
  const existing = habits.find((h) => h.id === habitId);

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? '⭐');
  const [type, setType] = useState<HabitType>(existing?.type ?? 'binary');
  const [targetCount, setTargetCount] = useState(String(existing?.targetCount ?? 3));


  const handleDelete = () => {
    Alert.alert('Delete Habit', 'This will remove all history. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { deleteHabit(habitId!); navigation.goBack(); },
      },
    ]);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a habit name.');
      return;
    }
    const params = {
      name,
      emoji,
      type,
      targetCount: type === 'volume' ? (parseInt(targetCount, 10) || 3) : 1,
    };
    if (existing) {
      editHabit(habitId!, params);
    } else {
      addHabit(params);
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Habit Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Morning run"
        autoFocus
        returnKeyType="done"
        maxLength={40}
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
          <Text style={[styles.typeBtnText, type === 'binary' && styles.typeBtnTextActive]}>
            ✓  Daily (once)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'volume' && styles.typeBtnActive]}
          onPress={() => setType('volume')}
        >
          <Text style={[styles.typeBtnText, type === 'volume' && styles.typeBtnTextActive]}>
            #  Count-based
          </Text>
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

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{existing ? 'Save Changes' : 'Add Habit'}</Text>
      </TouchableOpacity>

      {existing && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Habit</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  inputSmall: { width: 80 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiOption: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
  emojiSelected: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  emojiText: { fontSize: 24 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
  typeBtnActive: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  typeBtnTextActive: { color: '#6366f1' },
  saveButton: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  deleteButton: { borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  deleteButtonText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
