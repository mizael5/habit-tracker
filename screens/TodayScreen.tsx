import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TodayScreenProps } from '../navigation/types';

export function TodayScreen({ navigation }: TodayScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Today — wiring in Task 7</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  text: { fontSize: 16, color: '#6b7280' },
});
