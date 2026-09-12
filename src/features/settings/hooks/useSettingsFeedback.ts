import { useEffect, useState } from 'react';
import type { SettingsFeedback } from '@/features/settings/components/SettingsMessage';

export function useSettingsFeedback() {
  const [feedback, setFeedback] = useState<SettingsFeedback | null>(null);
  useEffect(() => {
    if (!feedback || feedback.tone === 'error') return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);
  return { feedback, setFeedback };
}
