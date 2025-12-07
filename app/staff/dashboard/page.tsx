"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MealLogs from "@/components/staff/MealLogs";
import QRScanner from "@/components/staff/QRScanner";
import { supabase } from "@/lib/supabase";
import type { StaffDashboardProps } from "@/types";


type TabType = "scanner" | "logs" | "reports";

export default function StaffDashboard({ staff }: StaffDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("scanner");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const tabs = [
    { id: "scanner" as TabType, name: "QR Scanner", icon: "📱" },
    { id: "logs" as TabType, name: "Meal Logs", icon: "📊" },
    { id: "reports" as TabType, name: "Reports", icon: "📈" },
  ];

  const logout = () => {
    localStorage.removeItem("user");
    supabase.auth.signOut();
    window.location.href = "/welcome";
  };

  return (
    <div className="min-h-screen flex bg-background relative">

      {/* ============================================================
          MOBILE MENU BUTTON (ONLY on Mobile)
      ============================================================= */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-primary text-primary-foreground p-2 rounded-lg shadow"
      >
        ☰
      </button>

      {/* ============================================================
          MOBILE SIDEBAR (Slide-in)
      ============================================================= */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-card border-r border-border p-6 
          transition-transform duration-300 z-40 md:hidden
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="mb-10">
          <h2 className="text-xl font-bold">🍽️ Staff Panel</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {staff?.name || "Staff User"}
          </p>
        </div>

        <nav className="flex-1 flex flex-col gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted border-border text-foreground hover:border-primary/50"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={logout}
          className="w-full bg-red-600 text-white py-2 rounded mt-3"
        >
          Logout
        </button>
      </aside>

      {/* ============================================================
          DESKTOP SIDEBAR (Always Visible — Unchanged UI)
      ============================================================= */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border p-6 flex-col">
        <div className="mb-10">
          <h2 className="text-xl font-bold">🍽️ Staff Panel</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {staff?.name || "Staff User"}
          </p>
        </div>

        <nav className="flex-1 flex flex-col gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted border-border text-foreground hover:border-primary/50"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={logout}
          className="w-full bg-red-600 text-white py-2 rounded mt-3"
        >
          Logout
        </button>
      </aside>

      {/* ============================================================
          MAIN CONTENT (Your UI untouched)
      ============================================================= */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-fade-in">
            {activeTab === "scanner" && <QRScanner staff={staff} />}
            {activeTab === "logs" && <MealLogs staff={staff} />}
            {activeTab === "reports" && (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <p className="text-6xl mb-4">📈</p>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Reports Coming Soon
                </h3>
                <p className="text-muted-foreground">
                  Advanced analytics features will be available soon
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
