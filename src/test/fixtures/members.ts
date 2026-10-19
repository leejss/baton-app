/** API 배포 전 홈·근무표·인수인계에서 같은 사용자를 가리키는 공통 fixture. */
export const MOCK_STORE_MEMBERS = [
  {
    userId: 1,
    displayName: '김지원',
    email: 'jiwon@baton.app',
    profileImage: { source: 'STATIC', key: 'DEFAULT_MANAGER' },
    role: 'ADMIN',
    status: 'ACTIVE',
  },
  {
    userId: 2,
    displayName: '이서연',
    email: 'seoyeon@baton.app',
    profileImage: { source: 'STATIC', key: 'DEFAULT_EMPLOYEE' },
    role: 'MEMBER',
    status: 'ACTIVE',
  },
  {
    userId: 3,
    displayName: '박현우',
    email: 'hyunwoo@baton.app',
    profileImage: { source: 'STATIC', key: 'DEFAULT_EMPLOYEE' },
    role: 'MEMBER',
    status: 'ACTIVE',
  },
  {
    userId: 4,
    displayName: '최민지',
    email: 'minji@baton.app',
    profileImage: { source: 'STATIC', key: 'DEFAULT_EMPLOYEE' },
    role: 'MEMBER',
    status: 'ACTIVE',
  },
] as const;
