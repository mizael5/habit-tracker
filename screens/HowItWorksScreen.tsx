// screens/HowItWorksScreen.tsx
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

type Section = { title: string; icon: string; body: string };

const SECTIONS: Section[] = [
  {
    title: 'Daily habits',
    icon: '✓',
    body: 'Daily habits are things you do once a day—like meditating or writing in a journal. Tap the circle to mark it as completed. Undo if you tap by mistake.',
  },
  {
    title: 'Count-Based Habits',
    icon: '#',
    body: 'Volume habits have a daily target — like drinking 8 glasses of water. Tap + each time you do it. The habit completes when you hit your target.',
  },
  {
    title: 'Streaks',
    icon: '🔥',
    body: 'A streak counts how many consecutive days you\'ve completed a habit. Miss a day and the streak resets. Streaks are the simplest measure of consistency.',
  },
  {
    title: 'Challenges',
    icon: '🏆',
    body: 'Open any habit to set a challenge goal — a number of days in a row you commit to. Hit your goal and you\'ll get a full celebration moment. If you miss a day, the challenge clears and you can set a new one.',
  },
  {
    title: 'Rewards',
    icon: '🎉',
    body: 'Every time you complete a habit, you get a haptic pulse, a chime, and a confetti burst. It\'s a small moment — but those small moments add up.',
  },
  {
    title: 'Notifications',
    icon: '🔔',
    body: 'We send two nudges a day: a morning reminder to kick off your habits, and an evening check-in if anything\'s still undone. You control the times in Settings.',
  },
];

export function HowItWorksScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>How It Works</Text>
      <Text style={styles.intro}>
        Everything you need to know about building better habits with this app.
      </Text>
      {SECTIONS.map((s) => (
        <View key={s.title} style={styles.card}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{s.icon}</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardText}>{s.body}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 48 },
  heading: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
  intro: { fontSize: 15, color: '#6b7280', marginBottom: 24, lineHeight: 22 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, gap: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon: { fontSize: 20 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardText: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
});
