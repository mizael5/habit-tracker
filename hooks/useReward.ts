import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useCallback, useRef } from 'react';

// Exported for testing without React (no hooks)
export function useRewardFunctions() {
  let soundRef: Audio.Sound | null = null;

  const triggerReward = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      if (!soundRef) {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/chime.mp3')
        );
        soundRef = sound;
      }
      await soundRef.replayAsync();
    } catch {
      // sound is non-critical
    }
  };

  const triggerLightTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return { triggerReward, triggerLightTap };
}

// React hook version (memoized, sound instance persists across renders)
export function useReward() {
  const soundRef = useRef<Audio.Sound | null>(null);

  const triggerReward = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/chime.mp3')
        );
        soundRef.current = sound;
      }
      await soundRef.current.replayAsync();
    } catch {
      // sound is non-critical
    }
  }, []);

  const triggerLightTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return { triggerReward, triggerLightTap };
}
