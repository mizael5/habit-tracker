import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type TabParamList = {
  Today: undefined;
  Progress: undefined;
  Settings: undefined;
};

export type TodayStackParamList = {
  TodayScreen: undefined;
  AddHabit: { habitId?: string };
};

export type TodayScreenProps = NativeStackScreenProps<TodayStackParamList, 'TodayScreen'>;
export type AddHabitScreenProps = NativeStackScreenProps<TodayStackParamList, 'AddHabit'>;
