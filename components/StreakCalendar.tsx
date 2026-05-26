// components/StreakCalendar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  completedDates: string[]; // ISO date strings
  month?: Date;             // defaults to current month
};

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function StreakCalendar({ completedDates, month = new Date() }: Props) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const days = getDaysInMonth(year, monthIndex);
  const completedSet = new Set(completedDates);

  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
  const blanks = Array(firstDayOfWeek).fill(null);
  const allCells = [...blanks, ...days];

  const monthLabel = month.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      <Text style={styles.monthLabel}>{monthLabel}</Text>
      <View style={styles.dayLabels}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {allCells.map((day, i) => {
          if (!day) return <View key={`blank-${i}`} style={styles.cell} />;
          const iso = day.toISOString().split('T')[0];
          const done = completedSet.has(iso);
          const isToday = iso === new Date().toISOString().split('T')[0];
          return (
            <View
              key={iso}
              style={[styles.cell, done && styles.cellDone, isToday && !done && styles.cellToday]}
            >
              <Text style={[styles.dayNum, done && styles.dayNumDone]}>
                {day.getDate()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = 36;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12, textAlign: 'center' },
  dayLabels: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  dayLabel: { width: CELL_SIZE, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center', borderRadius: CELL_SIZE / 2 },
  cellDone: { backgroundColor: '#6366f1' },
  cellToday: { borderWidth: 2, borderColor: '#6366f1' },
  dayNum: { fontSize: 13, color: '#374151' },
  dayNumDone: { color: '#fff', fontWeight: '700' },
});
