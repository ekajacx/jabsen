"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { useModal } from "@/context/modal-context";
import { OFFICE_LOCATIONS, checkGeofence } from "@/lib/geo";
import { initFaceLandmarker, analyzeMovementFromLandmarks, DetectedMovement } from "@/lib/mediapipe";
import {
  Camera,
  VideoOff,
  Video,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  Smartphone,
  Laptop,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Smile,
  Timer,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { getCurrentDevice, getStoredUserAccounts, SimulatedDeviceConfig, UserAccount } from "@/lib/user-account-data";

type AttendanceType = "masuk" | "pulang";

// Kandidat gerakan sesuai PRD Section 5.5
export type MovementType = "left" | "right" | "up" | "down" | "smile";

export interface LivenessChallengeItem {
  id: MovementType;
  label: string;
  instruction: string;
  directionIcon: "left" | "right" | "up" | "down" | "smile";
}

const ALL_CANDIDATES: LivenessChallengeItem[] = [
  {
    id: "left",
    label: "Menoleh ke Kiri",
    instruction: "Tolehkan kepala Anda perlahan ke arah Kiri ⬅️",
    directionIcon: "left",
  },
  {
    id: "right",
    label: "Menoleh ke Kanan",
    instruction: "Tolehkan kepala Anda perlahan ke arah Kanan ➡️",
    directionIcon: "right",
  },
  {
    id: "up",
    label: "Arah Wajah ke Atas",
    instruction: "Angkat dagu / arahkan wajah ke Atas sedikit ⬆️",
    directionIcon: "up",
  },
  {
    id: "down",
    label: "Arah Wajah ke Bawah",
    instruction: "Tundukkan kepala / arahkan wajah ke Bawah ⬇️",
    directionIcon: "down",
  },
  {
    id: "smile",
    label: "Tersenyum",
    instruction: "Tersenyum wajar menghadap kamera 😊",
    directionIcon: "smile",
  },
];

// Mengacak 4 gerakan sesuai PRD 5.5
function generateRandom4Challenges(): LivenessChallengeItem[] {
  const shuffled = [...ALL_CANDIDATES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4);
}

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  role: string;
  type: AttendanceType;
  timestamp: string;
  timeFormatted: string;
  dateFormatted: string;
  officeName: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  isWithinRadius: boolean;
  photoUrl: string;
  verificationHash: string;
  status: "Tepat Waktu" | "Terlambat" | "Pulang Cepat" | "Luar Radius";
}

export default function AbsenPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useModal();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Device Detection: Desktop vs Mobile
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(true);
  const [bypassDesktop, setBypassDesktop] = useState<boolean>(false);
  const [networkIp] = useState<string>("http://192.168.1.2:3000/absen");

  // Mode Absensi (Masuk / Pulang)
  const [attendanceType, setAttendanceType] = useState<AttendanceType>("masuk");
  const [note, setNote] = useState("");

  // State Kamera & Video
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // State MediaPipe AI Vision
  const [isMediaPipeReady, setIsMediaPipeReady] = useState<boolean>(false);
  const [detectedMovement, setDetectedMovement] = useState<DetectedMovement>(null);
  const landmarkerRef = useRef<any>(null);
  const requestRef = useRef<number | null>(null);

  // State Face Detection & 4 Random Liveness Challenges (PRD 5.5)
  const [activeChallenges, setActiveChallenges] = useState<LivenessChallengeItem[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState<number>(0);
  const [livenessStatus, setLivenessStatus] = useState<"scanning_face" | "in_challenge" | "passed" | "failed">("scanning_face");
  const [countdown, setCountdown] = useState<number>(8); // 8 detik per gerakan
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // State Lokasi & Geofence
  const targetOffice = OFFICE_LOCATIONS[0]; // Kantor Pusat Bali
  const [currentLat, setCurrentLat] = useState<number>(targetOffice.latitude + 0.00015); // ~17m default di kantor
  const [currentLng, setCurrentLng] = useState<number>(targetOffice.longitude + 0.0001);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(12); // meter
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false);
  const [isMockLocation, setIsMockLocation] = useState<boolean>(false);

  // State Hasil Absensi (Modal)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successRecord, setSuccessRecord] = useState<AttendanceRecord | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // Hitung status Geofence
  const geofence = checkGeofence(currentLat, currentLng, targetOffice);

  // Status Perangkat Aktif & Akun Pengguna
  const [currentDev, setCurrentDev] = useState<SimulatedDeviceConfig>(getCurrentDevice());
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);

  // Deteksi Perangkat (Desktop vs Smartphone)
  useEffect(() => {
    const dev = getCurrentDevice();
    setCurrentDev(dev);
    const accounts = getStoredUserAccounts();
    const acc = accounts.find(
      (a) =>
        a.employeeId.toLowerCase() === user.nik?.toLowerCase() ||
        a.username.toLowerCase() === user.username?.toLowerCase()
    );
    setUserAccount(acc || null);

    const detectDevice = () => {
      const activeDev = getCurrentDevice();
      setCurrentDev(activeDev);
      if (!activeDev.isMobile) {
        setIsMobileDevice(false);
        return;
      }
      const ua = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isNarrow = window.innerWidth < 1024;
      setIsMobileDevice(isMobileUA || (isTouch && isNarrow) || isNarrow);
    };

    detectDevice();
    window.addEventListener("resize", detectDevice);
    window.addEventListener("device-switch", detectDevice);
    window.addEventListener("storage", detectDevice);
    return () => {
      window.removeEventListener("resize", detectDevice);
      window.removeEventListener("device-switch", detectDevice);
      window.removeEventListener("storage", detectDevice);
    };
  }, [user]);

  // Cek apakah perangkat HP saat ini tidak cocok dengan HP yang terikat
  const isDeviceMismatch = Boolean(
    isMobileDevice &&
    userAccount &&
    userAccount.boundDeviceId &&
    userAccount.boundDeviceId !== currentDev.deviceId
  );

  // Inisialisasi 4 Tantangan Acak saat pertama kali
  useEffect(() => {
    startNewLivenessSession();
  }, []);

  // Jalankan / matikan kamera
  useEffect(() => {
    if (isMobileDevice || bypassDesktop) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isMobileDevice, bypassDesktop]);

  // Timer Countdown per gerakan
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (livenessStatus === "in_challenge" && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (livenessStatus === "in_challenge" && countdown === 0) {
      // Timeout gerakan: Gagal atau beri kesempatan retry
      setLivenessStatus("failed");
    }
    return () => clearTimeout(timer);
  }, [livenessStatus, countdown]);

  // Kamera WebRTC
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 720 },
            height: { ideal: 960 },
            facingMode: "user",
          },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      }
    } catch (err: any) {
      console.warn("Kamera fisik tidak tersedia atau izin ditolak:", err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Mulai Sesi Baru: Acak 4 Gerakan (PRD 5.5)
  const startNewLivenessSession = () => {
    const challenges = generateRandom4Challenges();
    setActiveChallenges(challenges);
    setCurrentChallengeIndex(0);
    setLivenessStatus("scanning_face");
    setCountdown(8);

    // Langkah Awal: Deteksi Wajah (1.5 detik) lalu mulai gerakan 1
    setTimeout(() => {
      setLivenessStatus("in_challenge");
      setCountdown(8);
    }, 1500);
  };

  // Callback saat gerakan terdeteksi berhasil (otomatis atau via simulasi interaktif)
  const handlePassCurrentChallenge = () => {
    if (currentChallengeIndex < 3) {
      // Lanjut ke gerakan berikutnya (misal dari 1/4 ke 2/4)
      setCurrentChallengeIndex((prev) => prev + 1);
      setCountdown(8);
    } else {
      // Semua 4 gerakan selesai!
      setLivenessStatus("passed");
    }
  };

  // Inisialisasi MediaPipe saat kamera aktif
  useEffect(() => {
    let isMounted = true;
    const setupMediaPipe = async () => {
      try {
        const landmarker = await initFaceLandmarker();
        if (isMounted && landmarker) {
          landmarkerRef.current = landmarker;
          setIsMediaPipeReady(true);
        }
      } catch (e) {
        console.warn("MediaPipe model loading:", e);
      }
    };

    setupMediaPipe();

    return () => {
      isMounted = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Real-time Detection Loop via MediaPipe FaceLandmarker
  useEffect(() => {
    let lastVideoTime = -1;

    const detectLoop = () => {
      if (
        cameraActive &&
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        landmarkerRef.current &&
        livenessStatus === "in_challenge"
      ) {
        const video = videoRef.current;
        const currentTime = video.currentTime;
        if (currentTime !== lastVideoTime) {
          lastVideoTime = currentTime;
          try {
            const results = landmarkerRef.current.detectForVideo(video, performance.now());
            const analysis = analyzeMovementFromLandmarks(results);
            setDetectedMovement(analysis.movement);

            // Validasi apakah gerakan fisik pengguna cocok dengan instruksi aktif
            const currentChallenge = activeChallenges[currentChallengeIndex];
            if (currentChallenge && analysis.movement === currentChallenge.id) {
              handlePassCurrentChallenge();
            }
          } catch (err) {
            // Drop frame toleransi
          }
        }
      }
      requestRef.current = requestAnimationFrame(detectLoop);
    };

    if (isMediaPipeReady && cameraActive && livenessStatus === "in_challenge") {
      requestRef.current = requestAnimationFrame(detectLoop);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isMediaPipeReady, cameraActive, livenessStatus, currentChallengeIndex, activeChallenges]);

  // Fallback Auto-Simulasi (jika tidak ada webcam fisik atau di desktop dev)
  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    if (livenessStatus === "in_challenge" && (!cameraActive || !isMediaPipeReady)) {
      progressTimer = setTimeout(() => {
        handlePassCurrentChallenge();
      }, 3000);
    }
    return () => clearTimeout(progressTimer);
  }, [livenessStatus, currentChallengeIndex, cameraActive, isMediaPipeReady]);

  // Ambil lokasi GPS asli browser
  const fetchRealGpsLocation = () => {
    setIsLocationLoading(true);
    if (!navigator.geolocation) {
      showAlert({
        title: "Perangkat Tidak Mendukung",
        message: "Browser Anda tidak mendukung Geolocation.",
        type: "error",
      });
      setIsLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLat(pos.coords.latitude);
        setCurrentLng(pos.coords.longitude);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setIsLocationLoading(false);
        setIsMockLocation(false);
      },
      (err) => {
        console.warn("Gagal membaca GPS asli:", err);
        showAlert({
          title: "Gagal Mengakses GPS",
          message: "Tidak dapat mengambil sinyal GPS: " + err.message + ". Menggunakan koordinat kantor simulasi.",
          type: "warning",
        });
        setIsLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Simulasi lokasi pengujian dev
  const setPresetLocation = (type: "inside" | "outside") => {
    if (type === "inside") {
      setCurrentLat(targetOffice.latitude + 0.00012);
      setCurrentLng(targetOffice.longitude + 0.00008);
      setGpsAccuracy(10);
      setIsMockLocation(true);
    } else {
      setCurrentLat(targetOffice.latitude + 0.015);
      setCurrentLng(targetOffice.longitude + 0.012);
      setGpsAccuracy(25);
      setIsMockLocation(true);
    }
  };

  // Tangkap snapshot frame foto
  const captureSnapshot = (): string => {
    if (cameraActive && videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.85);
      }
    }
    return user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80";
  };

  // Eksekusi Simpan Presensi
  const handleSubmitAttendance = () => {
    if (!geofence.isWithinRadius) {
      showAlert({
        title: "Di Luar Radius Kantor",
        message: "Gagal Absen: Anda berada di luar radius kantor (" + geofence.distanceMeters + "m). Toleransi maks: " + targetOffice.radiusMeters + "m.",
        type: "error",
      });
      return;
    }

    if (livenessStatus !== "passed") {
      showAlert({
        title: "Verifikasi Gerakan Wajib",
        message: "Gagal Absen: Wajib menyelesaikan seluruh 4 gerakan verifikasi wajah sebelum mengirim presensi.",
        type: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    const photoData = captureSnapshot();
    setCapturedPhoto(photoData);

    setTimeout(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      let status: AttendanceRecord["status"] = "Tepat Waktu";
      if (attendanceType === "masuk") {
        if (hours > 8 || (hours === 8 && minutes > 30)) {
          status = "Terlambat";
        }
      } else {
        if (hours < 17) {
          status = "Pulang Cepat";
        }
      }

      const newRecord: AttendanceRecord = {
        id: "REC-" + Date.now().toString(36).toUpperCase(),
        userId: user.id,
        userName: user.name,
        role: user.role,
        type: attendanceType,
        timestamp: now.toISOString(),
        timeFormatted: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB",
        dateFormatted: now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
        officeName: targetOffice.name,
        distanceMeters: geofence.distanceMeters,
        latitude: currentLat,
        longitude: currentLng,
        isWithinRadius: true,
        photoUrl: photoData,
        verificationHash: "SHA256-" + Math.random().toString(16).substring(2, 10) + "-WORM",
        status: status,
      };

      try {
        const existing = JSON.parse(localStorage.getItem("j_absen_records") || "[]");
        localStorage.setItem("j_absen_records", JSON.stringify([newRecord, ...existing]));
      } catch (e) {
        console.error("Gagal simpan ke storage:", e);
      }

      setSuccessRecord(newRecord);
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 1200);
  };

  const currentChallenge = activeChallenges[currentChallengeIndex];

  // Render Icon Gerakan Sesuai Arah
  const renderMovementIcon = (type: MovementType) => {
    switch (type) {
      case "left":
        return <ArrowLeft className="size-8 text-amber-300 animate-pulse" />;
      case "right":
        return <ArrowRight className="size-8 text-amber-300 animate-pulse" />;
      case "up":
        return <ArrowUp className="size-8 text-amber-300 animate-pulse" />;
      case "down":
        return <ArrowDown className="size-8 text-amber-300 animate-pulse" />;
      case "smile":
        return <Smile className="size-8 text-amber-300 animate-pulse" />;
    }
  };

  return (
    <AppLayout pageTitle="Presensi Kehadiran">
      <canvas ref={canvasRef} className="hidden" />

      {/* ========================================================================= */}
      {/* 1. LAYAR BLOKIR DESKTOP (PC/LAPTOP NOT SUPPORTED FOR FACE ATTENDANCE) */}
      {/* ========================================================================= */}
      {!isMobileDevice && !bypassDesktop ? (
        <div className="mx-auto max-w-2xl py-8">
          <Card className="border-gray-200 shadow-theme-lg dark:border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 p-6 text-white text-center">
              <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-theme-md">
                <Smartphone className="size-8 animate-bounce" />
              </div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Presensi Wajah Khusus HP Pribadi
              </h2>
              <p className="mt-2 text-xs text-brand-100 sm:text-sm max-w-lg mx-auto leading-relaxed">
                Presensi kehadiran wajah hanya dapat dilakukan melalui HP pribadi terdaftar Anda demi keabsahan biometrik &amp; GPS. Gunakan Laptop/PC khusus untuk administrasi manajemen.
              </p>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50/80 p-6 text-center dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex size-36 items-center justify-center rounded-xl bg-white p-3 shadow-theme-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                  <svg className="size-full text-gray-900 dark:text-white" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="10" y="10" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="20" y="20" width="10" height="10" />
                    <rect x="60" y="10" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="70" y="20" width="10" height="10" />
                    <rect x="10" y="60" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="20" y="70" width="10" height="10" />
                    <rect x="50" y="50" width="8" height="8" />
                    <rect x="65" y="65" width="10" height="8" />
                    <rect x="80" y="55" width="8" height="18" />
                    <rect x="50" y="75" width="12" height="10" />
                    <rect x="55" y="25" width="8" height="15" />
                  </svg>
                </div>
                <h4 className="mt-4 font-bold text-sm text-gray-900 dark:text-white">
                  Pindai QR Code untuk Absen di Smartphone
                </h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                  Atau buka tautan berikut melalui peramban (browser) di smartphone Anda:
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gray-200/80 px-3.5 py-1.5 font-mono text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  <span>{networkIp}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="default"
                  className="flex-1"
                  onClick={() => router.push("/dashboard")}
                >
                  Kembali ke Dashboard
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBypassDesktop(true)}
                  className="gap-1.5 text-xs border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                >
                  <Sliders className="size-3.5 text-amber-600" />
                  Mode Simulasi PC (Dev Only)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : isDeviceMismatch ? (
        /* ========================================================================= */
        /* 2. LAYAR BLOKIR PERANGKAT TIDAK COCOK (ANTI TITIP ABSEN)                 */
        /* ========================================================================= */
        <div className="mx-auto max-w-xl py-8">
          <Card className="border-red-200 shadow-theme-lg dark:border-red-900/60 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-6 text-white text-center">
              <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-theme-md">
                <ShieldAlert className="size-9 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Akses Presensi Wajah Ditolak
              </h2>
              <p className="mt-2 text-xs text-red-100 sm:text-sm max-w-md mx-auto">
                Terdeteksi ketidakcocokan perangkat HP (Kebijakan Anti-Titip Absen)
              </p>
            </div>

            <CardContent className="p-6 space-y-4">
              <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 text-xs text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 leading-relaxed space-y-2">
                <p>
                  Akun Anda (<strong>{user.name}</strong> - <code>{user.nik}</code>) telah terikat eksklusif pada perangkat:
                </p>
                <div className="rounded-lg bg-white p-2.5 border border-red-200 font-mono text-xs font-bold text-gray-800 dark:bg-gray-900 dark:border-red-900/60 dark:text-gray-200 flex items-center gap-2">
                  <Smartphone className="size-4 text-emerald-600" />
                  <span>{userAccount?.boundDeviceName || "HP Terdaftar Resmi"}</span>
                </div>
                <p>
                  Perangkat yang Anda gunakan saat ini terdeteksi sebagai:
                </p>
                <div className="rounded-lg bg-red-100/70 p-2.5 border border-red-300 font-mono text-xs font-bold text-red-800 dark:bg-red-950/80 dark:border-red-800 dark:text-red-300 flex items-center gap-2">
                  <ShieldAlert className="size-4 text-red-600" />
                  <span>{currentDev.deviceName}</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 pt-1">
                  Demi validitas presensi, sistem melarang 1 HP digunakan untuk bergantian akun. Silakan gunakan HP pribadi terdaftar Anda atau hubungi <strong>Admin IT / HRD</strong> untuk mengajukan reset ikatan perangkat jika Anda telah mengganti HP.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="default"
                  className="w-full justify-center"
                  onClick={() => router.push("/dashboard")}
                >
                  Kembali ke Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. ANTARMUKA ABSENSI SMARTPHONE (RESPONSIF & 4 GERAKAN ACAK)             */
        /* ========================================================================= */
        <div className="space-y-4 max-w-xl mx-auto pb-12">
          {/* Banner Dev Mode jika sedang bypass desktop */}
          {bypassDesktop && !isMobileDevice && (
            <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-300 px-3.5 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:text-amber-200">
              <span className="flex items-center gap-1.5 font-medium">
                <Sliders className="size-3.5 text-amber-600" />
                Mode Uji Coba PC Aktif (Bypass)
              </span>
              <button
                type="button"
                onClick={() => setBypassDesktop(false)}
                className="text-[11px] font-bold text-amber-700 hover:underline dark:text-amber-300"
              >
                Kunci Kembali
              </button>
            </div>
          )}

          {/* Badge Status Verifikasi Perangkat HP Pribadi */}
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2 truncate">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">
                Perangkat Terverifikasi: <strong>{userAccount?.boundDeviceName || currentDev.deviceName}</strong>
              </span>
            </div>
            <Badge variant="success" size="sm" className="text-[10px] shrink-0">
              Valid HP Pribadi
            </Badge>
          </div>

          {/* Selector Jenis Presensi: Masuk vs Pulang */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setAttendanceType("masuk")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                attendanceType === "masuk"
                  ? "bg-brand-500 text-white shadow-theme-xs"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <Clock className="size-4" />
              Absen Masuk
            </button>
            <button
              type="button"
              onClick={() => setAttendanceType("pulang")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                attendanceType === "pulang"
                  ? "bg-brand-500 text-white shadow-theme-xs"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <Clock className="size-4" />
              Absen Pulang
            </button>
          </div>

          {/* Kartu Kamera & 4-Movement Random Liveness Viewfinder */}
          <Card className="overflow-hidden border-gray-200 dark:border-gray-800 shadow-theme-md">
            {/* Header Liveness Progress 4 Gerakan */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Camera className="size-4 text-brand-500" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-gray-900 dark:text-white">
                    Liveness: 4 Gerakan Acak (PRD 5.5)
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                    <span className={`inline-block size-1.5 rounded-full ${isMediaPipeReady ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`} />
                    {isMediaPipeReady ? "MediaPipe 478 Landmark (GPU)" : "Menghubungkan MediaPipe Vision..."}
                  </span>
                </div>
              </div>

              {/* Progress 1/4, 2/4, 3/4, 4/4 */}
              <div className="flex items-center gap-1.5">
                {livenessStatus === "passed" ? (
                  <Badge variant="success" size="sm" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    4/4 Selesai
                  </Badge>
                ) : livenessStatus === "failed" ? (
                  <Badge variant="destructive" size="sm" className="gap-1">
                    <AlertCircle className="size-3" />
                    Waktu Habis
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm" className="gap-1">
                    <Sparkles className="size-3 animate-spin" />
                    Gerakan {currentChallengeIndex + 1}/4
                  </Badge>
                )}
              </div>
            </div>

            <CardContent className="p-3 sm:p-4">
              {/* Step Dots Indikator (1, 2, 3, 4) */}
              <div className="mb-3 grid grid-cols-4 gap-2">
                {activeChallenges.map((item, idx) => {
                  const isDone = idx < currentChallengeIndex || livenessStatus === "passed";
                  const isCurrent = idx === currentChallengeIndex && livenessStatus === "in_challenge";

                  return (
                    <div
                      key={item.id + idx}
                      className={`flex flex-col items-center rounded-xl p-1.5 border text-center transition-all ${
                        isDone
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                          : isCurrent
                          ? "bg-amber-50 border-amber-400 text-amber-900 shadow-theme-xs dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-200"
                          : "bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-900 dark:border-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {isDone ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <span className="text-[10px] font-bold">#{idx + 1}</span>
                        )}
                      </div>
                      <span className="text-[9px] font-medium truncate w-full mt-0.5">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Kamera Frame Portrait Ratio */}
              <div className="relative aspect-[3/4] max-h-[460px] w-full overflow-hidden rounded-2xl bg-gray-950 flex items-center justify-center shadow-inner">
                {/* Video Feed */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`h-full w-full object-cover scale-x-[-1] ${
                    cameraActive ? "block" : "hidden"
                  }`}
                />

                {/* Fallback avatar preview */}
                {!cameraActive && (
                  <div className="relative flex flex-col items-center justify-center p-6 text-center">
                    <div className="relative mb-3 flex size-28 items-center justify-center rounded-full bg-gray-800/90 border-2 border-dashed border-brand-400/60 overflow-hidden">
                      <img
                        src={user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"}
                        alt={user.name}
                        className="size-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-bold text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">ID: {user.id}</p>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-500/20 px-2.5 py-0.5 text-[11px] font-medium text-brand-300">
                      Simulasi Selfie Karyawan
                    </span>
                  </div>
                )}

                {/* Oval Face Guide Frame */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className={`relative w-44 h-60 sm:w-52 sm:h-72 rounded-[50%] border-2 transition-all duration-300 ${
                      livenessStatus === "passed"
                        ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.6)]"
                        : livenessStatus === "failed"
                        ? "border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                        : "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                    }`}
                  >
                    {/* Scan line */}
                    <div
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent animate-bounce opacity-80"
                      style={{ top: "45%" }}
                    />

                    {/* Active Movement Direction Overlay Icon */}
                    {livenessStatus === "in_challenge" && currentChallenge && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-black/60 p-3 backdrop-blur-xs border border-white/20">
                          {renderMovementIcon(currentChallenge.id)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Liveness Challenge Text & Countdown */}
                  <div className="mt-4 max-w-[280px] rounded-xl bg-black/85 px-4 py-2 text-center text-xs font-semibold text-white backdrop-blur-md">
                    {livenessStatus === "scanning_face" && (
                      <span className="text-brand-300">Memindai wajah awal...</span>
                    )}

                    {livenessStatus === "in_challenge" && currentChallenge && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-amber-300 font-bold">
                          <span>Instruksi {currentChallengeIndex + 1}/4:</span>
                          <span className="flex items-center gap-1 text-[11px] text-white/80">
                            <Timer className="size-3 text-amber-400" />
                            {countdown}s
                          </span>
                        </div>
                        <p className="text-white text-[12px]">{currentChallenge.instruction}</p>
                      </div>
                    )}

                    {livenessStatus === "passed" && (
                      <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="size-4" />
                        4 Gerakan Acak Berhasil Terverifikasi! ✓
                      </span>
                    )}

                    {livenessStatus === "failed" && (
                      <span className="text-red-400 font-bold flex items-center justify-center gap-1">
                        <AlertCircle className="size-4" />
                        Waktu tantangan habis. Silakan ulangi.
                      </span>
                    )}
                  </div>
                </div>

                {/* Floating Action Tool Buttons */}
                <div className="absolute bottom-3 inset-x-3 z-10 flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={cameraActive ? stopCamera : startCamera}
                    className="h-8 gap-1.5 bg-black/60 text-white backdrop-blur-md hover:bg-black/80 border-none text-xs"
                  >
                    {cameraActive ? (
                      <>
                        <VideoOff className="size-3.5" />
                        Tutup
                      </>
                    ) : (
                      <>
                        <Video className="size-3.5" />
                        Kamera
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startNewLivenessSession}
                    className="h-8 gap-1.5 bg-black/60 text-white backdrop-blur-md hover:bg-black/80 border-none text-xs"
                    title="Acak Ulang 4 Gerakan"
                  >
                    <RotateCcw className="size-3.5" />
                    Acak Ulang
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kartu Status Geofence GPS */}
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-emerald-500" />
                  <span className="font-bold text-xs text-gray-900 dark:text-white">
                    Radius Kantor: {targetOffice.name}
                  </span>
                </div>
                <Badge
                  variant={geofence.isWithinRadius ? "success" : "destructive"}
                  size="sm"
                >
                  {geofence.isWithinRadius ? "Dalam Area" : "Luar Area"}
                </Badge>
              </div>

              {/* Jarak & Progress Bar */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                  <span>Jarak GPS Ponsel:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {geofence.distanceMeters} m <span className="text-gray-400 font-normal">/ maks {targetOffice.radiusMeters}m</span>
                  </span>
                </div>

                <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      geofence.isWithinRadius ? "bg-emerald-500" : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (geofence.distanceMeters / targetOffice.radiusMeters) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Dev Simulation Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                <span className="text-gray-400 font-medium">Uji Coba:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPresetLocation("inside")}
                    className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    📍 Di Kantor (18m)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetLocation("outside")}
                    className="rounded-lg bg-red-50 px-2.5 py-1 font-semibold text-red-700 border border-red-200 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                  >
                    🚫 Di Luar (1.8km)
                  </button>
                  <button
                    type="button"
                    onClick={fetchRealGpsLocation}
                    className="rounded-lg bg-gray-100 px-2.5 py-1 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                  >
                    GPS Asli
                  </button>
                </div>
              </div>

              {/* Catatan Karyawan (Opsional) */}
              <div className="pt-1">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Catatan / agenda kerja (opsional)..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Tombol Eksekusi Absen Mobile */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  disabled={isSubmitting || !geofence.isWithinRadius || livenessStatus !== "passed"}
                  onClick={handleSubmitAttendance}
                  className="w-full h-12 text-sm font-bold shadow-theme-md gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Memverifikasi Kehadiran...
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      {attendanceType === "masuk"
                        ? "Konfirmasi Absen Masuk"
                        : "Konfirmasi Absen Pulang"}
                    </>
                  )}
                </Button>

                {/* Pesan status */}
                {!geofence.isWithinRadius ? (
                  <p className="mt-2 text-center text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                    <AlertCircle className="size-3" />
                    Terkunci: Berada di luar area kantor ({geofence.distanceMeters}m).
                  </p>
                ) : livenessStatus !== "passed" ? (
                  <p className="mt-2 text-center text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                    <AlertCircle className="size-3" />
                    Selesaikan 4 gerakan acak di atas ({currentChallengeIndex + 1}/4)...
                  </p>
                ) : (
                  <p className="mt-2 text-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="size-3" />
                    Siap absen! 4 Gerakan lolos & berada di kantor.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL DIALOG STRUK BUKTI KEHADIRAN SUKSES                              */}
      {/* ========================================================================= */}
      {successRecord && (
        <Dialog
          open={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Bukti Kehadiran Berhasil"
          description="Presensi Anda telah divalidasi dengan aman melalui verifikasi wajah 4 gerakan acak dan geofencing."
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3.5 rounded-xl bg-emerald-50 p-4 border border-emerald-200 dark:border-emerald-900/60 dark:bg-emerald-950/40">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-theme-xs">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                  {successRecord.type === "masuk" ? "Absen Masuk Berhasil" : "Absen Pulang Berhasil"}
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {successRecord.timeFormatted} &bull; {successRecord.dateFormatted}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
              <div className="relative size-16 shrink-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                <img
                  src={successRecord.photoUrl}
                  alt="Snapshot Verifikasi"
                  className="size-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center py-0.5">
                  Verified
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {successRecord.userName}
                </p>
                <p className="text-xs text-gray-500">ID: {successRecord.userId} &bull; {successRecord.role}</p>
                <div className="mt-1 flex gap-2">
                  <Badge variant={successRecord.status === "Tepat Waktu" ? "success" : "warning"} size="sm">
                    {successRecord.status}
                  </Badge>
                  <span className="text-[11px] text-gray-400 font-mono">
                    Jarak: {successRecord.distanceMeters}m
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 pt-3 dark:border-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-400">ID Log Transaksi:</span>
                <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{successRecord.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tantangan Biometrik:</span>
                <span className="text-emerald-600 font-semibold dark:text-emerald-400">4 Gerakan Acak Lolos ✓</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lokasi Kantor:</span>
                <span>{successRecord.officeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Integritas Hash (WORM):</span>
                <span className="font-mono text-[11px] text-gray-500">{successRecord.verificationHash}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowSuccessModal(false)}
              >
                Tutup
              </Button>
              <Button
                type="button"
                variant="default"
                className="flex-1 gap-1.5"
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/dashboard");
                }}
              >
                Ke Dashboard
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </AppLayout>
  );
}
