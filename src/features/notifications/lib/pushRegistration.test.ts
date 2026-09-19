import { beforeEach, expect, it, jest } from '@jest/globals';
import { disableCurrentPushToken, registerPushToken } from '@/features/notifications/api/push.api';
import {
  pausePushRegistration,
  disablePushRegistration,
  resumePushRegistration,
  syncPushToken,
} from '@/features/notifications/lib/pushRegistration';

jest.mock('@/features/notifications/api/push.api');
jest.mock('@/shared/lib/logger', () => ({ logger: { info: jest.fn() } }));
const request = {
  token: 'native-apns-token',
  deviceId: 'login-device-id',
  platform: 'IOS',
} as const;
const response = {
  id: 1,
  deviceId: request.deviceId,
  platform: request.platform,
  status: 'ACTIVE',
} as const;

beforeEach(async () => {
  await pausePushRegistration();
  resumePushRegistration();
  jest.mocked(registerPushToken).mockReset().mockResolvedValue(response);
  jest.mocked(disableCurrentPushToken).mockReset().mockResolvedValue();
});

it('토큰 발급과 갱신 리스너가 동시에 같은 토큰을 전달해도 한 번 등록한다', async () => {
  const signal = new AbortController().signal;
  await Promise.all([syncPushToken(1, request, signal), syncPushToken(1, request, signal)]);
  expect(registerPushToken).toHaveBeenCalledTimes(1);
  expect(registerPushToken).toHaveBeenCalledWith(request, signal);
});

it('등록 실패를 성공으로 기억하지 않아 다음 동기화에서 재시도한다', async () => {
  jest.mocked(registerPushToken).mockRejectedValueOnce(new Error('offline'));
  const signal = new AbortController().signal;
  await expect(syncPushToken(1, request, signal)).rejects.toThrow('offline');
  await syncPushToken(1, request, signal);
  expect(registerPushToken).toHaveBeenCalledTimes(2);
});

it('로그아웃은 진행 중 등록을 기다리고 대기 중인 이전 세션 등록은 폐기한다', async () => {
  let finish!: (value: typeof response) => void;
  jest.mocked(registerPushToken).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const signal = new AbortController().signal;
  const first = syncPushToken(1, request, signal);
  await Promise.resolve();
  const queued = syncPushToken(1, { ...request, token: 'rotated' }, signal);
  let stopped = false;
  const stopping = pausePushRegistration().then(() => {
    stopped = true;
  });
  await Promise.resolve();
  expect(stopped).toBe(false);
  finish(response);
  await Promise.all([first, queued, stopping]);
  expect(registerPushToken).toHaveBeenCalledTimes(1);
  resumePushRegistration();
  await syncPushToken(2, request, signal);
  expect(registerPushToken).toHaveBeenCalledTimes(2);
});

it('세션이 바뀌어 취소된 등록은 보내지 않는다', async () => {
  const controller = new AbortController();
  controller.abort();
  await syncPushToken(1, request, controller.signal);
  expect(registerPushToken).not.toHaveBeenCalled();
});

it('권한 철회는 진행 중인 토큰 등록 이후에 비활성화하여 최종 상태를 보장한다', async () => {
  let finish!: (value: typeof response) => void;
  jest.mocked(registerPushToken).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const signal = new AbortController().signal;
  const registration = syncPushToken(1, request, signal);
  await Promise.resolve();
  const disabling = disablePushRegistration(signal);
  await Promise.resolve();
  expect(disableCurrentPushToken).not.toHaveBeenCalled();
  finish(response);
  await Promise.all([registration, disabling]);
  expect(disableCurrentPushToken).toHaveBeenCalledWith(signal);
});
