import AsyncStorage from "@react-native-async-storage/async-storage";
import analytics from "@react-native-firebase/analytics";
import messaging from "@react-native-firebase/messaging";
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

  const loadContactData = useCallback(async (currentUserId?: string) => {
    let localContact: WatcherContact | null = null;
    let localCheckIn: string | null = null;
    
    try {
      const [contactStr, lastCheckIn] = await AsyncStorage.multiGet([
        STORAGE_KEYS.CONTACT,
        STORAGE_KEYS.LAST_CHECK_IN,
      ]);
      localContact = contactStr[1] ? JSON.parse(contactStr[1]) : null;
      localCheckIn = lastCheckIn[1] ?? null;
    } catch {
      // ignore
    }

    if (isSupabaseConfigured && currentUserId) {
      try {
        const { data: contacts } = await supabase
          .from("emergency_contacts")
          .select("name, phone")
          .eq("user_id", currentUserId)
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(1);

        if (contacts && contacts.length > 0) {
          localContact = contacts[0] as WatcherContact;
        }

        const { data: checkIns } = await supabase
          .from("check_ins")
          .select("checked_in_at")
          .eq("user_id", currentUserId)
          .order("checked_in_at", { ascending: false })
          .limit(1);

        if (checkIns && checkIns.length > 0) {
          localCheckIn = checkIns[0].checked_in_at;
        }
      } catch (e) {
        console.error("Error loading Supabase data:", e);
      }
    }

    setState((prev) => ({
      ...prev,
      contact: localContact,
      lastCheckIn: localCheckIn,
    }));
  }, []);

  const setupFirebase = async (userId: string) => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await messaging().getToken();
        await supabase
          .from("user_settings")
          .update({ push_token: token })
          .eq("user_id", userId);
      }
      
      await analytics().setUserId(userId);
    } catch (e) {
      console.error("Firebase setup error:", e);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      loadStoredData();
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const u = userFromSupabaseSession(session);
        setState((prev: AppState) => ({
          ...prev,
          user: u,
          isLoading: false,
        }));
        loadContactData(u.id);
        if (u.id) setupFirebase(u.id);
      } else {
        setState((prev: AppState) => ({ ...prev, isLoading: false }));
        loadContactData();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          const u = userFromSupabaseSession(session);
          setState((prev: AppState) => ({ ...prev, user: u }));
          loadContactData(u.id);
          if (u.id) setupFirebase(u.id);
        } else {
          setState((prev: AppState) => ({ ...prev, user: null }));
          loadContactData();
        }
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
      analytics().logEvent("contact_added", { method: "button" });
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CONTACT);
    }
    
    setState((prev: AppState) => {
      const prevUser = prev.user;
      if (isSupabaseConfigured && prevUser?.id) {
        if (contact) {
          // Deactivate old ones and insert new
          supabase
            .from("emergency_contacts")
            .update({ is_active: false })
            .eq("user_id", prevUser.id)
            .then(() => {
              supabase.from("emergency_contacts").insert({
                user_id: prevUser.id,
                name: contact.name,
                phone: contact.phone,
                is_active: true,
              }).then();
            });
        } else {
          // Remove active contacts
          supabase
            .from("emergency_contacts")
            .update({ is_active: false })
            .eq("user_id", prevUser.id)
            .then();
        }
      }
      return { ...prev, contact };
    });
  }, []);

  const recordCheckIn = useCallback(async () => {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_CHECK_IN, now);
    analytics().logEvent("check_in_button_pressed", { method: "button" });
    
    setState((prev: AppState) => {
      const prevUser = prev.user;
      if (isSupabaseConfigured && prevUser?.id) {
        supabase.from("check_ins").insert({
          user_id: prevUser.id,
          checked_in_at: now,
          method: "button"
        }).then();
      }
      return { ...prev, lastCheckIn: now };
    });
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
