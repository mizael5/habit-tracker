import * as Haptics from 'expo-haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Heavy: 'Heavy', Light: 'Light' },
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: { playAsync: jest.fn(), replayAsync: jest.fn() },
      }),
    },
  },
}));

describe('useReward — haptics', () => {
  beforeEach(() => jest.clearAllMocks());

  it('triggerReward fires Heavy haptic', async () => {
    const { triggerReward } = require('../useReward').useRewardFunctions();
    await triggerReward();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Heavy');
  });

  it('triggerLightTap fires Light haptic', () => {
    const { triggerLightTap } = require('../useReward').useRewardFunctions();
    triggerLightTap();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Light');
  });
});
