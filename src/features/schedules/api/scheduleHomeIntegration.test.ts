import { expect, it } from '@jest/globals';

import { mockHomeDataSource } from '@/features/home/api/home.mockDataSource';
import { homeSummaryResponseSchema } from '@/features/home/api/home.schema';
import { getTodayInSeoul } from '@/features/home/lib/homeDate';
import { mockScheduleDataSource } from '@/features/schedules/api/mockScheduleDataSource';
import { scheduleBatchSchema } from '@/features/schedules/api/schedule.schema';
import { addDays } from '@/features/schedules/lib/scheduleDate';

it('근무표에서 변경한 본인 근무 종료 시각을 홈 미리보기도 공유한다', async () => {
  let date = addDays(getTodayInSeoul(), 1);
  // 기본 fixture에서 본인과 후속 직원 모두 있는 날짜를 사용한다.
  while (Number(date.slice(8)) % 7 === 0 || Number(date.slice(8)) % 3 === 0)
    date = addDays(date, 1);
  const before = homeSummaryResponseSchema.parse(await mockHomeDataSource.getHome(101, date));
  expect(before.data.schedulePreview).toHaveLength(3);
  const result = scheduleBatchSchema.parse(
    await mockScheduleDataSource.create(101, {
      employeeId: 1,
      startDate: date,
      endDate: date,
      startTime: '21:00',
      endTime: '24:00',
      acceptNonDuplicates: false,
    }),
  );
  const id = result.results[0]?.schedule?.id;
  expect(id).toBeDefined();
  if (id === undefined) throw new Error('근무 등록 결과가 없습니다.');
  try {
    const after = homeSummaryResponseSchema.parse(await mockHomeDataSource.getHome(101, date));
    expect(after.data.schedulePreview).toHaveLength(0);
  } finally {
    await mockScheduleDataSource.remove(101, id);
  }
  const removed = homeSummaryResponseSchema.parse(await mockHomeDataSource.getHome(101, date));
  expect(removed.data.schedulePreview).toHaveLength(3);
});
