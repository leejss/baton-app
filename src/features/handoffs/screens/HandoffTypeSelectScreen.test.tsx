import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useHandoffDraftStore } from "@/features/handoffs/store/handoffDraftStore";
import { HandoffTypeSelectScreen } from "@/features/handoffs/screens/HandoffTypeSelectScreen";

jest.mock("expo-router", () => ({
  useFocusEffect: jest.fn(),
}));

const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 44, right: 0, bottom: 34, left: 0 },
};

afterEach(async () => {
  await cleanup();
  useHandoffDraftStore.getState().reset();
});

describe("HandoffTypeSelectScreen", () => {
  it("업무 처리를 기본 선택으로 보여주고 다음 단계에서 초안에 확정한다", async () => {
    const onNext = jest.fn();

    await render(
      <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
        <HandoffTypeSelectScreen onExit={jest.fn()} onNext={onNext} />
      </SafeAreaProvider>,
    );

    expect(screen.getByText("어떤 내용을 전달해야하나요?")).toBeOnTheScreen();
    expect(
      screen.getByLabelText("업무 처리, 못 끝낸 일, 정산 등").props
        .accessibilityState,
    ).toMatchObject({ selected: true });
    expect(useHandoffDraftStore.getState().type).toBeNull();

    await fireEvent.press(screen.getByLabelText("다음"));

    expect(useHandoffDraftStore.getState().type).toBe("WORK_TASK");
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
