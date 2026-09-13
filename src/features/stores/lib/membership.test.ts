import { describe, expect, it } from '@jest/globals';

import type { Membership } from '@/features/stores/api/store.schema';
import { hasPendingMembershipEnd } from '@/features/stores/lib/membership';

const store: Membership['store'] = {
  id: 10,
  storeName: '바톤',
  branchName: '강남점',
  address: '서울',
  detailAddress: null,
  storeContact: '02-1234-5678',
  status: 'ACTIVE',
  createdAt: '2026-09-01T00:00:00Z',
};

describe('hasPendingMembershipEnd', () => {
  it('비활성 매장에 활성 소속이 남아 있으면 종료가 필요하다', () => {
    expect(
      hasPendingMembershipEnd({
        store: { ...store, status: 'INACTIVE' },
        role: 'MANAGER',
        status: 'ACTIVE',
      }),
    ).toBe(true);
  });

  it('활성 매장 소속이거나 이미 종료된 소속이면 건드리지 않는다', () => {
    expect(hasPendingMembershipEnd({ store, role: 'MANAGER', status: 'ACTIVE' })).toBe(false);
    expect(
      hasPendingMembershipEnd({
        store: { ...store, status: 'INACTIVE' },
        role: 'MANAGER',
        status: 'LEFT',
      }),
    ).toBe(false);
  });

  it('소속이 없으면 종료할 것이 없다', () => {
    expect(hasPendingMembershipEnd(null)).toBe(false);
    expect(hasPendingMembershipEnd(undefined)).toBe(false);
  });
});
