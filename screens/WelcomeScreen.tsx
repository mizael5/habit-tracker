// screens/WelcomeScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../navigation/types';
import { requestPermission } from '../hooks/useNotifications';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const [name, setName] = useState('');

  const handleContinue = async () => {
    if (!name.trim()) return;
    await requestPermission();
    navigation.navigate('FirstHabit', { userName: name.trim() });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>🔥</Text>
        <Text style={styles.title}>Welcome to{'\n'}Habit Tracker</Text>
        <Text style={styles.subtitle}>Build lasting habits, one day at a time.</Text>

        <TextInput
          style={styles.input}
          placeholder="What's your name?"
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleContinue}
          maxLength={30}
        />

        <TouchableOpacity
          style={[styles.btn, !name.trim() && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!name.trim()}
        >
          <Text style={styles.btnText}>Get started →</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('FirstHabit', { userName: '' })}>
          <Text style={styles.skipLink}>
            Skip → <Text style={styles.skipLinkBold}>How It Works</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 34, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 17, color: '#6b7280', textAlign: 'center', marginBottom: 40 },
  input: { width: '100%', backgroundColor: '#f9fafb', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16, fontSize: 18, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  btn: { width: '100%', backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  btnDisabled: { backgroundColor: '#c7d2fe' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  skipLink: { color: '#9ca3af', fontSize: 14 },
  skipLinkBold: { color: '#6366f1', fontWeight: '600' },
});
