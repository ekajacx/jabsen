"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "Staff" | "Supervisor" | "HRD" | "GM" | "CEO" | "Admin IT";

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  department: string;
  jobTitle: string;
  avatar?: string;
  officeLocation: string;
}

export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  "Staff": {
    id: "EMP-001",
    name: "Budi Santoso",
    username: "staff.operasional",
    role: "Staff",
    department: "Operasional",
    jobTitle: "Staff Operasional",
    officeLocation: "Kantor Pusat Jakarta",
  },
  "Supervisor": {
    id: "EMP-002",
    name: "Siti Rahmawati",
    username: "spv.operasional",
    role: "Supervisor",
    department: "Operasional",
    jobTitle: "Supervisor Operasional",
    officeLocation: "Kantor Pusat Jakarta",
  },
  "HRD": {
    id: "EMP-003",
    name: "Dewi Lestari",
    username: "hrd.admin",
    role: "HRD",
    department: "HRD",
    jobTitle: "Admin HRD & Personalia",
    officeLocation: "Kantor Pusat Jakarta",
  },
  "GM": {
    id: "EMP-004",
    name: "Hendra Wijaya",
    username: "gm.operasional",
    role: "GM",
    department: "Manajemen",
    jobTitle: "General Manager",
    officeLocation: "Kantor Pusat Jakarta",
  },
  "CEO": {
    id: "EMP-005",
    name: "Eka Jacx",
    username: "ceo.ekajacx",
    role: "CEO",
    department: "Direksi",
    jobTitle: "Chief Executive Officer",
    officeLocation: "Kantor Pusat Jakarta",
  },
  "Admin IT": {
    id: "EMP-006",
    name: "Rian Saputra",
    username: "admin.it",
    role: "Admin IT",
    department: "Teknologi Informasi",
    jobTitle: "Administrator Sistem & Keamanan",
    officeLocation: "Kantor Pusat Jakarta",
  },
};

interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  login: (username: string, role?: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(DEMO_PROFILES["Staff"]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  useEffect(() => {
    const savedRole = localStorage.getItem("j_absen_role") as UserRole | null;
    if (savedRole && DEMO_PROFILES[savedRole]) {
      setUser(DEMO_PROFILES[savedRole]);
    }
  }, []);

  const login = (username: string, role?: UserRole) => {
    let targetRole = role;
    if (!targetRole) {
      if (username.includes("admin") || username.includes("it")) targetRole = "Admin IT";
      else if (username.includes("ceo")) targetRole = "CEO";
      else if (username.includes("gm")) targetRole = "GM";
      else if (username.includes("hrd") || username.includes("hr")) targetRole = "HRD";
      else if (username.includes("spv")) targetRole = "Supervisor";
      else targetRole = "Staff";
    }

    const profile = DEMO_PROFILES[targetRole] || DEMO_PROFILES["Staff"];
    setUser({ ...profile, username });
    setIsAuthenticated(true);
    localStorage.setItem("j_absen_role", targetRole);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("j_absen_role");
  };

  const switchRole = (role: UserRole) => {
    if (DEMO_PROFILES[role]) {
      setUser(DEMO_PROFILES[role]);
      setIsAuthenticated(true);
      localStorage.setItem("j_absen_role", role);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
