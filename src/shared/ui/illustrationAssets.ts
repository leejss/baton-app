import type { ImageSource } from 'expo-image';

/** Figma `Illust Icon`의 역할 일러스트를 아이콘과 분리해 관리하는 이미지 맵. */
type IllustrationAsset = {
  source: ImageSource | number;
  width: number;
  height: number;
};

export const ILLUSTRATION_ASSETS = {
  manager: {
    source: require('@/assets/images/illustrations/manager.svg'),
    width: 80,
    height: 84.873,
  },
  worker: {
    source: require('@/assets/images/illustrations/worker.svg'),
    width: 78,
    height: 83.705,
  },
} as const satisfies Record<string, IllustrationAsset>;

export type IllustrationName = keyof typeof ILLUSTRATION_ASSETS;
