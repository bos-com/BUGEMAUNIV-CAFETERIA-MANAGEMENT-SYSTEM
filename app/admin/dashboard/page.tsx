"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import StudentManagement from "../StudentManagement";
import StaffManagement from "../StaffManagement";
import PaymentManagement from "../PaymentManagement";
import Reports from "../Reports";
import SystemSettings from "../SystemSettings";
import type { AdminDashboardProps } from "../../../types";

type AdminTab = "students" | "staff" | "payments" | "reports" | "settings";

export default function AdminDashboard({ admin }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("students");

  const logout = () => {
    localStorage.removeItem("user");
    supabase.auth.signOut();
    window.location.href = "/welcome";
  };

  const tabs = [
    { id: "students" as AdminTab, name: "Students", icon: "👨‍🎓" },
    { id: "staff" as AdminTab, name: "Staff", icon: "👨‍💼" },
    { id: "payments" as AdminTab, name: "Payments", icon: "💰" },
    { id: "reports" as AdminTab, name: "Reports", icon: "📊" },
    { id: "settings" as AdminTab, name: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* HEADER WITH LOGOUT BUTTON */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>

          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 font-medium text-sm whitespace-nowrap rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === "students" && <StudentManagement />}
          {activeTab === "staff" && <StaffManagement />}
          {activeTab === "payments" && <PaymentManagement />}
          {activeTab === "reports" && <Reports />}
          {activeTab === "settings" && <SystemSettings />}
        </div>
      </div>
    </div>
  );
}
