import { useRef, useState } from 'react';
import { Alert } from 'react-native';

import { pickHandoffImages } from '@/features/handoffs/api/handoffImages';
import type { LocalAttachment } from '@/features/handoffs/model/handoff';

type UseHandoffImagePickerOptions = {
  attachmentCount: number;
  onSelected: (attachments: LocalAttachment[]) => void;
};

/** 사진 정책 안내와 최대 개수 계산을 작성·수정 화면이 같은 방식으로 처리하게 한다. */
export function useHandoffImagePicker({
  attachmentCount,
  onSelected,
}: UseHandoffImagePickerOptions) {
  const introductionShown = useRef(false);
  const [isPickingImages, setIsPickingImages] = useState(false);

  const selectImages = async () => {
    setIsPickingImages(true);
    try {
      const selected = await pickHandoffImages(10 - attachmentCount);
      onSelected(selected);
    } catch (error) {
      Alert.alert(
        '사진을 추가하지 못했어요',
        error instanceof Error ? error.message : '다른 사진으로 다시 시도해 주세요.',
      );
    } finally {
      setIsPickingImages(false);
    }
  };

  const addImages = () => {
    if (introductionShown.current) {
      void selectImages();
      return;
    }

    introductionShown.current = true;
    Alert.alert('사진을 추가할까요?', '사진은 최대 10장, 장당 5MB까지 첨부할 수 있어요.', [
      { text: '취소', style: 'cancel' },
      { text: '사진 선택', onPress: () => void selectImages() },
    ]);
  };

  return { addImages, isPickingImages };
}
