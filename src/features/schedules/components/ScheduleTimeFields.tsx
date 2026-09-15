import { Controller, type Control } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import type { ScheduleFormValues } from '@/features/schedules/types';
import { formatTimeInput } from '@/shared/lib/formatters';
import { TextField } from '@/shared/ui';

type ScheduleTimeFieldsProps = {
  control: Control<ScheduleFormValues>;
  disabled?: boolean;
  readOnly?: boolean;
  onChange: () => void;
};

export function ScheduleTimeFields({
  control,
  disabled,
  readOnly,
  onChange,
}: ScheduleTimeFieldsProps) {
  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <Controller
          control={control}
          name="startTime"
          render={({ field, fieldState }) => (
            <TextField
              appearance="time"
              accessibilityLabel="출근 시간"
              label="출근"
              placeholder="00:00"
              keyboardType="number-pad"
              value={field.value}
              onChangeText={(text) => {
                field.onChange(formatTimeInput(text));
                onChange();
              }}
              ref={field.ref}
              onBlur={field.onBlur}
              disabled={disabled}
              readOnly={readOnly}
              status={fieldState.error ? 'error' : 'none'}
              subtitle={fieldState.error?.message}
            />
          )}
        />
      </View>
      <View style={styles.field}>
        <Controller
          control={control}
          name="endTime"
          render={({ field, fieldState }) => (
            <TextField
              appearance="time"
              accessibilityLabel="퇴근 시간"
              label="퇴근"
              placeholder="00:00"
              keyboardType="number-pad"
              value={field.value}
              onChangeText={(text) => {
                field.onChange(formatTimeInput(text));
                onChange();
              }}
              ref={field.ref}
              onBlur={field.onBlur}
              disabled={disabled}
              readOnly={readOnly}
              status={fieldState.error ? 'error' : 'none'}
              subtitle={fieldState.error?.message}
            />
          )}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1 },
});
