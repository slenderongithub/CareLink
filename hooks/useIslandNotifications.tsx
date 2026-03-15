import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { DynamicIslandNotification } from '../components/DynamicIsland';

type PushNotificationInput = Omit<DynamicIslandNotification, 'id' | 'timestamp'> & {
  id?: string;
  timestamp?: string;
};

type IslandNotificationContextValue = {
  notification?: DynamicIslandNotification;
  pushNotification: (input: PushNotificationInput) => void;
  clearNotification: (id?: string) => void;
};

const IslandNotificationContext = createContext<IslandNotificationContextValue | undefined>(undefined);

export function IslandNotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<DynamicIslandNotification | undefined>(undefined);

  const pushNotification = useCallback((input: PushNotificationInput) => {
    const id = input.id ?? `n-${Date.now()}`;
    const timestamp =
      input.timestamp ??
      new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });

    setNotification({
      ...input,
      id,
      timestamp,
    });
  }, []);

  const clearNotification = useCallback((id?: string) => {
    setNotification((previous) => {
      if (!previous) {
        return undefined;
      }

      if (id && previous.id !== id) {
        return previous;
      }

      return undefined;
    });
  }, []);

  const value = useMemo(
    () => ({
      notification,
      pushNotification,
      clearNotification,
    }),
    [notification, pushNotification, clearNotification]
  );

  return <IslandNotificationContext.Provider value={value}>{children}</IslandNotificationContext.Provider>;
}

export function useIslandNotifications() {
  const context = useContext(IslandNotificationContext);

  if (!context) {
    throw new Error('useIslandNotifications must be used inside IslandNotificationProvider');
  }

  return context;
}
