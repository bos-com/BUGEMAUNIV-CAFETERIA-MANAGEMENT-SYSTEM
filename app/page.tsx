"use client";

import { useEffect, useState } from "react";
import Login from "@/app/auth/Login/page";
import StudentDashboard from "@/app/student/dashboard/page";
import StaffDashboard from "@/app/staff/dashboard/page";
import AdminDashboard from "@/app/admin/dashboard/page";
import type { Student, Staff, UserType } from "@/types";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  const handleLogin = (userData: Student | Staff, type: UserType) => {
    const finalUser = { ...userData, userType: type };
    setUser(finalUser);
    localStorage.setItem("user", JSON.stringify(finalUser));
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // ---------------------------
  // NOT LOGGED IN → SHOW LOGIN
  // ---------------------------
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // ---------------------------
  // STUDENT DASHBOARD
  // ---------------------------
  if (user.userType === "student") {
    return <StudentDashboard student={user} />;
  }

  // ---------------------------
  // STAFF DASHBOARD
  // ---------------------------
  if (user.userType === "staff") {
    return <StaffDashboard staff={user} />;
  }

  // ---------------------------
  // ADMIN DASHBOARD
  // ---------------------------
  if (user.userType === "admin") {
    return <AdminDashboard admin={user} />;
  }

  return null;
}
