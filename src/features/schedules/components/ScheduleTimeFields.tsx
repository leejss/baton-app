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

const TIME_FIELDS = [
  { name: 'startTime', label: '출근' },
  { name: 'endTime', label: '퇴근' },
] as const;

export function ScheduleTimeFields({
  control,
  disabled,
  readOnly,
  onChange,
}: ScheduleTimeFieldsProps) {
  return (
    <View style={styles.row}>
      {TIME_FIELDS.map(({ name, label }) => (
        <View key={name} style={styles.field}>
          <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
              <TextField
                appearance="time"
                accessibilityLabel={`${label} 시간`}
                label={label}
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
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1 },
});
