import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useUpdateDisplayName } from '@/features/auth/api/account.mutations';
import { signupNameFormSchema, type SignupNameForm } from '@/features/auth/lib/validation';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { SettingsMessage } from '@/features/settings/components/SettingsMessage';
import { normalizeError } from '@/shared/api/errors';
import { TextField } from '@/shared/ui';

export function EditNameDialog({
  displayName,
  onClose,
  onSaved,
}: {
  displayName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const mutation = useUpdateDisplayName();
  const { control, handleSubmit } = useForm<SignupNameForm>({
    resolver: zodResolver(signupNameFormSchema),
    defaultValues: { displayName },
  });
  return (
    <SettingsDialog
      visible
      title="이름 수정"
      confirmLabel="저장"
      isPending={mutation.isPending}
      onCancel={onClose}
      onConfirm={handleSubmit((values) =>
        mutation.mutate(values.displayName, { onSuccess: onSaved }),
      )}
    >
      <Controller
        control={control}
        name="displayName"
        render={({ field, fieldState }) => (
          <TextField
            label="이름"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            autoFocus
            maxLength={20}
            disabled={mutation.isPending}
            status={fieldState.error ? 'error' : 'none'}
            subtitle={fieldState.error?.message}
          />
        )}
      />
      {mutation.error && (
        <SettingsMessage tone="error" message={normalizeError(mutation.error).message} />
      )}
    </SettingsDialog>
  );
}
