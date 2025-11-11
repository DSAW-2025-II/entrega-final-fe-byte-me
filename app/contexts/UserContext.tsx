"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api } from "@/lib/api";
import { ensureValidToken } from "@/lib/auth";

interface User {
  uid: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  user_photo?: string | null;
  is_driver?: boolean;
  birth_date?: string;
  id_number?: string;
  roles?: string[];
  hasCar?: boolean;
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
      const token = await ensureValidToken();
      if (!token) {
        setUser(null);
        setRoleState(null);
        setLoading(false);
        return;
      }

      const userData = await api.get("/api/me", token);
      if (userData) {
        // El backend ya devuelve roles y hasCar
        const roles = userData.roles || [];
        const hasCar = userData.hasCar || false;

        const updatedUser: User = {
          ...userData,
          roles,
          hasCar,
        };

        setUserState(updatedUser);
        
        // Determinar rol actual basado en los datos del backend
        if (userData.is_driver && hasCar) {
          setRoleState("driver");
        } else {
          setRoleState("passenger");
        }
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
    refreshUser();
  }, [refreshUser]);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      const roles = [];
      if (newUser.is_driver) {
        roles.push("driver");
      }
      roles.push("passenger");
      
      if (newUser.is_driver && newUser.hasCar) {
        setRoleState("driver");
      } else {
        setRoleState("passenger");
      }
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

