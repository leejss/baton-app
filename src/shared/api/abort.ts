type ManagedAbortSignal = {
  signal: AbortSignal;
  cleanup: () => void;
};

const abortReasons = new WeakMap<AbortSignal, unknown>();

function createAbortError(): Error {
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

function createTimeoutError(): Error {
  const error = new Error('The operation timed out.');
  error.name = 'TimeoutError';
  return error;
}

function getSignalReason(signal: AbortSignal): unknown {
  // 일부 React Native 런타임은 abort(reason)을 무시하고 기본 reason만 노출한다.
  return abortReasons.get(signal) ?? signal.reason;
}

function abortWithReason(controller: AbortController, reason: unknown): void {
  abortReasons.set(controller.signal, reason);
  controller.abort(reason);
}

export function throwIfAborted(signal: AbortSignal): void {
  if (!signal.aborted) return;
  throw getSignalReason(signal) ?? createAbortError();
}

function combineSignals(signals: readonly AbortSignal[]): ManagedAbortSignal {
  const controller = new AbortController();
  const removeListeners: (() => void)[] = [];
  let cleanedUp = false;

  const abortFrom = (source: AbortSignal) => {
    if (!controller.signal.aborted) {
      abortWithReason(controller, getSignalReason(source) ?? createAbortError());
    }
  };

  for (const source of signals) {
    if (source.aborted) {
      abortFrom(source);
      break;
    }

    const listener = () => abortFrom(source);
    source.addEventListener('abort', listener, { once: true });
    removeListeners.push(() => source.removeEventListener('abort', listener));
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (cleanedUp) return;
      cleanedUp = true;
      for (const removeListener of removeListeners) removeListener();
    },
  };
}

export function withAbortTimeout(
  signal: AbortSignal | undefined,
  timeoutMs: number,
): ManagedAbortSignal {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortWithReason(timeoutController, createTimeoutError());
  }, timeoutMs);
  const clearTimeoutSignal = () => clearTimeout(timeoutId);
  timeoutController.signal.addEventListener('abort', clearTimeoutSignal, { once: true });

  const cleanupTimeout = () => {
    clearTimeout(timeoutId);
    timeoutController.signal.removeEventListener('abort', clearTimeoutSignal);
  };

  if (signal === undefined) {
    return { signal: timeoutController.signal, cleanup: cleanupTimeout };
  }

  const combined = combineSignals([signal, timeoutController.signal]);
  return {
    signal: combined.signal,
    cleanup: () => {
      combined.cleanup();
      cleanupTimeout();
    },
  };
}

export function getAbortReason(signal: AbortSignal): unknown {
  return getSignalReason(signal);
}
