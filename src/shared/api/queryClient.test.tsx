import { render } from '@testing-library/react-native';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { Text } from 'react-native';
import { AppError } from '@/shared/api/errors';
import { createQueryClient } from '@/shared/api/queryClient';

import { reportError } from '@/shared/lib/reportError';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

const mockLogs = { warn: jest.fn(), error: jest.fn() };
jest.mock('posthog-react-native', () => ({
  __esModule: true,
  default: jest.fn(() => ({ logger: mockLogs })),
}));
const originalKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const originalHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'synthetic';
  process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://example.com';
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  if (originalKey === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  else process.env.EXPO_PUBLIC_POSTHOG_API_KEY = originalKey;
  if (originalHost === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_HOST;
  else process.env.EXPO_PUBLIC_POSTHOG_HOST = originalHost;
});

it('재시도 횟수와 관계없이 Query 최종 실패를 한 번 보고한다', async () => {
  const client = createQueryClient();
  const queryFn = jest.fn().mockImplementation(async () => {
    throw new AppError('server', '장애', { status: 503 });
  });
  await expect(
    client.fetchQuery({ queryKey: ['test', 'private@example.com'], queryFn, retryDelay: 0 }),
  ).rejects.toThrow();
  expect(queryFn).toHaveBeenCalledTimes(3);
  expect(mockLogs.error).toHaveBeenCalledTimes(1);
  expect(jest.mocked(mockLogs.error).mock.calls[0][1]).not.toHaveProperty('operation');
  expect(JSON.stringify(jest.mocked(mockLogs.error).mock.calls)).not.toContain(
    'private@example.com',
  );
  client.clear();
});

it('Mutation 전역 콜백과 화면 catch의 중복 보고를 제거한다', async () => {
  const client = createQueryClient();
  const error = new AppError('server', '실패', { status: 500 });
  const mutation = client.getMutationCache().build(client, {
    gcTime: Infinity,
    mutationFn: async () => {
      throw error;
    },
    onError: (failure) => reportError(failure),
  });
  await expect(mutation.execute(undefined)).rejects.toBe(error);
  expect(mockLogs.error).toHaveBeenCalledTimes(1);
  client.clear();
});

it('4xx Mutation 실패는 전역에서 warn으로 기록한다', async () => {
  const client = createQueryClient();
  const mutation = client.getMutationCache().build(client, {
    gcTime: Infinity,
    mutationFn: async () => {
      throw new AppError('server', '이미 가입', { status: 409, errorCode: 'STORE_ALREADY_JOINED' });
    },
  });
  await expect(mutation.execute(undefined)).rejects.toThrow();
  expect(mockLogs.error).not.toHaveBeenCalled();
  expect(mockLogs.warn).toHaveBeenCalledTimes(1);
  client.clear();
});

function ThrowError({ error }: { error: Error }): never {
  throw error;
}

it('Query 실패가 Boundary로 전달되면 오류 화면을 표시하면서 중복 수집하지 않는다', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  const error = new AppError('schema', '형식 오류');
  const client = createQueryClient();
  await expect(
    client.fetchQuery({
      queryKey: ['boundary'],
      queryFn: async () => {
        throw error;
      },
    }),
  ).rejects.toBe(error);
  const screen = await render(
    <ErrorBoundary fallback={() => <Text>다시 시도</Text>}>
      <ThrowError error={error} />
    </ErrorBoundary>,
  );
  expect(screen.getByText('다시 시도')).toBeTruthy();
  expect(mockLogs.error).toHaveBeenCalledTimes(1);
  client.clear();
});

it('Query 밖의 AppError도 Boundary에서 수집한다', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await render(
    <ErrorBoundary fallback={() => <Text>오류</Text>}>
      <ThrowError error={new AppError('configuration', '설정 오류')} />
    </ErrorBoundary>,
  );
  expect(mockLogs.error).toHaveBeenCalledTimes(1);
  expect(mockLogs.error).toHaveBeenCalledWith(
    '설정 오류',
    expect.objectContaining({ code: 'configuration' }),
  );
});

it('UI 처리만 있는 onError도 끝난 뒤 전역 기본 보고가 동작한다', async () => {
  const client = createQueryClient();
  const onError = jest.fn();
  const failure = new AppError('server', '실패', { status: 503 });
  const mutation = client.getMutationCache().build(client, {
    gcTime: Infinity,
    mutationFn: async () => {
      throw failure;
    },
    onError,
  });
  await mutation.execute(undefined).catch(() => {});
  expect(onError).toHaveBeenCalledTimes(1);
  expect(mockLogs.error).toHaveBeenCalledTimes(1);
  client.clear();
});
