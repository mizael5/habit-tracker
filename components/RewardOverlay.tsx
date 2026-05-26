// components/RewardOverlay.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Modal,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width, height } = Dimensions.get('window');

type Props = {
  visible: boolean;
  habitName: string;
  days: number;
  onDismiss: () => void;
};

export function RewardOverlay({ visible, habitName, days, onDismiss }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
      setTimeout(() => confettiRef.current?.start(), 200);
    } else {
      scale.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.title}>Challenge Complete!</Text>
          <Text style={styles.subtitle}>{habitName}</Text>
          <Text style={styles.days}>{days} days in a row</Text>
          <TouchableOpacity style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
      <ConfettiCannon
        ref={confettiRef}
        count={150}
        origin={{ x: width / 2, y: -10 }}
        autoStart={false}
        fadeOut
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 24,
    padding: 32, alignItems: 'center', width: width * 0.82,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20,
  },
  trophy: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#6366f1', marginBottom: 4 },
  days: { fontSize: 15, color: '#6b7280', marginBottom: 24 },
  button: {
    backgroundColor: '#6366f1', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
