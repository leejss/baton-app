import { describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, Text as RNText } from 'react-native';

import { TextField } from '@/shared/ui/TextField';
import { lightColors } from '@/theme/colors';

/** 입력 자체의 글자색. 시안 `state` 배리언트를 구분하는 값 중 하나다. */
function valueColorOf(label: string): string | undefined {
  return StyleSheet.flatten(screen.getByLabelText(label).props.style)?.color;
}

/** 보조문구의 글자색. */
function subtitleColorOf(text: string): string | undefined {
  return StyleSheet.flatten(screen.getByText(text).props.style)?.color;
}

describe('TextField', () => {
  it('라벨·보조문구·타이머 슬롯을 모두 그린다', async () => {
    await render(
      <TextField
        label="타이틀"
        subtitle="비밀번호를 다시 확인해주세요. (5/5)"
        timer="02:59"
        rightIcon={<RNText>eye</RNText>}
      />,
    );

    expect(screen.getByText('타이틀')).toBeTruthy();
    expect(screen.getByText('비밀번호를 다시 확인해주세요. (5/5)')).toBeTruthy();
    expect(screen.getByText('02:59')).toBeTruthy();
    expect(screen.getByText('eye')).toBeTruthy();
  });

  it('Default → Focus → Filled 순으로 글자색이 시안대로 바뀐다', async () => {
    const { rerender } = await render(<TextField label="타이틀" value="" />);

    expect(valueColorOf('타이틀')).toBe(lightColors.textTertiary);

    await fireEvent(screen.getByLabelText('타이틀'), 'focus');
    expect(valueColorOf('타이틀')).toBe(lightColors.textPrimary);

    await fireEvent(screen.getByLabelText('타이틀'), 'blur');
    await rerender(<TextField label="타이틀" value="입력값" />);
    expect(valueColorOf('타이틀')).toBe(lightColors.textSecondary);
  });

  it('Error·Success는 보조문구 색이 상태를 따른다', async () => {
    const { rerender } = await render(
      <TextField label="타이틀" status="error" subtitle="다시 확인해주세요." />,
    );
    expect(subtitleColorOf('다시 확인해주세요.')).toBe(lightColors.danger);

    await rerender(
      <TextField label="타이틀" status="success" subtitle="사용 가능한 아이디입니다." />,
    );
    expect(subtitleColorOf('사용 가능한 아이디입니다.')).toBe(lightColors.success);
  });

  it('검증 결과는 포커스보다 우선한다', async () => {
    await render(<TextField label="타이틀" status="error" subtitle="다시 확인해주세요." />);

    await fireEvent(screen.getByLabelText('타이틀'), 'focus');

    expect(subtitleColorOf('다시 확인해주세요.')).toBe(lightColors.danger);
  });

  it('Disabled는 입력을 막는다', async () => {
    await render(<TextField label="타이틀" disabled value="입력값" />);

    const input = screen.getByLabelText('타이틀');
    expect(input.props.editable).toBe(false);
    expect(valueColorOf('타이틀')).toBe(lightColors.textTertiary);
  });
});
