import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { LocalAttachment } from '@/features/handoffs/model/handoff';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const mockAttachmentFiles = new Map<string, LocalAttachment>();

/** mock 저장소가 실제 업로드 완료 응답처럼 로컬 사진을 상세 응답에 되돌려줄 때 사용한다. */
export function getMockAttachmentFile(attachmentId: string): LocalAttachment | undefined {
  return mockAttachmentFiles.get(attachmentId);
}

export async function pickHandoffImages(selectionLimit: number): Promise<LocalAttachment[]> {
  if (selectionLimit <= 0) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    orderedSelection: true,
    selectionLimit,
    quality: 1,
  });

  if (result.canceled) return [];

  return Promise.all(result.assets.map((asset, index) => prepareAttachment(asset, index)));
}

async function prepareAttachment(
  asset: ImagePicker.ImagePickerAsset,
  index: number,
): Promise<LocalAttachment> {
  const originalMimeType = asset.mimeType ?? '';
  const originalSize = asset.fileSize ?? getFileSize(asset.uri);
  const needsConversion = !SUPPORTED_MIME_TYPES.has(originalMimeType);
  const needsCompression = originalSize === null || originalSize > MAX_IMAGE_BYTES;

  let uri = asset.uri;
  let width = asset.width;
  let height = asset.height;
  let sizeBytes = originalSize ?? MAX_IMAGE_BYTES + 1;
  let mimeType = normalizeMimeType(originalMimeType);

  if (needsConversion || needsCompression) {
    const firstPass = await renderJpeg(uri, width > 2_048 ? 2_048 : undefined, 0.78);
    uri = firstPass.uri;
    width = firstPass.width;
    height = firstPass.height;
    sizeBytes = getFileSize(uri) ?? sizeBytes;
    mimeType = 'image/jpeg';
  }

  if (sizeBytes > MAX_IMAGE_BYTES) {
    const secondPass = await renderJpeg(uri, width > 1_600 ? 1_600 : undefined, 0.6);
    uri = secondPass.uri;
    width = secondPass.width;
    height = secondPass.height;
    sizeBytes = getFileSize(uri) ?? sizeBytes;
  }

  if (sizeBytes > MAX_IMAGE_BYTES) {
    throw new Error('5MB 이하로 줄일 수 없는 사진이 있어요. 다른 사진을 선택해 주세요.');
  }

  const localId = `${Date.now()}-${index}-${asset.assetId ?? asset.fileName ?? 'image'}`;

  const attachment: LocalAttachment = {
    localId,
    uri,
    fileName: mimeType === 'image/jpeg' ? `${localId}.jpg` : (asset.fileName ?? `${localId}.png`),
    mimeType,
    sizeBytes,
    width,
    height,
    // TODO(api): presign → 업로드 → complete가 연결되면 VERIFIED 응답 ID로 교체한다.
    attachmentId: `mock-attachment-${localId}`,
  };
  mockAttachmentFiles.set(attachment.attachmentId ?? localId, attachment);
  return attachment;
}

async function renderJpeg(uri: string, width: number | undefined, compress: number) {
  const context = ImageManipulator.manipulate(uri);
  if (width !== undefined) context.resize({ width });
  const image = await context.renderAsync();
  return image.saveAsync({ format: SaveFormat.JPEG, compress });
}

function getFileSize(uri: string): number | null {
  try {
    return new File(uri).size;
  } catch {
    return null;
  }
}

function normalizeMimeType(value: string): LocalAttachment['mimeType'] {
  if (value === 'image/png' || value === 'image/webp') return value;
  return 'image/jpeg';
}
