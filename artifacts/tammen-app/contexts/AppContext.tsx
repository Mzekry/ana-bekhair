import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface WatcherContact {
  name: string;
  phone: string;
}

export interface User {
  name: string;
  email: string;
}

interface AppState {
  user: User | null;
  contact: WatcherContact | null;
  lastCheckIn: string | null;
  isLoading: boolean;
}

interface AppContextValue extends AppState {
  setUser: (user: User | null) => Promise<void>;
  setContact: (contact: WatcherContact | null) => Promise<void>;
  recordCheckIn: () => Promise<void>;
  logout: () => Promise<void>;
  resetData: () => Promise<void>;
}

const STORAGE_KEYS = {
  USER: "tammen_user",
  CONTACT: "tammen_contact",
  LAST_CHECK_IN: "tammen_last_check_in",
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    contact: null,
    lastCheckIn: null,
    isLoading: true,
  });

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [userStr, contactStr, lastCheckIn] = await AsyncStorage.multiGet([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.CONTACT,
        STORAGE_KEYS.LAST_CHECK_IN,
      ]);

      setState({
        user: userStr[1] ? JSON.parse(userStr[1]) : null,
        contact: contactStr[1] ? JSON.parse(contactStr[1]) : null,
        lastCheckIn: lastCheckIn[1] ?? null,
        isLoading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const setUser = useCallback(async (user: User | null) => {
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    }
    setState((prev) => ({ ...prev, user }));
  }, []);

  const setContact = useCallback(async (contact: WatcherContact | null) => {
    if (contact) {
      await AsyncStorage.setItem(STORAGE_KEYS.CONTACT, JSON.stringify(contact));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CONTACT);
    }
    setState((prev) => ({ ...prev, contact }));
  }, []);

  const recordCheckIn = useCallback(async () => {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_CHECK_IN, now);
    setState((prev) => ({ ...prev, lastCheckIn: now }));
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    setState((prev) => ({ ...prev, user: null }));
  }, []);

  const resetData = useCallback(async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.CONTACT,
      STORAGE_KEYS.LAST_CHECK_IN,
    ]);
    setState({
      user: null,
      contact: null,
      lastCheckIn: null,
      isLoading: false,
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setUser,
        setContact,
        recordCheckIn,
        logout,
        resetData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
