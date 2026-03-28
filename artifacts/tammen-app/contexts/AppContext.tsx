import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export interface WatcherContact {
  name: string;
  phone: string;
}

export interface User {
  id?: string;
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

function userFromSupabaseSession(session: { user: { id: string; email?: string; user_metadata?: Record<string, string> } }): User {
  const meta = session.user.user_metadata ?? {};
  const email = session.user.email ?? "";
  const name =
    meta.full_name ??
    meta.name ??
    (email ? email.split("@")[0] : "مستخدم");
  return { id: session.user.id, name, email };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    contact: null,
    lastCheckIn: null,
    isLoading: true,
  });

  const loadContactData = useCallback(async () => {
    try {
      const [contactStr, lastCheckIn] = await AsyncStorage.multiGet([
        STORAGE_KEYS.CONTACT,
        STORAGE_KEYS.LAST_CHECK_IN,
      ]);
      setState((prev) => ({
        ...prev,
        contact: contactStr[1] ? JSON.parse(contactStr[1]) : null,
        lastCheckIn: lastCheckIn[1] ?? null,
      }));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      loadStoredData();
      return;
    }

    loadContactData();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setState((prev) => ({
          ...prev,
          user: userFromSupabaseSession(session),
          isLoading: false,
        }));
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState((prev) => ({
          ...prev,
          user: session ? userFromSupabaseSession(session) : null,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, [loadContactData]);

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
    if (!isSupabaseConfigured) {
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      }
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
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    }
    setState((prev) => ({ ...prev, user: null }));
  }, []);

  const resetData = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
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
