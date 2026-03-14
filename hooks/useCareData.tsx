import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import {
  Activity,
  initialActivities,
  initialMedications,
  Medication,
  upcomingAppointments,
} from '../constants/mockData';

type ActivityType = 'medication' | 'checkin' | 'voice';

type CareContextValue = {
  medications: Medication[];
  activities: Activity[];
  appointments: typeof upcomingAppointments;
  careScore: number;
  takeMedication: (id: string) => void;
  logCheckIn: () => void;
  logVoiceUpdate: () => void;
};

const CareDataContext = createContext<CareContextValue | undefined>(undefined);

const activityColorMap: Record<ActivityType, string> = {
  medication: '#3AAFA9',
  checkin: '#6BCFCB',
  voice: '#FF7A7A',
};

export function CareDataProvider({ children }: { children: ReactNode }) {
  const [medications, setMedications] = useState<Medication[]>(initialMedications);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  const appendActivity = (user: string, action: string, type: ActivityType) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

    const freshActivity: Activity = {
      id,
      user,
      action,
      timestamp,
      avatarColor: activityColorMap[type],
    };

    setActivities((prev) => [freshActivity, ...prev]);
  };

  const takeMedication = (id: string) => {
    let capturedName = '';

    setMedications((prev) =>
      prev.map((item) => {
        if (item.id === id && item.status === 'pending') {
          capturedName = item.name;
          return { ...item, status: 'taken' };
        }
        return item;
      })
    );

    if (capturedName) {
      appendActivity('You', `logged medication: ${capturedName}`, 'medication');
    }
  };

  const logCheckIn = () => {
    appendActivity('You', 'completed a family check-in', 'checkin');
  };

  const logVoiceUpdate = () => {
    appendActivity('You', 'recorded a voice update', 'voice');
  };

  const careScore = useMemo(() => {
    const done = medications.filter((item) => item.status === 'taken').length;
    if (medications.length === 0) {
      return 0;
    }
    return Math.round((done / medications.length) * 100);
  }, [medications]);

  const value = useMemo(
    () => ({
      medications,
      activities,
      appointments: upcomingAppointments,
      careScore,
      takeMedication,
      logCheckIn,
      logVoiceUpdate,
    }),
    [activities, careScore, medications]
  );

  return <CareDataContext.Provider value={value}>{children}</CareDataContext.Provider>;
}

export function useCareData() {
  const context = useContext(CareDataContext);

  if (!context) {
    throw new Error('useCareData must be used inside CareDataProvider');
  }

  return context;
}