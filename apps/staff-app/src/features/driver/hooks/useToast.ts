// src/features/driver/hooks/useToast.ts

import { useState, useCallback, useRef } from 'react';

export const useToast = () => {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToastMsg(null), 2500);
  }, []);

  const clearToast = useCallback(() => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    setToastMsg(null);
  }, []);

  return { toastMsg, showToast, clearToast };
};