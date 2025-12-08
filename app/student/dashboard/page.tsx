"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

/* -----------------------------
   Local types (kept here to avoid missing imports)
   ----------------------------- */
type MealType = "breakfast" | "lunch" | "supper";

type MealLog = {
  id: string | number;
  student_id: string;
  meal_type: MealType;
  served_at: string;
};

type QRCodeDataOptionA = {
  student_id: string;
  reg_number: string;
  meal_type: MealType;
  expires_at: string;
};

/* ================================================================
   MEAL WINDOWS (Option A)
   breakfast: 06:00–07:00
   lunch:     13:00–14:30
   supper:    18:00–19:30
   ================================================================ */
const MEAL_WINDOWS: Record<MealType, { start: string; end: string }> = {
  breakfast: { start: "06:00", end: "07:00" },
  lunch: { start: "13:00", end: "14:30" },
  supper: { start: "18:00", end: "19:30" },
};

type QRRow = {
  id: string;
  student_id: string;
  meal_type: MealType;
  qr_data: string;
  qr_image_url?: string;
  expires_at?: string;
  created_at?: string;
};

type Toast = { id: string; type: "success" | "error" | "info"; message: string };

/* ===================================================================
   Component
   =================================================================== */
export default function StudentDashboardPage() {
  const [localStudent, setLocalStudent] = useState<any | null>(null);

  const [mealHistory, setMealHistory] = useState<MealLog[]>([]);
  const [mealBalance, setMealBalance] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"qr" | "history">("qr");
  const [loading, setLoading] = useState(true);

  const [activeQrImage, setActiveQrImage] = useState<string | null>(null);
  const [activeQrData, setActiveQrData] = useState<string | null>(null);
  const [activeQrExpiresAt, setActiveQrExpiresAt] = useState<number | null>(
    null
  );
  const [activeMealType, setActiveMealType] = useState<MealType | null>(null);

  const [showSidebar, setShowSidebar] = useState(false);
  const [profileImage, setProfileImage] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const intervalRef = useRef<number | null>(null);

  /* ------------------ toasts ------------------ */
  const pushToast = (type: Toast["type"], message: string) => {
    const id = `t${++toastId.current}`;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  };

  /* ------------------ load student from localStorage ------------------ */
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
      if (!stored.id || !stored.reg_number) {
        console.error("Stored user missing id/reg_number:", stored);
        window.location.href = "/login";
        return;
      }
      setLocalStudent(stored);
    } catch (err) {
      console.error("Failed to load student", err);
      window.location.href = "/login";
    }
  }, []);

  /* ------------------ init after student available ------------------ */
  useEffect(() => {
    if (!localStudent) return;
    setLoading(true);
    fetchStudentData();
    fetchProfileImage();
    checkAndEnsureActiveQR();

    // check every 20s to react to meal window transitions
    intervalRef.current = window.setInterval(() => {
      checkAndEnsureActiveQR();
    }, 20_000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStudent]);

  /* ------------------ fetch student related data ------------------ */
  const fetchStudentData = async () => {
    if (!localStudent) return;
    try {
      setLoading(true);

      const { data: payments, error: payErr } = await supabase
        .from("payments")
        .select("meals_added")
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
      }

      setMealHistory((meals as MealLog[]) || []);

      let balance = 0;
      (payments || []).forEach((p: any) => (balance += p.meals_added || 0));
      (meals || []).forEach(() => (balance -= 1));
      setMealBalance(balance);
    } catch (err) {
      console.error(err);
      pushToast("error", "Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ profile image ------------------ */
  const fetchProfileImage = async () => {
    if (!localStudent) return;
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

  const uploadProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!localStudent) return;
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

  /* ------------------ change password (student table) ------------------ */
  const changePassword = async () => {
    if (!localStudent) return;
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

  /* ------------------ time helpers ------------------ */
  const parseTimeString = (str: string) => {
    const s = String(str).trim().toLowerCase();
    const m = s.match(/^(\d{1,2}):(\d{2})(am|pm)?$/);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ampm = m[3];
    if (ampm) {
      if (ampm === "pm" && hh < 12) hh += 12;
      if (ampm === "am" && hh === 12) hh = 0;
    }
    return { hh, mm };
  };

  const todayTime = (str: string) => {
    const parsed = parseTimeString(str);
    const d = new Date();
    if (!parsed) {
      const [h, m] = str.split(":").map(Number);
      d.setHours(isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
      return d;
    }
    d.setHours(parsed.hh, parsed.mm, 0, 0);
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
    const p = parseTimeString(MEAL_WINDOWS.breakfast.start) ?? { hh: 6, mm: 0 };
    d.setHours(p.hh, p.mm, 0, 0);
    return { meal: "breakfast" as MealType, start: d.getTime() };
  };

  /* ------------------ QR logic ------------------ */
  const checkAndEnsureActiveQR = async () => {
    if (!localStudent) return;
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

      // create new QR for this window
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
  if (!localStudent) return null;
  try {
    // FIXED QR FORMAT (matches scanner)
    const qrObj = {
      studentId: localStudent.id,
      regNumber: localStudent.reg_number,
      mealType: mealType,
      expires: new Date(windowEndMs).toISOString(),
    };

    const qrText = JSON.stringify(qrObj);

    // Generate QR PNG
    const QRCode = await import("qrcode");
    const dataUrl: string = await QRCode.toDataURL(qrText, { width: 600, margin: 1 });

    const blob = dataURLtoBlob(dataUrl);
    const fileName = `qr_${localStudent.id}_${mealType}_${new Date()
      .toISOString()
      .slice(0, 10)}.png`;

    // Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, blob, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error(uploadError);
      pushToast("error", "Failed to upload QR");
      return null;
    }

    const { data: urlData } = supabase.storage.from("images").getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    // Save QR row
    const { data: inserted, error: insertErr } = await supabase
      .from("qr_codes")
      .insert(
        [
          {
            student_id: localStudent.id,
            meal_type: mealType,
            qr_data: qrText,
            qr_image_url: publicUrl,
            expires_at: new Date(windowEndMs).toISOString(),
          },
        ]
      )
      .select();

    if (insertErr) {
      console.error(insertErr);
      pushToast("error", "Failed to save QR record");
      return null;
    }

    pushToast("success", `${mealType} QR generated`);
    return inserted[0];
  } catch (err) {
    console.error("createAndUploadQR error:", err);
    pushToast("error", "QR generation failed");
    return null;
  }
};


  /* ------------------ helper: generate dataURL -> Blob ------------------ */
  const dataURLtoBlob = (dataurl: string) => {
    const [meta, base64] = dataurl.split(",");
    const mime = meta.match(/:(.*?);/)?.[1] ?? "image/png";
    const binary = atob(base64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  /* ------------------ small helpers ------------------ */
  const capitalizeMeal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const formatRemaining = (tsMs?: number) => {
    if (!tsMs) return "—";
    const diff = tsMs - Date.now();
    if (diff <= 0) return "Expired";
    const sec = Math.floor(diff / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getMealIcon = (m: MealType) =>
    ({ breakfast: "🥞", lunch: "🍲", supper: "🍽️" } as Record<MealType, string>)[m];

  /* ------------------ render loading ------------------ */
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

  /* ------------------ UI ------------------ */
  return (
    <div className="min-h-screen bg-background">
      {/* Toasts */}
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

      {/* Sidebar toggle */}
      <button
        onClick={() => setShowSidebar(true)}
        className="fixed top-4 left-4 z-50 bg-primary text-white px-3 py-2 rounded-lg shadow"
      >
        Menu
      </button>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${showSidebar ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setShowSidebar(false)}
        aria-hidden
      />

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-card border-r border-border p-6 z-50 transform transition-transform ${showSidebar ? "translate-x-0" : "-translate-x-full"}`} role="dialog" aria-modal={showSidebar}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Profile</h3>
          <button onClick={() => setShowSidebar(false)} className="text-muted-foreground">✖</button>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="w-28 h-28 rounded-full overflow-hidden border">
            <img src={profileImage || localStudent.image_url || "/default-avatar.png"} alt="profile" className="w-full h-full object-cover" />
          </div>

          <label className="text-sm w-full">
            <span className="block text-xs text-muted-foreground mb-1">Upload profile photo</span>
            <input type="file" accept="image/*" onChange={uploadProfileImage} className="w-full" />
          </label>

          <p className="text-lg font-medium mt-2 text-center">{localStudent.full_name}</p>
          <p className="text-sm text-muted-foreground">{localStudent.reg_number}</p>

          <div className="w-full mt-4">
            <label className="text-xs text-muted-foreground">New password</label>
            <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2" />
            <button onClick={changePassword} disabled={changingPassword} className="w-full bg-primary text-primary-foreground py-2 rounded-lg">
              {changingPassword ? "Updating..." : "Change password"}
            </button>

            <button onClick={() => { localStorage.removeItem("user"); try { supabase.auth.signOut(); } catch (e) {} window.location.href = "/welcome"; }} className="w-full bg-red-600 text-white py-2 rounded mt-3">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Balance card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 bg-gradient-to-br from-primary to-accent rounded-2xl p-8 text-primary-foreground shadow-lg">
            <p className="text-sm opacity-90 mb-2">Meal Balance</p>
            <p className="text-5xl font-bold">{mealBalance}</p>
            <p className="text-sm opacity-75 mt-2">meals available</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-center text-center">
            <p className="text-3xl mb-2">{activeTab === "qr" ? "📱" : "📊"}</p>
            <p className="font-medium text-foreground">{activeTab === "qr" ? "QR Codes" : "History"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          {["qr", "history"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as "qr" | "history")} className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {tab === "qr" ? "QR Codes" : "Meal History"}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "qr" && (
          <>
            {activeMealType ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-all md:col-span-1 text-center">
                  <div>
                    <p className="text-4xl mb-3">{getMealIcon(activeMealType)}</p>
                    <h3 className="font-semibold text-foreground capitalize mb-2">{activeMealType}</h3>

                    <div className="w-48 h-48 mx-auto mb-3 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {activeQrImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={activeQrImage} alt={`${activeMealType} qr`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
                          <p className="text-xs text-muted-foreground">Preparing QR…</p>
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground mb-2">
                      Expires in: <span className="font-medium">{formatRemaining(activeQrExpiresAt ?? undefined)}</span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      This QR is only visible during the {activeMealType} window ({MEAL_WINDOWS[activeMealType].start}–{MEAL_WINDOWS[activeMealType].end}).
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <p className="text-lg font-medium">No meal QR available</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Next: <strong>{capitalizeMeal(nextMealInfo.meal)}</strong> starts in <strong>{formatRemaining(nextMealInfo.start)}</strong>
                </p>
                <p className="text-xs text-muted-foreground">QR codes appear automatically at the start of each meal window.</p>
              </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Recent Meals</h2>
            </div>

            <div className="divide-y divide-border">
              {mealHistory.length > 0 ? (
                mealHistory.map((meal) => (
                  <div key={meal.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getMealIcon(meal.meal_type as MealType)}</div>
                      <div>
                        <p className="font-medium text-foreground capitalize">{meal.meal_type}</p>
                        <p className="text-sm text-muted-foreground">{new Date(meal.served_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="text-sm text-success font-medium">Served</span>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <p className="text-4xl mb-2">🍽️</p>
                  <p className="text-muted-foreground">No meal history yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
