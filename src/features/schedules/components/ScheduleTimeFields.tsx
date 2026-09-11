import { Controller, type Control } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import type { ScheduleFormValues } from "@/features/schedules/types";
import { TextField } from "@/shared/ui";
import { spacing } from "@/theme";

type ScheduleTimeFieldsProps = {
  control: Control<ScheduleFormValues>;
  disabled?: boolean;
  onChange: () => void;
};

function formatInput(text: string) {
  const digits = text.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2
    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
    : digits;
}

export function ScheduleTimeFields({
  control,
  disabled,
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
              accessibilityLabel="출근 시간"
              label="출근"
              placeholder="00:00"
              keyboardType="number-pad"
              value={field.value}
              onChangeText={(text) => {
                field.onChange(formatInput(text));
                onChange();
              }}
              onBlur={field.onBlur}
              disabled={disabled}
              status={fieldState.error ? "error" : "none"}
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
              accessibilityLabel="퇴근 시간"
              label="퇴근"
              placeholder="00:00"
              keyboardType="number-pad"
              value={field.value}
              onChangeText={(text) => {
                field.onChange(formatInput(text));
                onChange();
              }}
              onBlur={field.onBlur}
              disabled={disabled}
              status={fieldState.error ? "error" : "none"}
              subtitle={fieldState.error?.message}
            />
          )}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md },
  field: { flex: 1 },
});
