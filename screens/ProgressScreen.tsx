import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Progress — coming in Plan 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  text: { fontSize: 16, color: '#6b7280' },
});
