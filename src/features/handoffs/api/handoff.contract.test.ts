import { afterEach, expect, it, jest } from '@jest/globals';
import { QueryClient, MutationObserver } from '@tanstack/react-query';
import * as api from '@/features/handoffs/api/handoff.api';
import { handoffSchema } from '@/features/handoffs/api/handoff.schema';
import { handoffQueries } from '@/features/handoffs/api/handoff.queries';
import { handoffMutations } from '@/features/handoffs/api/handoff.mutations';
import { INITIAL_MOCK_HANDOFFS } from '@/test/fixtures/handoffs';
import { AppError } from '@/shared/api/errors';
afterEach(() => {
  jest.restoreAllMocks();
});
it('숫자 ID와 +09:00 시각, null 첨부 URL을 수용하고 가짜 ID는 거부한다', () => {
  const item = {
    ...INITIAL_MOCK_HANDOFFS[0],
    sentAt: '2026-09-11T09:00:00+09:00',
    recipient: { ...INITIAL_MOCK_HANDOFFS[0].recipient, confirmedAt: null },
    attachments: [
      {
        id: 501,
        purpose: 'HANDOVER',
        contentType: 'image/jpeg',
        sizeBytes: 10,
        status: 'LINKED',
        downloadUrl: null,
      },
    ],
  };
  expect(handoffSchema.safeParse(item).success).toBe(true);
  expect(handoffSchema.safeParse({ ...item, id: 'mock-1' }).success).toBe(false);
});
it('서버 커서를 다음 페이지 요청에 전달한다', async () => {
  const list = jest
    .spyOn(api, 'fetchHandoffs')
    .mockResolvedValueOnce({
      items: [INITIAL_MOCK_HANDOFFS[0]],
      hasNext: true,
      nextCursor: 'opaque-cursor',
    })
    .mockResolvedValueOnce({ items: [], hasNext: false, nextCursor: null });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const data = await client.fetchInfiniteQuery({
    ...handoffQueries.list(101, 1, 'all'),
    pages: 2,
  });
  expect(data.pages).toHaveLength(2);
  expect(list.mock.calls[1]?.[2]).toBe('opaque-cursor');
  client.clear();
});
it('확인 응답이 유실되면 최신 확인 상태로 수렴하고 같은 처리를 반복하지 않는다', async () => {
  const received = INITIAL_MOCK_HANDOFFS[1];
  jest
    .spyOn(api, 'fetchHandoff')
    .mockResolvedValueOnce(received)
    .mockResolvedValueOnce({ ...received, status: 'CONFIRMED' });
  const confirm = jest
    .spyOn(api, 'confirmHandoff')
    .mockRejectedValue(new AppError('timeout', '응답 지연'));
  const client = new QueryClient();
  const observer = new MutationObserver(client, handoffMutations(client, 101).confirm());
  expect((await observer.mutate(received.id)).status).toBe('CONFIRMED');
  expect(confirm).toHaveBeenCalledTimes(1);
  client.clear();
});
it('이미 확인된 항목은 확인 API를 다시 호출하지 않는다', async () => {
  jest
    .spyOn(api, 'fetchHandoff')
    .mockResolvedValue({ ...INITIAL_MOCK_HANDOFFS[1], status: 'CONFIRMED' });
  const confirm = jest.spyOn(api, 'confirmHandoff');
  const client = new QueryClient();
  await new MutationObserver(client, handoffMutations(client, 101).confirm()).mutate(102);
  expect(confirm).not.toHaveBeenCalled();
  client.clear();
});

it('다른 공간의 상세 응답은 선택 공간 캐시에 저장하지 않는다', async () => {
  jest
    .spyOn(api, 'fetchHandoff')
    .mockResolvedValue({ ...INITIAL_MOCK_HANDOFFS[0], workspaceId: 202 });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const query = handoffQueries.detail(101, 101);
  await expect(client.fetchQuery(query)).rejects.toMatchObject({
    status: 403,
    errorCode: 'FORBIDDEN',
  });
  expect(client.getQueryData(query.queryKey)).toBeUndefined();
  client.clear();
});
