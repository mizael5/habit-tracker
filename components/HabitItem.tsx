import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Habit } from '../types';

type Props = {
  habit: Habit;
  onToggle: (id: string) => void;
  onIncrement: (id: string) => void;
  onPress: (id: string) => void;
};

export function HabitItem({ habit, onToggle, onIncrement, onPress }: Props) {
  const todayStr = new Date().toISOString().split('T')[0];
  const isDone = habit.completedDates.includes(todayStr);
  const todayCount = habit.volumeLog[todayStr] ?? 0;

  const checkScale = useRef(new Animated.Value(isDone ? 1 : 0)).current;
  const rowBg = useRef(new Animated.Value(isDone ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(checkScale, { toValue: isDone ? 1 : 0, useNativeDriver: false, tension: 150, friction: 8 }),
      Animated.timing(rowBg, { toValue: isDone ? 1 : 0, useNativeDriver: false, duration: 300 }),
    ]).start();
  }, [isDone]);

  const rowBackground = rowBg.interpolate({ inputRange: [0, 1], outputRange: ['#ffffff', '#eef2ff'] });

  return (
    <Animated.View style={[styles.row, { backgroundColor: rowBackground }]}>
    <TouchableOpacity style={styles.rowInner} onPress={() => onPress(habit.id)} activeOpacity={0.7}>
      <Text style={styles.emoji}>{habit.emoji}</Text>
      <View style={styles.info}>
        <Text style={[styles.name, isDone && styles.nameDone]}>{habit.name}</Text>
        {habit.streak > 0 && (
          <Text style={styles.streak}>🔥 {habit.streak}-day streak</Text>
        )}
      </View>
      {habit.type === 'binary' ? (
        <TouchableOpacity
          onPress={() => onToggle(habit.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Animated.View style={[styles.checkbox, isDone && styles.checkboxDone, { transform: [{ scale: checkScale }] }]}>
            {isDone && <Text style={styles.checkmark}>✓</Text>}
          </Animated.View>
        </TouchableOpacity>
      ) : (
        <View style={styles.counter}>
          <Text style={[styles.counterText, isDone && styles.counterDone]}>
            {todayCount}/{habit.targetCount}
          </Text>
          <TouchableOpacity
            style={[styles.incrementBtn, isDone && styles.incrementBtnDone]}
            onPress={() => onIncrement(habit.id)}
            disabled={isDone}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.incrementBtnText}>{isDone ? '✓' : '+'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emoji: { fontSize: 28, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  nameDone: { color: '#9ca3af', textDecorationLine: 'line-through' },
  streak: { fontSize: 12, color: '#f59e0b', marginTop: 2 },
  checkbox: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxDone: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  checkmark: { color: '#fff', fontSize: 16, fontWeight: '700' },
  counter: { alignItems: 'center', gap: 4 },
  counterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  counterDone: { color: '#6366f1' },
  incrementBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
  },
  incrementBtnDone: { backgroundColor: '#6366f1' },
  incrementBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24 },
});
