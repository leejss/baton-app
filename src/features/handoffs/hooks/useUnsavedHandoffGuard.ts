import { useCallback } from 'react';
import { Alert, BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';

type UseUnsavedHandoffGuardOptions = {
  continueLabel?: string;
  hasChanges: boolean;
  isBusy?: boolean;
  message: string;
  title: string;
  onDiscard?: () => void;
  onLeave: () => void;
};

export function useUnsavedHandoffGuard({
  continueLabel = '계속 작성',
  hasChanges,
  isBusy = false,
  message,
  title,
  onDiscard,
  onLeave,
}: UseUnsavedHandoffGuardOptions) {
  const requestLeave = useCallback(() => {
    if (isBusy) return;
    if (!hasChanges) {
      onLeave();
      return;
    }

    Alert.alert(title, message, [
      { text: continueLabel, style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        onPress: () => {
          onDiscard?.();
          onLeave();
        },
      },
    ]);
  }, [continueLabel, hasChanges, isBusy, message, onDiscard, onLeave, title]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        requestLeave();
        return true;
      });
      return () => subscription.remove();
    }, [requestLeave]),
  );

  return requestLeave;
}
