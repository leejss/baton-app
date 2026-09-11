import { Component, type ErrorInfo, type ReactNode } from 'react';

import { normalizeError, isAppError } from '@/shared/api/errors';
import { logger } from '@/shared/lib/logger';

type ErrorBoundaryProps = {
  children: ReactNode;
  /** 에러가 잡혔을 때 그릴 UI. `reset`을 호출하면 다시 렌더를 시도한다. */
  fallback: (props: { error: unknown; reset: () => void }) => ReactNode;
  /** 이 값이 바뀌면 에러 상태를 자동으로 해제한다(예: 라우트 파라미터). */
  resetKey?: unknown;
};

type ErrorBoundaryState = { error: unknown | null };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error !== null && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (isAppError(error)) return;
    const appError = normalizeError(error);
    logger.error(`render boundary caught: ${appError.message}`, {
      code: appError.code,
      component_stack: info.componentStack ?? null,
    });
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error !== null) {
      return this.props.fallback({
        error: this.state.error,
        reset: this.reset,
      });
    }

    return this.props.children;
  }
}
