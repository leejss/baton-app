import { describe, expect, it } from '@jest/globals';
import { hasTransferCandidates } from '@/features/settings/lib/departure';
import { MOCK_STORE_MEMBERS } from '@/test/fixtures/members';
const self = {
  ...MOCK_STORE_MEMBERS[0],
  userId: 1,
  role: 'ADMIN' as const,
  status: 'ACTIVE' as const,
};
const member = {
  ...MOCK_STORE_MEMBERS[1],
  userId: 2,
  role: 'MEMBER' as const,
  status: 'ACTIVE' as const,
};
describe('마지막 관리자 나가기', () => {
  it('다른 멤버가 남으면 권한 이전이 필요하다', () =>
    expect(hasTransferCandidates([self, member], 1)).toBe(true));
  it('공동 관리자가 남으면 바로 나갈 수 있다', () =>
    expect(hasTransferCandidates([self, { ...member, role: 'ADMIN' }], 1)).toBe(false));
  it('혼자 남은 관리자는 바로 나갈 수 있다', () =>
    expect(hasTransferCandidates([self], 1)).toBe(false));
  it('일반 멤버에게는 권한 이전을 요구하지 않는다', () =>
    expect(hasTransferCandidates([self, member], 2)).toBe(false));
});
