export type MedicationStatus = 'pending' | 'taken';

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  time: string;
  status: MedicationStatus;
};

export type Activity = {
  id: string;
  user: string;
  timestamp: string;
  action: string;
  avatarColor: string;
};

export type Appointment = {
  id: string;
  title: string;
  time: string;
};

export const patientStatus = {
  name: 'Mom (Anita Verma)',
  heartbeat: '72 bpm',
  hydration: 'Good',
  sleep: '7h 25m',
};

export const initialMedications: Medication[] = [
  { id: 'm1', name: 'Metformin', dosage: '500mg', time: '08:00 AM', status: 'taken' },
  { id: 'm2', name: 'Amlodipine', dosage: '5mg', time: '12:30 PM', status: 'pending' },
  { id: 'm3', name: 'Vitamin D3', dosage: '1000 IU', time: '08:00 PM', status: 'pending' },
  { id: 'm4', name: 'Atorvastatin', dosage: '20mg', time: '09:30 PM', status: 'pending' },
];

export const initialActivities: Activity[] = [
  {
    id: 'a1',
    user: 'Rahul',
    timestamp: '6:20 PM',
    action: 'checked on Mom',
    avatarColor: '#3AAFA9',
  },
  {
    id: 'a2',
    user: 'Priya',
    timestamp: '5:50 PM',
    action: 'logged medication',
    avatarColor: '#7BC4C1',
  },
  {
    id: 'a3',
    user: 'Clinic',
    timestamp: '4:30 PM',
    action: 'scheduled doctor appointment',
    avatarColor: '#FF7A7A',
  },
];

export const upcomingAppointments: Appointment[] = [
  { id: 'p1', title: 'Dr. Menon - Cardiology', time: 'Tomorrow, 10:45 AM' },
  { id: 'p2', title: 'Physiotherapy Follow-up', time: 'Tue, 03:30 PM' },
];
