"use client";

import { useState, useEffect } from "react";
import Login from "@/app/auth/Login/page";
import StudentDashboard from "@/app/student/dashboard/page";
import StaffDashboard from "@/app/staff/dashboard/page";
import AdminDashboard from "@/app/admin/dashboard/page";
import Header from "@/components/layout/Header";
import type { Student, Staff, UserType } from "@/types";

export default function Home() {
  const [user, setUser] = useState<Student | Staff | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setUserType(userData.userType);
    }
  }, []);

  const handleLogin = (userData: Student | Staff, type: UserType) => {
    setUser(userData);
    setUserType(type);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setUserType(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} userType={userType} onLogout={handleLogout} />

      <main className="animate-fade-in">
        {userType === "student" && (
          <StudentDashboard student={user as Student} />
        )}
        {userType === "staff" && <StaffDashboard staff={user as Staff} />}
        {userType === "admin" && <AdminDashboard admin={user as Staff} />}
      </main>
    </div>
  );
}
