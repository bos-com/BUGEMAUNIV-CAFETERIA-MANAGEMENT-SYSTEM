"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import jsQR from "jsqr";
import { supabase } from "@/lib/supabase";
import type { QRScannerProps, ScanResult, QRData } from "../../types";

type MealType = "breakfast" | "lunch" | "supper";

export default function QRScanner({ staff }: QRScannerProps) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [manualQR, setManualQR] = useState<string>("");
  const [scanning, setScanning] = useState<boolean>(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* ============================================================
     MOBILE CAMERA SAFE START
  ============================================================ */
  const startCamera = async () => {
    try {
      // Stop previous stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      // Enumerate devices FIRST (mobile requirement)
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter((d) => d.kind === "videoinput");
      setDevices(videoDevices);

      let cameraId = selectedDevice;

      if (!cameraId && videoDevices.length > 0) {
        // Pick back camera first
        const backCam =
          videoDevices.find((d) =>
            d.label.toLowerCase().includes("back")
          )?.deviceId || videoDevices[0].deviceId;

        cameraId = backCam;
        setSelectedDevice(backCam);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: cameraId ? { exact: cameraId } : undefined,
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // iOS autoplay requirements
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("muted", "true");
        videoRef.current.setAttribute("autoplay", "true");

        await new Promise((resolve) => {
          videoRef.current!.onloadedmetadata = () => resolve(true);
        });

        await videoRef.current.play();
      }

      setScanning(true);
      scanLoop();
    } catch (err) {
      console.error("Camera error:", err);

      setScanResult({
        success: false,
        message:
          "Camera access failed. Enable permissions in browser settings and reload.",
        type: "error",
        icon: "📵",
      });
    }
  };

  /* ============================================================
     STOP CAMERA
  ============================================================ */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setScanning(false);
  };

  /* ============================================================
     QR PROCESSING
  ============================================================ */
  const processQRCode = async (qrData: string): Promise<void> => {
    setIsLoading(true);
    setScanResult(null);

    try {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // vibration feedback

      const parsedData: QRData = JSON.parse(qrData);
      const { studentId, regNumber, mealType, expires } = parsedData;

      // VALIDATION: Expired QR
      if (new Date(expires) < new Date()) {
        setScanResult({
          success: false,
          message: "QR code has expired",
          type: "error",
          icon: "⏰",
        });
        return;
      }

      // VALIDATION: Student Exists?
      const { data: student } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .eq("reg_number", regNumber)
        .single();

      if (!student) {
        setScanResult({
          success: false,
          message: "Student not found",
          type: "error",
          icon: "❓",
        });
        return;
      }

      // VALIDATION: QR not used already
      const { data: existingQR } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("student_id", studentId)
        .eq("meal_type", mealType)
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (!existingQR) {
        setScanResult({
          success: false,
          message: "QR already used or invalid",
          type: "error",
          icon: "🚫",
        });
        return;
      }

      // Mark QR as used
      await supabase
        .from("qr_codes")
        .update({ is_used: true })
        .eq("id", existingQR.id);

      // Add meal log
      await supabase.from("meal_logs").insert([
        {
          student_id: studentId,
          staff_id: staff.id,
          meal_type: mealType,
          qr_code_id: existingQR.id,
        },
      ]);

      setScanResult({
        success: true,
        message: "Meal served successfully!",
        type: "success",
        icon: "✅",
        student,
        mealType,
      });

      stopCamera();
    } catch (err) {
      setScanResult({
        success: false,
        message: "Invalid QR format",
        type: "error",
        icon: "❌",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ============================================================
     SCANNER LOOP
  ============================================================ */
  const scanLoop = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const loop = () => {
      if (!scanning) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, canvas.width, canvas.height);

      if (code) {
        stopCamera();
        processQRCode(code.data);
        return;
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  };

  /* Cleanup on unmount */
  useEffect(() => stopCamera, []);

  const getMealIcon = (meal: MealType) =>
    meal === "breakfast" ? "🥞" : meal === "lunch" ? "🍲" : "🍽️";

  return (
    <div className="space-y-6">
      {/* CAMERA SELECTOR */}
      {devices.length > 1 && (
        <div className="bg-card border p-4 rounded-xl">
          <label className="text-sm font-medium block mb-2">
            Select Camera:
          </label>
          <select
            className="w-full px-3 py-2 border rounded-lg"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || "Camera"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* CAMERA VIEW */}
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`${scanning ? "block" : "hidden"} w-full rounded-xl`}
        />

        <canvas ref={canvasRef} className="hidden" />

        {!scanning && (
          <div className="text-muted-foreground py-10">
            <span className="text-6xl">📷</span>
            <p className="mt-4">Camera preview will appear here</p>
          </div>
        )}

        <button
          onClick={() => (scanning ? stopCamera() : startCamera())}
          className={`mt-6 px-6 py-3 rounded-lg font-medium ${
            scanning
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {scanning ? "Stop Scanning" : "Start Camera"}
        </button>
      </div>

      {/* MANUAL INPUT */}
      <div className="border-t border-border pt-8">
        <h3 className="text-lg font-semibold mb-4">⌨️ Manual QR Input</h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualQR.trim()) processQRCode(manualQR);
          }}
          className="space-y-4"
        >
          <textarea
            value={manualQR}
            onChange={(e) => setManualQR(e.target.value)}
            rows={3}
            className="w-full p-3 bg-input border rounded-lg"
            placeholder="Paste QR data..."
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary text-white py-3 rounded-lg"
            >
              {isLoading ? "Processing..." : "Submit"}
            </button>

            <button
              type="button"
              onClick={() => {
                setManualQR("");
                setScanResult(null);
              }}
              className="px-6 py-3 bg-muted rounded-lg"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* RESULT */}
      {scanResult && (
        <div
          className={`rounded-2xl p-6 border-l-4 ${
            scanResult.success
              ? "bg-green-100 border-green-500"
              : "bg-red-100 border-red-500"
          }`}
        >
          <div className="flex gap-4">
            <div className="text-4xl">{scanResult.icon}</div>

            <div className="flex-1">
              <h3 className="font-semibold">{scanResult.message}</h3>

              {scanResult.success && scanResult.student && (
                <div className="mt-3 bg-white p-4 rounded-lg border">
                  <p>
                    <strong>Student:</strong> {scanResult.student.full_name}
                  </p>
                  <p>
                    <strong>Reg No:</strong> {scanResult.student.reg_number}
                  </p>
                  <p>
                    <strong>Meal:</strong>{" "}
                    {getMealIcon(scanResult.mealType!)}{" "}
                    {scanResult.mealType}
                  </p>
                </div>
              )}

              <button
                onClick={() => setScanResult(null)}
                className="mt-4 bg-muted px-4 py-2 rounded-lg"
              >
                Scan Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
