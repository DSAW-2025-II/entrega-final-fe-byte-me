"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth as clientAuth } from "@/lib/firebaseClient";

interface User {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  user_photo?: string | null;
}

type Role = "driver" | "passenger" | null;

interface UserContextType {
  user: User | null;
  role: Role;
  setUser: (user: User | null) => void;
  setRole: (role: Role) => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [role, setRoleState] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      if (!clientAuth) {
        setUser(null);
        setRoleState(null);
        setLoading(false);
        return;
      }
      const fbUser = clientAuth.currentUser as FirebaseUser | null;
      if (fbUser) {
        const u: User = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          user_photo: fbUser.photoURL,
        };
        setUserState(u);
        setRoleState("passenger");
      } else {
        setUser(null);
        setRoleState(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
      setRoleState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!clientAuth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(clientAuth, () => {
      refreshUser();
    });
    return () => unsub();
  }, [refreshUser]);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      setRoleState("passenger");
    } else {
      setRoleState(null);
    }
  };

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        role,
        setUser,
        setRole,
        refreshUser,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

