import { NavigationContext } from 'expo-router/react-navigation';
import { useContext, useEffect, useRef, useState } from 'react';
import { create } from 'zustand';

import { isAppError } from '@/shared/api/errors';

type Scope = 'login' | 'signup';
type Operation = { kind: string; controller: AbortController };
type Operations = Record<Scope, Operation | null>;

// 화면이 스택에 동시에 남아 있어도 같은 인증 흐름에서는 하나만 실행한다.
const useOperations = create<Operations>(() => ({
  login: null,
  signup: null,
}));

export type AuthOperationContext = {
  signal: AbortSignal;
  isCurrent: () => boolean;
  /** 서버에서 상태를 바꾸는 요청을 떠날 때 로컬의 불확실한 결과를 정리한다. */
  onCancel: (cleanup: () => void) => void;
  /** 잠금을 해제한 렌더 다음에 이동해 최종 제출의 이탈 방지와 충돌하지 않는다. */
  complete: (navigate: () => void) => void;
};

export function useAuthOperation(scope: Scope) {
  const navigation = useContext(NavigationContext);
  const active = useOperations((state) => state[scope]);
  const owned = useRef<Operation | null>(null);
  const cancellation = useRef<(() => void) | null>(null);
  const mounted = useRef(true);
  const completing = useRef(false);
  const [completion, setCompletion] = useState<{ navigate: () => void } | null>(null);

  useEffect(() => {
    mounted.current = true;
    const cancel = () => {
      const operation = owned.current;
      if (!operation) return;
      owned.current = null;
      operation.controller.abort();
      cancellation.current?.();
      cancellation.current = null;
      completing.current = false;
      if (mounted.current) setCompletion(null);
      if (useOperations.getState()[scope] === operation) {
        useOperations.setState({ [scope]: null });
      }
    };
    const unsubscribe = navigation?.addListener('blur', cancel);
    return () => {
      mounted.current = false;
      unsubscribe?.();
      cancel();
    };
  }, [navigation, scope]);

  useEffect(() => {
    if (!completion) return;
    // 이탈 방지 해제가 반영될 때까지 같은 흐름의 다른 버튼도 잠근 채 기다린다.
    const frame = requestAnimationFrame(() => {
      const operation = owned.current;
      owned.current = null;
      cancellation.current = null;
      completing.current = false;
      setCompletion(null);
      if (operation && useOperations.getState()[scope] === operation) {
        useOperations.setState({ [scope]: null });
      }
      if (mounted.current && navigation?.isFocused() !== false) completion.navigate();
    });
    return () => cancelAnimationFrame(frame);
  }, [completion, navigation, scope]);

  const run = async (
    kind: string,
    task: (context: AuthOperationContext) => Promise<void> | void,
    onError: (error: unknown) => void,
  ): Promise<void> => {
    if (
      completing.current ||
      !mounted.current ||
      navigation?.isFocused() === false ||
      useOperations.getState()[scope]
    ) {
      return;
    }
    const operation = { kind, controller: new AbortController() };
    owned.current = operation;
    useOperations.setState({ [scope]: operation });
    const isCurrent = () =>
      mounted.current &&
      !operation.controller.signal.aborted &&
      owned.current === operation &&
      navigation?.isFocused() !== false;
    try {
      await task({
        signal: operation.controller.signal,
        isCurrent,
        onCancel: (cleanup) => {
          if (isCurrent()) cancellation.current = cleanup;
        },
        complete: (navigate) => {
          if (isCurrent()) {
            completing.current = true;
            setCompletion({ navigate });
          }
        },
      });
    } catch (error) {
      if (isCurrent() && !(isAppError(error) && error.code === 'canceled')) onError(error);
    } finally {
      if (owned.current === operation && !completing.current) {
        owned.current = null;
        cancellation.current = null;
        if (useOperations.getState()[scope] === operation) {
          useOperations.setState({ [scope]: null });
        }
      }
    }
  };

  return {
    isPending: active !== null || completion !== null,
    isRunning: active !== null && completion === null,
    kind: active?.kind ?? null,
    run,
  };
}
