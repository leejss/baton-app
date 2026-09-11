import { afterEach, describe, expect, it } from "@jest/globals";

import { MOCK_MEMBERS } from "@/test/fixtures/handoffs";
import {
  hasHandoffDraftChanges,
  useHandoffDraftStore,
} from "@/features/handoffs/store/handoffDraftStore";

describe("handoff draft store", () => {
  afterEach(() => {
    useHandoffDraftStore.getState().reset();
  });

  it("작성 화면 사이에서 유형·내용·수신자를 유지한다", () => {
    const recipient = MOCK_MEMBERS[1];
    expect(recipient).toBeDefined();
    if (recipient === undefined) return;

    const recipientModel = { member: recipient, isRecommended: true };
    const actions = useHandoffDraftStore.getState();
    actions.setType("STORE_STATUS");
    actions.setContent("제빙기 확인", "오픈 전에 상태를 확인해 주세요.");
    actions.setRecipient(recipientModel);

    expect(useHandoffDraftStore.getState()).toMatchObject({
      type: "STORE_STATUS",
      title: "제빙기 확인",
      body: "오픈 전에 상태를 확인해 주세요.",
      recipient: recipientModel,
    });
    expect(hasHandoffDraftChanges(useHandoffDraftStore.getState())).toBe(true);
  });

  it("첨부는 최대 10장만 보관하고 개별 삭제할 수 있다", () => {
    const attachments = Array.from({ length: 12 }, (_, index) => ({
      localId: `local-${index}`,
      uri: `file:///photo-${index}.jpg`,
      fileName: `photo-${index}.jpg`,
      mimeType: "image/jpeg" as const,
      sizeBytes: 100,
      width: 100,
      height: 100,
    }));

    useHandoffDraftStore.getState().addAttachments(attachments);
    expect(useHandoffDraftStore.getState().attachments).toHaveLength(10);

    useHandoffDraftStore.getState().removeAttachment("local-3");
    expect(useHandoffDraftStore.getState().attachments).toHaveLength(9);
    expect(
      useHandoffDraftStore
        .getState()
        .attachments.some(({ localId }) => localId === "local-3"),
    ).toBe(false);
  });

  it("전송 또는 명시적 이탈 뒤 작성값을 초기화한다", () => {
    useHandoffDraftStore.getState().setType("OTHER");
    useHandoffDraftStore.getState().reset();

    expect(hasHandoffDraftChanges(useHandoffDraftStore.getState())).toBe(false);
  });
});
