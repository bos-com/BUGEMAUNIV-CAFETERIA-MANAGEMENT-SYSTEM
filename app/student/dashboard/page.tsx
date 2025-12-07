"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { MealLog, MealType, QRCodeData } from "@/types";

/* ================================================================
   MEAL WINDOWS
   ================================================================ */
const MEAL_WINDOWS: Record<MealType, { start: string; end: string }> = {
  breakfast: { start: "06:00am", end: "07:00am" },
  lunch: { start: "1:00pm", end: "8:00pm" },
  supper: { start: "6:00pm", end: "7:30pm" },
};

type QRRow = {
  id: number;
  student_id: string;
  meal_type: MealType;
  qr_data: string;
  qr_image_url?: string;
  expires_at?: string;
  created_at?: string;
};

type Toast = {
  id: string;
  type: "success" | "error" | "info";
  message: string;
};

export default function StudentDashboardPage() {
  /* ================================================================
     STATE
     ================================================================ */
  const [localStudent, setLocalStudent] = useState<any>(null);

  const [mealHistory, setMealHistory] = useState<MealLog[]>([]);
  const [mealBalance, setMealBalance] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"qr" | "history">("qr");
  const [loading, setLoading] = useState(true);

  const [activeQrImage, setActiveQrImage] = useState<string | null>(null);
  const [activeQrData, setActiveQrData] = useState<string | null>(null);
  const [activeQrExpiresAt, setActiveQrExpiresAt] = useState<number | null>(null);
  const [activeMealType, setActiveMealType] = useState<MealType | null>(null);

  const [showSidebar, setShowSidebar] = useState(false);
  const [profileImage, setProfileImage] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const intervalRef = useRef<number | null>(null);

  /* ================================================================
     LOAD STUDENT
     ================================================================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        window.location.href = "/login";
        return;
      }

      const stored = JSON.parse(raw);
      if (stored.userType !== "student") {
        window.location.href = "/login";
        return;
      }

      setLocalStudent(stored);
    } catch (err) {
      console.error("Failed to load student", err);
      window.location.href = "/login";
    }
  }, []);

  /* ================================================================
     INIT AFTER STUDENT LOAD
     ================================================================ */
  useEffect(() => {
    if (!localStudent) return;

    setLoading(true);
    fetchStudentData();
    fetchProfileImage();
    checkAndEnsureActiveQR();

    intervalRef.current = window.setInterval(() => {
      checkAndEnsureActiveQR();
    }, 20_000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStudent]);

  /* ================================================================
     TOASTS
     ================================================================ */
  const pushToast = (type: Toast["type"], message: string) => {
    const id = `t${++toastId.current}`;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  };

  /* ================================================================
     LOAD STUDENT DATA
     ================================================================ */
  const fetchStudentData = async () => {
    try {
      setLoading(true);

      const { data: payments, error: payErr } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id", localStudent.id)
        .order("payment_date", { ascending: false });

      const { data: meals, error: mealErr } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("student_id", localStudent.id)
        .order("served_at", { ascending: false })
        .limit(20);

      if (payErr || mealErr) {
        console.error(payErr || mealErr);
        pushToast("error", "Failed to load meal data");
        return;
      }

      setMealHistory(meals || []);

      let balance = 0;
      payments?.forEach((p) => (balance += p.meals_added));
      meals?.forEach(() => balance--);

      setMealBalance(balance);
    } catch (err) {
      console.error(err);
      pushToast("error", "Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  /* ================================================================
     PROFILE IMAGE (LOAD)
     ================================================================ */
  const fetchProfileImage = async () => {
    try {
      const { data } = await supabase
        .from("students")
        .select("image_url")
        .eq("id", localStudent.id)
        .single();

      if (data?.image_url) setProfileImage(data.image_url);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================================================================
     PROFILE IMAGE UPLOAD
     ================================================================ */
  const uploadProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const ext = file.name.split(".").pop() ?? "png";
      const filePath = `profiles/${localStudent.id}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error(uploadError);
        pushToast("error", "Image upload failed");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      await supabase
        .from("students")
        .update({ image_url: publicUrl })
        .eq("id", localStudent.id);

      setProfileImage(publicUrl);
      pushToast("success", "Profile image updated!");
    } catch (err) {
      console.error(err);
      pushToast("error", "Unexpected upload error");
    }
  };

  /* ================================================================
     CHANGE PASSWORD
     ================================================================ */
  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      pushToast("error", "Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase
        .from("students")
        .update({ password: newPassword })
        .eq("id", localStudent.id);

      if (error) throw error;

      pushToast("success", "Password updated!");
      setNewPassword("");
    } catch (err: any) {
      pushToast("error", err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  /* ================================================================
     TIME HELPERS
     ================================================================ */
  const todayTime = (str: string) => {
    const [h, m] = str.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const isNowInWindow = (mealType: MealType) => {
    const { start, end } = MEAL_WINDOWS[mealType];
    const now = Date.now();
    return now >= todayTime(start).getTime() && now <= todayTime(end).getTime();
  };

  const getCurrentActiveMeal = (): MealType | null => {
    for (const m of ["breakfast", "lunch", "supper"] as MealType[])
      if (isNowInWindow(m)) return m;
    return null;
  };

  const getNextMealInfo = () => {
    const now = Date.now();
    for (const m of ["breakfast", "lunch", "supper"] as MealType[]) {
      const start = todayTime(MEAL_WINDOWS[m].start).getTime();
      if (start > now) return { meal: m, start };
    }

    const d = new Date();
    d.setDate(d.getDate() + 1);
    const [hh, mm] = MEAL_WINDOWS.breakfast.start.split(":").map(Number);
    d.setHours(hh, mm, 0, 0);

    return { meal: "breakfast", start: d.getTime() };
  };

  /* ================================================================
     QR SYSTEM
     ================================================================ */
  const checkAndEnsureActiveQR = async () => {
    try {
      const meal = getCurrentActiveMeal();
      setActiveMealType(meal);

      if (!meal) {
        setActiveQrImage(null);
        setActiveQrData(null);
        setActiveQrExpiresAt(null);
        return;
      }

      const windowStart = todayTime(MEAL_WINDOWS[meal].start).getTime();
      const windowEnd = todayTime(MEAL_WINDOWS[meal].end).getTime();

      const { data: rows, error } = await supabase
        .from<QRRow>("qr_codes")
        .select("*")
        .eq("student_id", localStudent.id)
        .eq("meal_type", meal)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Failed to fetch QR rows:", error);
      }

      const todays = rows?.find((r) => {
        if (!r.created_at) return false;
        return new Date(r.created_at).getTime() >= windowStart;
      });

      if (todays) {
        setActiveQrImage(todays.qr_image_url || null);
        setActiveQrData(todays.qr_data || null);
        setActiveQrExpiresAt(
          todays.expires_at ? new Date(todays.expires_at).getTime() : windowEnd
        );
        return;
      }

      // If none for today, create one
      const created = await createAndUploadQR(meal, windowEnd);
      if (created) {
        setActiveQrImage(created.qr_image_url || null);
        setActiveQrData(created.qr_data || null);
        setActiveQrExpiresAt(
          created.expires_at ? new Date(created.expires_at).getTime() : windowEnd
        );
      }
    } catch (err) {
      console.error("checkAndEnsureActiveQR failed:", err);
      pushToast("error", "QR system failed");
    }
  };

  const createAndUploadQR = async (mealType: MealType, windowEndMs: number) => {
    try {
      const qrObj: QRCodeData = {
        studentId: localStudent.id,
        regNumber: localStudent.reg_number,
        mealType,
        timestamp: new Date().toISOString(),
        expires: new Date(windowEndMs).toISOString(),
      };

      const qrText = JSON.stringify(qrObj);
      const dataUrl = await generateQRCodeDataURL(qrText, 600);
      const blob = dataURLtoBlob(dataUrl);

      const fileName = `qr_${localStudent.id}_${mealType}_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, blob, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        pushToast("error", "QR upload failed");
        console.error("QR upload error:", uploadError);
        return null;
      }

      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      const { data: inserted, error } = await supabase
        .from("qr_codes")
        .insert([
          {
            student_id: localStudent.id,
            meal_type: mealType,
            qr_data: qrText,
            qr_image_url: publicUrl,
            expires_at: new Date(windowEndMs),
          },
        ])
        .select();

      if (error) {
        console.error("qr_codes insert error:", error);
        return null;
      }

      pushToast("success", `${mealType} QR ready!`);
      return inserted?.[0] ?? null;
    } catch (err) {
      console.error("createAndUploadQR error:", err);
      pushToast("error", "QR creation failed");
      return null;
    }
  };

  const generateQRCodeDataURL = async (text: string, size = 300) => {
    // dynamic import to avoid SSR issues
    const QRCode = await import("qrcode");
    return await QRCode.toDataURL(text, { width: size, margin: 1 });
  };

  const dataURLtoBlob = (dataurl: string) => {
    const [meta, data] = dataurl.split(",");
    const mime = meta.match(/:(.*?);/)?.[1] ?? "image/png";
    const bstr = atob(data);
    const u8 = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
    return new Blob([u8], { type: mime });
  };

  /* ================================================================
     HELPERS
     ================================================================ */
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const formatRemaining = (expiresMs?: number) => {
    if (!expiresMs) return "—";
    const diff = expiresMs - Date.now();
    if (diff <= 0) return "Expired";

    const sec = Math.floor(diff / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getMealIcon = (m: MealType) =>
    ({ breakfast: "🥞", lunch: "🍲", supper: "🍽️" }[m] ?? "🍴");

  /* ================================================================
     LOADING SCREEN
     ================================================================ */
  if (!localStudent || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center">
        <div>
          <div className="h-12 w-12 mx-auto rounded-full border-4 border-border border-t-primary animate-spin"></div>
          <p className="text-muted-foreground mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const nextMealInfo = getNextMealInfo();

  /* ================================================================
     MAIN UI
     ================================================================ */
  return (
    <div className="min-h-screen bg-background">
      {/* TOASTS */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded shadow text-sm ${
              t.type === "success"
                ? "bg-green-600 text-white"
                : t.type === "error"
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-white"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* MENU BUTTON */}
      <button
        onClick={() => setShowSidebar(true)}
        className="fixed top-4 left-4 z-50 bg-primary text-white px-3 py-2 rounded-lg shadow"
      >
        Menu
      </button>

      {/* OVERLAY */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition ${
          showSidebar ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setShowSidebar(false)}
      />

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-card border-r border-border p-6 z-50 transform transition-transform ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Profile</h3>
          <button onClick={() => setShowSidebar(false)}>✖</button>
        </div>

        <div className="flex flex-col items-center space-y-3">
          <div className="w-28 h-28 rounded-full overflow-hidden border">
            <img src={profileImage || "/default-avatar.png"} className="w-full h-full object-cover" />
          </div>

          <label className="w-full text-sm">
            <span className="text-xs text-muted-foreground">Upload photo</span>
            <input type="file" onChange={uploadProfileImage} className="w-full" />
          </label>

          <p className="text-lg font-medium">{localStudent.full_name}</p>
          <p className="text-sm text-muted-foreground">{localStudent.reg_number}</p>

          {/* PASSWORD */}
          <div className="w-full mt-4">
            <label className="text-xs text-muted-foreground">New password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded mb-2"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button onClick={changePassword} disabled={changingPassword} className="w-full bg-primary text-white py-2 rounded">
              {changingPassword ? "Updating..." : "Change password"}
            </button>

            {/* LOGOUT BUTTON */}
            <button
              onClick={() => {
                localStorage.removeItem("user");
                supabase.auth.signOut();
                window.location.href = "/auth/Login";
              }}
              className="w-full bg-red-600 text-white py-2 rounded mt-3"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* BALANCE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="col-span-2 bg-gradient-to-br from-primary to-accent p-8 rounded-xl text-white shadow">
            <p className="text-sm opacity-80">Meal Balance</p>
            <p className="text-5xl font-bold">{mealBalance}</p>
            <p className="opacity-70 mt-2">meals available</p>
          </div>

          <div className="bg-card p-6 rounded-xl border">
            <p className="text-center text-4xl">{activeTab === "qr" ? "📱" : "📊"}</p>
            <p className="text-center mt-2 font-medium">{activeTab === "qr" ? "QR Codes" : "Meal History"}</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 border-b mb-8">
          {["qr", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 text-sm border-b-2 ${
                activeTab === tab ? "border-primary text-primary" : "text-muted-foreground border-transparent"
              }`}
            >
              {tab === "qr" ? "QR Codes" : "Meal History"}
            </button>
          ))}
        </div>

        {/* QR TAB */}
        {activeTab === "qr" && (
          <>
            {activeMealType ? (
              <div className="bg-card border rounded-xl p-6 text-center">
                <p className="text-6xl">{getMealIcon(activeMealType)}</p>
                <h3 className="text-xl font-semibold mt-3 capitalize">{activeMealType}</h3>

                <div className="w-56 h-56 mx-auto rounded bg-muted mt-4 flex items-center justify-center overflow-hidden">
                  {activeQrImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeQrImage} className="w-full h-full object-cover" alt="QR code" />
                  ) : (
                    <p className="text-muted-foreground text-sm">Preparing QR…</p>
                  )}
                </div>

                <p className="text-sm mt-3 text-muted-foreground">
                  Expires in <strong>{formatRemaining(activeQrExpiresAt ?? undefined)}</strong>
                </p>
              </div>
            ) : (
              <div className="bg-card border rounded-xl p-6 text-center">
                <p className="text-lg font-medium">No meal QR available</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Next: <strong>{capitalize(nextMealInfo.meal)}</strong> in {formatRemaining(nextMealInfo.start)}
                </p>
              </div>
            )}
          </>
        )}

        {/* HISTORY */}
        {activeTab === "history" && (
          <div className="bg-card border rounded-xl overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Recent Meals</h2>
            </div>

            {mealHistory.length > 0 ? (
              mealHistory.map((meal) => (
                <div key={meal.id} className="p-4 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getMealIcon(meal.meal_type)}</span>
                    <div>
                      <p className="capitalize font-medium">{meal.meal_type}</p>
                      <p className="text-sm text-muted-foreground">{new Date(meal.served_at).toLocaleString()}</p>
                    </div>
                  </div>

                  <span className="text-sm text-green-600 font-medium">Served</span>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-muted-foreground">No meal history</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
