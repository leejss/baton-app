import type { MemberDto } from '@/features/stores/api/store.schema';

export function hasTransferCandidates(members: MemberDto[], userId: number) {
  return members.some(
    (member) =>
      member.userId !== userId && member.status === 'ACTIVE' && member.role === 'EMPLOYEE',
  );
}

export const DEPARTURE_COPY = {
  withdraw: {
    title: '정말 회원탈퇴를 하시겠어요?',
    description: '회원 탈퇴 시 아래와 같은 영향이 있으며\n탈퇴 후에는 복구가 불가능합니다.',
    section: '회원 탈퇴 시 이용 영향',
    action: '회원 탈퇴하기',
    items: [
      [
        '계정 및 서비스 이용 종료',
        '회원탈퇴가 완료되면 Baton 계정이 삭제되며 더 이상 서비스를 이용할 수 없어요.',
      ],
      [
        '매장 소속 및 접근 권한 해제',
        '참여 중인 매장과의 소속 관계가 종료되며 근무표, 인수인계 등 매장 관련 기능에 접근할 수 없어요.',
      ],
      [
        '계정 및 데이터 삭제',
        '계정과 관련된 개인정보, 근무 일정, 인수인계, 사진 및 알림이 회원탈퇴와 함께 삭제돼요.',
      ],
      [
        '탈퇴 후 복구 불가',
        '회원탈퇴가 완료된 이후에는 계정과 삭제된 데이터를 다시 복구할 수 없어요.',
      ],
    ],
  },
  leave: {
    title: '정말 이 매장을 나가시겠어요?',
    description: '매장을 나가면 소속이 해제되고\n더 이상 매장 기능을 이용할 수 없어요.',
    section: '매장 나가기 시 이용 영향',
    action: '매장 나가기',
    items: [
      [
        '매장 소속 및 접근 권한 해제',
        '매장을 나가면 해당 매장과의 소속 관계가 종료되고 접근 권한이 해제돼요.',
      ],
      [
        'Baton 계정은 그대로 유지',
        '계정은 삭제되지 않으며 다른 매장에 참여하거나 새 매장을 생성할 수 있어요.',
      ],
      [
        '기존 활동 기록 보존',
        '과거 근무 일정과 인수인계 등 기존 활동 기록은 보존되고, 앞으로의 근무 일정은 취소돼요.',
      ],
      [
        '나간 매장의 신규 정보 접근 제한',
        '매장을 나간 이후 등록되는 근무표와 인수인계는 확인할 수 없어요.',
      ],
    ],
  },
} as const;
