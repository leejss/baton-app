import type { ImageSource } from 'expo-image';

/**
 * Figma `Illust Icon`(1304:18214)의 로컬 에셋 맵.
 *
 * `frameSize`는 컴포넌트가 차지하는 바깥 프레임이고, `imageWidth`·`imageHeight`는
 * Figma 프레임 안에서 실제로 그려지는 SVG의 크기다. SVG마다 투명 여백이 달라서
 * 이미지 전체를 프레임 크기로 늘리면 아이콘마다 시각적 크기가 달라진다.
 */
type IllustIconAsset = {
  source: ImageSource | number;
  frameSize: 18 | 26;
  imageWidth: number;
  imageHeight: number;
};

export const ILLUST_ICON_ASSETS = {
  home: {
    source: require('@/assets/images/illust-icons/home.svg'),
    frameSize: 18,
    imageWidth: 16.1283,
    imageHeight: 14.2941,
  },
  taskProcessing: {
    source: require('@/assets/images/illust-icons/task-processing.svg'),
    frameSize: 18,
    imageWidth: 12,
    imageHeight: 15.001,
  },
  storeStatus: {
    source: require('@/assets/images/illust-icons/store-status.svg'),
    frameSize: 18,
    imageWidth: 16.0001,
    imageHeight: 14.417,
  },
  other: {
    source: require('@/assets/images/illust-icons/other.svg'),
    frameSize: 18,
    imageWidth: 14.0001,
    imageHeight: 14.0055,
  },
  workScheduleEdit: {
    source: require('@/assets/images/illust-icons/work-schedule-edit.svg'),
    frameSize: 18,
    imageWidth: 14.0001,
    imageHeight: 12.3141,
  },
  workScheduleAdd: {
    source: require('@/assets/images/illust-icons/work-schedule-add.svg'),
    frameSize: 18,
    imageWidth: 14.0002,
    imageHeight: 14.8053,
  },
  calendar: {
    source: require('@/assets/images/illust-icons/calendar.svg'),
    frameSize: 18,
    imageWidth: 14.0002,
    imageHeight: 14.8054,
  },
  announcement: {
    source: require('@/assets/images/illust-icons/announcement.svg'),
    frameSize: 26,
    imageWidth: 21.9998,
    imageHeight: 17.0751,
  },
  sent: {
    source: require('@/assets/images/illust-icons/sent.svg'),
    frameSize: 26,
    imageWidth: 22,
    imageHeight: 17,
  },
  received: {
    source: require('@/assets/images/illust-icons/received.svg'),
    frameSize: 26,
    imageWidth: 22,
    imageHeight: 17,
  },
  handoffReceived: {
    source: require('@/assets/images/illust-icons/handoff-received.svg'),
    frameSize: 26,
    imageWidth: 20,
    imageHeight: 20.0043,
  },
  handoffConfirmed: {
    source: require('@/assets/images/illust-icons/handoff-confirmed.svg'),
    frameSize: 26,
    imageWidth: 20,
    imageHeight: 20,
  },
  workSchedule: {
    source: require('@/assets/images/illust-icons/work-schedule.svg'),
    frameSize: 26,
    imageWidth: 20,
    imageHeight: 22.2275,
  },
} as const satisfies Record<string, IllustIconAsset>;

export type IllustIconName = keyof typeof ILLUST_ICON_ASSETS;
