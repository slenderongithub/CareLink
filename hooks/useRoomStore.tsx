import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type MemberRole = 'elder' | 'guardian' | 'patient' | 'full-control';

export type RoomMember = {
  id: string;
  name: string;
  role: MemberRole;
  online: boolean;
};

type AuthUser = {
  name: string;
  email: string;
  isAuthenticated: boolean;
};

type RoomState = {
  roomName: string;
  roomCode: string;
  createdRoom: boolean;
  members: RoomMember[];
};

type StoredState = {
  user: AuthUser;
  room: RoomState;
};

type RoomStoreValue = {
  isReady: boolean;
  user: AuthUser;
  room: RoomState;
  signIn: (input: { name?: string; email: string }) => void;
  signOut: () => void;
  createRoom: (roomName: string) => void;
  addMember: (input: { name: string; role: MemberRole }) => void;
};

const STORAGE_KEY = 'carelink-room-store';

async function getAsyncStorage() {
  try {
    const module = await import('@react-native-async-storage/async-storage');
    return module.default;
  } catch {
    return null;
  }
}

const defaultUser: AuthUser = {
  name: '',
  email: '',
  isAuthenticated: false,
};

const defaultRoom: RoomState = {
  roomName: 'Verma Family Care Room',
  roomCode: '',
  createdRoom: false,
  members: [],
};

const RoomStoreContext = createContext<RoomStoreValue | undefined>(undefined);

function generateRoomCode() {
  const seed = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CLK-${seed}`;
}

export function RoomStoreProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<AuthUser>(defaultUser);
  const [room, setRoom] = useState<RoomState>(defaultRoom);

  useEffect(() => {
    async function load() {
      try {
        const storage = await getAsyncStorage();
        if (!storage) {
          setIsReady(true);
          return;
        }

        const raw = await storage.getItem(STORAGE_KEY);
        if (!raw) {
          setIsReady(true);
          return;
        }

        const parsed = JSON.parse(raw) as StoredState;
        setUser(parsed.user ?? defaultUser);
        setRoom(parsed.room ?? defaultRoom);
      } finally {
        setIsReady(true);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const payload: StoredState = { user, room };
    getAsyncStorage()
      .then((storage) => storage?.setItem(STORAGE_KEY, JSON.stringify(payload)))
      .catch(() => undefined);
  }, [isReady, room, user]);

  const signIn = ({ name, email }: { name?: string; email: string }) => {
    const resolvedName = name?.trim() || user.name || 'You';
    setUser({
      name: resolvedName,
      email: email.trim(),
      isAuthenticated: true,
    });

    setRoom((prev) => {
      if (prev.members.length > 0) {
        return prev;
      }

      return {
        ...prev,
        members: [
          { id: 'm-1', name: resolvedName, role: 'full-control', online: true },
          { id: 'm-2', name: 'Anita Verma', role: 'elder', online: true },
          { id: 'm-3', name: 'Ravi', role: 'patient', online: false },
        ],
      };
    });
  };

  const signOut = () => {
    setUser(defaultUser);
  };

  const createRoom = (roomName: string) => {
    setRoom((prev) => ({
      ...prev,
      roomName: roomName.trim(),
      roomCode: prev.roomCode || generateRoomCode(),
      createdRoom: true,
    }));
  };

  const addMember = ({ name, role }: { name: string; role: MemberRole }) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    setRoom((prev) => ({
      ...prev,
      members: [
        {
          id: `${Date.now()}-${trimmedName}`,
          name: trimmedName,
          role,
          online: true,
        },
        ...prev.members,
      ],
    }));
  };

  const value = useMemo<RoomStoreValue>(
    () => ({
      isReady,
      user,
      room,
      signIn,
      signOut,
      createRoom,
      addMember,
    }),
    [isReady, room, user]
  );

  return <RoomStoreContext.Provider value={value}>{children}</RoomStoreContext.Provider>;
}

export function useRoomStore() {
  const context = useContext(RoomStoreContext);

  if (!context) {
    throw new Error('useRoomStore must be used inside RoomStoreProvider');
  }

  return context;
}