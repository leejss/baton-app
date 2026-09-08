import { z } from 'zod';

import { get, postVoid } from '@/shared/api/client';

import type { HomeDataSource } from '@/features/home/api/home.dataSource';

/**
 * 홈 화면의 실제 HTTP 구현. 경로는 wiki `api-list.md`(§2·3·4·6·7)를 따른다.
 *
 *   getMyProfile      GET  /users/me
 *   getMyStore        GET  /stores/me
 *   getHome           GET  /stores/{storeId}/home?date=yyyy-MM-dd
 *   getNotifications  GET  /stores/{storeId}/notifications
 *   confirmHandover   POST /handovers/{handoverId}/confirm
 *
 * ## 봉투를 다시 씌우는 이유
 *
 * `shared/api/client`는 `{ meta, data }` 봉투를 벗겨 `data`만 돌려주고, `meta.result`가
 * `FAIL`이면 그 자리에서 던진다. 그런데 `HomeDataSource` 경계는 목이 먼저 생기면서
 * **봉투째 넘기는 모양**으로 굳었고, `home.queries`·`home.mutations`가 `meta.result`를
 * 직접 확인한다.
 *
 * 그래서 여기서 `SUCCESS` 봉투를 다시 씌워 경계 모양을 맞춘다. `client`를 통과했다는
 * 건 이미 성공했다는 뜻이라 값이 거짓이 되지 않는다.
 *
 * 경계 자체를 벗긴 모양으로 바꾸는 게 더 깔끔하지만, 그러면 목과 홈 테스트까지 같이
 * 고쳐야 한다. 테스트를 돌릴 수 있게 된 뒤에 한 번에 정리한다.
 */
function envelope(data: unknown): unknown {
  return { meta: { result: 'SUCCESS', message: null }, data };
}

/** 파싱은 `home.queries`가 스키마로 한다. 여기서는 형태를 좁히지 않는다. */
const passthrough = z.unknown();

export const httpHomeDataSource: HomeDataSource = {
  async getMyProfile(signal) {
    return envelope(await get('/users/me', passthrough, { signal }));
  },

  async getMyStore(signal) {
    return envelope(await get('/stores/me', passthrough, { signal }));
  },

  async getHome(storeId, date, signal) {
    const query = new URLSearchParams({ date }).toString();
    return envelope(await get(`/stores/${storeId}/home?${query}`, passthrough, { signal }));
  },

  async getNotifications(storeId, signal) {
    return envelope(await get(`/stores/${storeId}/notifications`, passthrough, { signal }));
  },

  async confirmHandover(handoverId) {
    // 계약상 본문이 없다(`204`). 확인 성공 여부만 의미가 있어 빈 데이터를 돌려준다.
    await postVoid(`/handovers/${handoverId}/confirm`, undefined);
    return envelope(null);
  },
};
