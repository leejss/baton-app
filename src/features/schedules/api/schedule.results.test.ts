import { expect, it } from '@jest/globals';
import { scheduleSchema } from '@/features/schedules/api/schedule.schema';
import { toSchedule } from '@/features/schedules/api/mappers';
import { MOCK_STORE_MEMBERS } from '@/test/fixtures/members';
it('단일 일정 응답은 공간과 사용자 사진을 보존한다', () => {
  const profileImage = {
    source: 'UPLOADED' as const,
    url: 'https://example.com/photo?signature=test',
  };
  const dto = scheduleSchema.parse({
    id: 1,
    workspaceId: 101,
    employee: { ...MOCK_STORE_MEMBERS[0], profileImage },
    workDate: '2026-10-21',
    startTime: '09:00',
    endTime: '12:00',
    status: 'ACTIVE',
  });
  expect(toSchedule(dto)).toMatchObject({
    id: 1,
    workspaceId: 101,
    date: '2026-10-21',
    member: { id: MOCK_STORE_MEMBERS[0].userId, profileImage },
  });
});
