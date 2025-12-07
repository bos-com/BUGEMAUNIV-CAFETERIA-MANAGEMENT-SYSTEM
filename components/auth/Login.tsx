"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

type LoginProps = {
  onLogin: (userData: any, type: "student" | "staff" | "admin") => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [regNumber, setRegNumber] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("student");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const table =
        userType === "student"
          ? "students"
          : userType === "staff"
          ? "staff"
          : "staff";

      const idField =
        userType === "student"
          ? "reg_number"
          : userType === "staff"
          ? "staff_id"
          : "staff_id";

      const { data, error: queryError } = await supabase
        .from(table)
        .select("*")
        .eq(idField, regNumber)
        .eq("password", password)
        .single();

      if (queryError || !data) throw new Error("Invalid credentials");

      // -----------------------------
      // ✅ FIX: Call onLogin first
      // -----------------------------
      onLogin(data, userType);

      // Save user data
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...data,
          userType,
        })
      );

      // Force session for middleware
      document.cookie = `sb-access-token=local-user; path=/; max-age=3600`;

      // Redirect user
      if (userType === "student") {
        router.push("/student/dashboard");
      } else if (userType === "staff") {
        router.push("/staff/dashboard");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex items-center justify-center p-4">
      {/* Background Glow Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-6xl">
            <img src="/logo.png" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            BUGEMA UNIVERSITY
          </h1>
          <p className="text-muted-foreground mt-2">
            Cafeteria Management system
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 backdrop-blur">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* User Type Selector */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted rounded-xl">
              {[
                { type: "student", label: "Student", icon: "🎓" },
                { type: "staff", label: "Staff", icon: "👨‍💼" },
                { type: "admin", label: "Admin", icon: "⚙️" },
              ].map((option) => (
                <button
                  key={option.type}
                  onClick={() => setUserType(option.type)}
                  type="button"
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    userType === option.type
                      ? "bg-white text-primary shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              {/* ID / Reg Number */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {userType === "student"
                    ? "Registration Number"
                    : userType === "staff"
                    ? "Staff ID"
                    : "Admin ID"}
                </label>
                <input
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="Enter your ID"
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground py-2.5 px-4 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
