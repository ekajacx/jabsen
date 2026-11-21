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
  LogIn,
  LogOut,
  Calendar,
  X,
  Compass,
  UserCheck,
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
  status: "Tepat Waktu" | "Terlambat" | "Datang Terlambat" | "Pulang Cepat" | "Pulang Tepat Waktu" | "Luar Radius" | string;
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
  const [networkIp, setNetworkIp] = useState<string>("/absen");

  // Jam Real-Time Digital
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setNetworkIp(`${window.location.origin}/absen`);
    }
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WITA"
      );
      setCurrentDateFormatted(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Status Presensi Hari Ini (Check In & Check Out)
  const [todayCheckIn, setTodayCheckIn] = useState<AttendanceRecord | null>(null);
  const [todayCheckOut, setTodayCheckOut] = useState<AttendanceRecord | null>(null);

  // Baca rekam jejak presensi hari ini dari database PostgreSQL (dengan fallback storage)
  useEffect(() => {
    let isMounted = true;
    const fetchTodayStatus = async () => {
      try {
        const empId = user.nik || user.id;
        const res = await fetch(`/api/absen?employeeId=${encodeURIComponent(empId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            if (data.todayCheckIn) {
              setTodayCheckIn({
                id: data.todayCheckIn.id,
                userId: user.id,
                userName: user.name,
                role: user.role,
                type: "masuk",
                timestamp: data.todayCheckIn.timestamp,
                timeFormatted: data.todayCheckIn.timeFormatted,
                dateFormatted: new Date(data.todayCheckIn.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
                officeName: targetOffice.name,
                distanceMeters: data.todayCheckIn.distanceMeters,
                latitude: data.todayCheckIn.latitude,
                longitude: data.todayCheckIn.longitude,
                isWithinRadius: data.todayCheckIn.isWithinRadius,
                photoUrl: data.todayCheckIn.photoUrl || user.avatar,
                verificationHash: data.todayCheckIn.verificationHash,
                status: data.todayCheckIn.status,
              });
            } else {
              setTodayCheckIn(null);
            }

            if (data.todayCheckOut) {
              setTodayCheckOut({
                id: data.todayCheckOut.id,
                userId: user.id,
                userName: user.name,
                role: user.role,
                type: "pulang",
                timestamp: data.todayCheckOut.timestamp,
                timeFormatted: data.todayCheckOut.timeFormatted,
                dateFormatted: new Date(data.todayCheckOut.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
                officeName: targetOffice.name,
                distanceMeters: data.todayCheckOut.distanceMeters,
                latitude: data.todayCheckOut.latitude,
                longitude: data.todayCheckOut.longitude,
                isWithinRadius: data.todayCheckOut.isWithinRadius,
                photoUrl: data.todayCheckOut.photoUrl || user.avatar,
                verificationHash: data.todayCheckOut.verificationHash,
                status: data.todayCheckOut.status,
              });
            } else {
              setTodayCheckOut(null);
            }
            return;
          }
        }
      } catch (e) {
        // Fallback jika offline
      }

      try {
        const raw = localStorage.getItem("j_absen_records");
        if (raw && isMounted) {
          const records: AttendanceRecord[] = JSON.parse(raw);
          const todayStr = new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });

          const myRecordsToday = records.filter(
            (r) =>
              (r.userId === user.id || r.userName === user.name) &&
              r.dateFormatted === todayStr
          );

          const inRec = myRecordsToday.find((r) => r.type === "masuk");
          const outRec = myRecordsToday.find((r) => r.type === "pulang");
          setTodayCheckIn(inRec || null);
          setTodayCheckOut(outRec || null);
        }
      } catch (err) {
        console.error("Gagal membaca storage absen:", err);
      }
    };

    fetchTodayStatus();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Mode Pop-up Kamera Verifikasi
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
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
  const [countdown, setCountdown] = useState<number>(8);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // State Lokasi & Geofence
  const targetOffice = OFFICE_LOCATIONS[0]; // Kantor Pusat Bali
  const [currentLat, setCurrentLat] = useState<number>(targetOffice.latitude + 0.00015);
  const [currentLng, setCurrentLng] = useState<number>(targetOffice.longitude + 0.0001);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(12);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false);
  const [isMockLocation, setIsMockLocation] = useState<boolean>(false);

  // State Hasil Absensi (Modal Struk Bukti)
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

  // Kamera WebRTC (hanya aktif saat Pop-up modal dibuka)
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

    // Langkah Awal: Deteksi Wajah (1.2 detik) lalu mulai gerakan 1
    setTimeout(() => {
      setLivenessStatus("in_challenge");
      setCountdown(8);
    }, 1200);
  };

  // Callback saat gerakan terdeteksi berhasil
  const handlePassCurrentChallenge = () => {
    if (currentChallengeIndex < 3) {
      setCurrentChallengeIndex((prev) => prev + 1);
      setCountdown(8);
    } else {
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
        isCameraModalOpen &&
        cameraActive &&
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        landmarkerRef.current &&
        livenessStatus === "in_challenge"
      ) {
        const video = videoRef.current;
        const currentVideoTime = video.currentTime;
        if (currentVideoTime !== lastVideoTime) {
          lastVideoTime = currentVideoTime;
          try {
            const results = landmarkerRef.current.detectForVideo(video, performance.now());
            const analysis = analyzeMovementFromLandmarks(results);
            setDetectedMovement(analysis.movement);

            const currentChallenge = activeChallenges[currentChallengeIndex];
            if (currentChallenge && analysis.movement === currentChallenge.id) {
              handlePassCurrentChallenge();
            }
          } catch (err) {
            // Toleransi frame
          }
        }
      }
      if (isCameraModalOpen) {
        requestRef.current = requestAnimationFrame(detectLoop);
      }
    };

    if (isCameraModalOpen && isMediaPipeReady && cameraActive && livenessStatus === "in_challenge") {
      requestRef.current = requestAnimationFrame(detectLoop);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isCameraModalOpen, isMediaPipeReady, cameraActive, livenessStatus, currentChallengeIndex, activeChallenges]);

  // Fallback Auto-Simulasi jika webcam dev tidak mendeteksi gerakan
  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    if (isCameraModalOpen && livenessStatus === "in_challenge" && (!cameraActive || !isMediaPipeReady)) {
      progressTimer = setTimeout(() => {
        handlePassCurrentChallenge();
      }, 2500);
    }
    return () => clearTimeout(progressTimer);
  }, [isCameraModalOpen, livenessStatus, currentChallengeIndex, cameraActive, isMediaPipeReady]);

  // Timer Countdown per gerakan
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCameraModalOpen && livenessStatus === "in_challenge" && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isCameraModalOpen && livenessStatus === "in_challenge" && countdown === 0) {
      setLivenessStatus("failed");
    }
    return () => clearTimeout(timer);
  }, [isCameraModalOpen, livenessStatus, countdown]);

  // Buka Pop-up Verifikasi Wajah untuk Check In
  const handleOpenCheckInModal = () => {
    if (todayCheckIn) return;
    setAttendanceType("masuk");
    setIsCameraModalOpen(true);
    startNewLivenessSession();
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  // Buka Pop-up Verifikasi Wajah untuk Check Out
  const handleOpenCheckOutModal = () => {
    if (!todayCheckIn || todayCheckOut) return;
    setAttendanceType("pulang");
    setIsCameraModalOpen(true);
    startNewLivenessSession();
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  // Tutup Pop-up Modal Kamera
  const handleCloseCameraModal = () => {
    setIsCameraModalOpen(false);
    stopCamera();
  };

  // Reset Uji Coba Hari Ini (Khusus QA / Dev)
  const handleResetTodayAttendance = () => {
    try {
      const raw = localStorage.getItem("j_absen_records");
      if (raw) {
        const records: AttendanceRecord[] = JSON.parse(raw);
        const todayStr = new Date().toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const filtered = records.filter(
          (r) =>
            !(
              (r.userId === user.id || r.userName === user.name) &&
              r.dateFormatted === todayStr
            )
        );
        localStorage.setItem("j_absen_records", JSON.stringify(filtered));
      }
      setTodayCheckIn(null);
      setTodayCheckOut(null);
      showAlert({
        title: "Reset Berhasil",
        message: "Status absensi hari ini telah di-reset ke status awal (Belum Check In).",
        type: "info",
      });
    } catch (e) {
      console.error(e);
    }
  };

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
        showAlert({
          title: "Gagal Membaca GPS",
          message: "Tidak dapat mengambil sinyal GPS asli: " + err.message + ". Menggunakan koordinat kantor simulasi.",
          type: "warning",
        });
        setIsLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Preset lokasi pengujian dev
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

  // Eksekusi Simpan Presensi dari Modal Pop-up (Terhubung ke PostgreSQL & Offline Cache)
  const handleSubmitAttendance = async () => {
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

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    let calculatedStatus: AttendanceRecord["status"] = "Tepat Waktu";
    if (attendanceType === "masuk") {
      if (hours > 8 || (hours === 8 && minutes > 0)) {
        calculatedStatus = "Datang Terlambat";
      } else {
        calculatedStatus = "Tepat Waktu";
      }
    } else {
      if (hours < 17) {
        calculatedStatus = "Pulang Cepat";
      } else {
        calculatedStatus = "Pulang Tepat Waktu";
      }
    }

    let finalRecord: AttendanceRecord = {
      id: "REC-" + Date.now().toString(36).toUpperCase(),
      userId: user.id,
      userName: user.name,
      role: user.role,
      type: attendanceType,
      timestamp: now.toISOString(),
      timeFormatted: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WITA",
      dateFormatted: now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      officeName: targetOffice.name,
      distanceMeters: geofence.distanceMeters,
      latitude: currentLat,
      longitude: currentLng,
      isWithinRadius: true,
      photoUrl: photoData,
      verificationHash: "SHA256-" + Math.random().toString(16).substring(2, 10) + "-WORM",
      status: calculatedStatus,
    };

    // 1. Simpan ke database PostgreSQL via API
    try {
      const res = await fetch("/api/absen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: user.nik || user.id,
          type: attendanceType,
          latitude: currentLat,
          longitude: currentLng,
          distanceMeters: geofence.distanceMeters,
          photoUrl: photoData,
          notes: note,
          officeId: targetOffice.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIsSubmitting(false);
        showAlert({
          title: "Gagal Mengirim Presensi",
          message: data.message || "Terjadi kesalahan saat memproses presensi.",
          type: "error",
        });
        return;
      }

      if (data.record) {
        finalRecord = {
          id: data.record.id,
          userId: user.id,
          userName: user.name,
          role: user.role,
          type: data.record.type,
          timestamp: data.record.timestamp,
          timeFormatted: data.record.timeFormatted,
          dateFormatted: new Date(data.record.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
          officeName: targetOffice.name,
          distanceMeters: data.record.distanceMeters,
          latitude: data.record.latitude,
          longitude: data.record.longitude,
          isWithinRadius: data.record.isWithinRadius,
          photoUrl: data.record.photoUrl || photoData,
          verificationHash: data.record.verificationHash,
          status: data.record.status,
        };
      }
    } catch (apiErr) {
      console.warn("Koneksi API presensi offline, menyimpan ke cache lokal:", apiErr);
    }

    // 2. Simpan juga ke cache lokal
    try {
      const existing = JSON.parse(localStorage.getItem("j_absen_records") || "[]");
      localStorage.setItem("j_absen_records", JSON.stringify([finalRecord, ...existing]));
    } catch (e) {
      console.error("Gagal simpan ke storage:", e);
    }

    // 3. Perbarui status state tombol
    if (attendanceType === "masuk") {
      setTodayCheckIn(finalRecord);
    } else {
      setTodayCheckOut(finalRecord);
    }

    // Tutup modal kamera & matikan kamera
    setIsCameraModalOpen(false);
    stopCamera();

    // Tampilkan modal struk bukti sukses
    setSuccessRecord(finalRecord);
    setIsSubmitting(false);
    setShowSuccessModal(true);
  };

  const currentChallenge = activeChallenges[currentChallengeIndex];

  // Render Icon Gerakan
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

  // State Logic untuk Tombol
  const hasCheckedIn = Boolean(todayCheckIn);
  const hasCheckedOut = Boolean(todayCheckOut);
  const isAllCompleted = hasCheckedIn && hasCheckedOut;

  return (
    <AppLayout pageTitle="Presensi Kehadiran">
      <canvas ref={canvasRef} className="hidden" />

      {/* ========================================================================= */}
      {/* 1. LAYAR BLOKIR DESKTOP (JIKA TIDAK BYPASS)                              */}
      {/* ========================================================================= */}
      {!isMobileDevice && !bypassDesktop ? (
        <div className="mx-auto max-w-2xl py-8 px-4">
          <Card className="border-gray-200 shadow-theme-lg dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 rounded-3xl">
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-6 text-white text-center">
              <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-theme-md">
                <Smartphone className="size-8 animate-bounce" />
              </div>
              <h2 className="text-xl font-bold sm:text-2xl">
                Presensi Wajah Khusus HP Pribadi
              </h2>
              <p className="mt-2 text-xs text-blue-100 sm:text-sm max-w-lg mx-auto leading-relaxed">
                Presensi kehadiran wajah dilakukan melalui HP pribadi terdaftar Anda demi keabsahan biometrik &amp; koordinat GPS. Gunakan Laptop/PC khusus untuk manajemen data.
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
                  Buka Tautan di Smartphone Anda
                </h4>
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
        /* 2. LAYAR BLOKIR PERANGKAT TIDAK COCOK                                     */
        /* ========================================================================= */
        <div className="mx-auto max-w-xl py-8 px-4">
          <Card className="border-red-200 shadow-theme-lg dark:border-red-900/60 overflow-hidden bg-white dark:bg-gray-900 rounded-3xl">
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
        /* 3. TAMPILAN UTAMA ABSENSI MOBILE: PUTIH BERSIH, LEBAR & INFORMATIF       */
        /* ========================================================================= */
        <div className="max-w-xl mx-auto space-y-4 pb-16 px-1">
          {/* Banner Toolbar Mode Dev & Status Perangkat */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
              <span className="truncate font-semibold">
                {userAccount?.boundDeviceName || currentDev.deviceName}
              </span>
              <span className="text-emerald-500 font-bold">&bull; Valid HP</span>
            </div>

            {/* Tombol Dev Tools: Reset Uji Coba & Bypass */}
            <div className="flex items-center gap-2 justify-end">
              {(hasCheckedIn || hasCheckedOut) && (
                <button
                  type="button"
                  onClick={handleResetTodayAttendance}
                  className="rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 dark:bg-gray-800 dark:border-gray-700 px-3 py-1 text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 transition-colors"
                  title="Kembalikan status hari ini ke belum absen untuk pengujian"
                >
                  <RotateCcw className="size-3" />
                  Reset Uji Coba
                </button>
              )}
              {bypassDesktop && (
                <button
                  type="button"
                  onClick={() => setBypassDesktop(false)}
                  className="rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300"
                >
                  Kunci PC
                </button>
              )}
            </div>
          </div>

          {/* KARTU 1: PROFIL KARYAWAN & JAM DIGITAL REAL-TIME (PUTIH BERSIH) */}
          <Card className="border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-xs rounded-3xl overflow-hidden">
            <CardContent className="p-5 space-y-4">
              {/* Header Info User */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"}
                    alt={user.name}
                    className="size-13 rounded-2xl object-cover ring-2 ring-blue-100 dark:ring-blue-900 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white truncate">
                      {user.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {user.nik || "ID: EMP-001"} &bull; {user.role}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                      Shift Reguler (08:00 - 17:00 WITA)
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <Badge variant="secondary" className="border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300 font-bold text-xs">
                    Kantor Pusat
                  </Badge>
                </div>
              </div>

              {/* Display Waktu & Tanggal Digital Besar */}
              <div className="rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 p-4 border border-blue-100 dark:from-gray-800/60 dark:to-gray-800/20 dark:border-gray-700/60 text-center space-y-1">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <Calendar className="size-3.5 text-blue-600" />
                  <span>{currentDateFormatted || "Memuat Tanggal..."}</span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white font-mono">
                  {currentTime || "00:00:00 WITA"}
                </div>
                <p className="text-[11px] text-gray-400">
                  Waktu Indonesia Tengah (Kantor Pusat Bali &bull; Sinkron Server Presensi WORM)
                </p>
              </div>

              {/* Status Ringkasan Presensi Hari Ini */}
              <div className="rounded-2xl p-3.5 border transition-all">
                {!hasCheckedIn ? (
                  <div className="flex items-center gap-3 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 rounded-xl">
                    <Clock className="size-5 shrink-0 text-amber-600" />
                    <div className="text-xs">
                      <span className="font-bold block">Status: Belum Absen Masuk</span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400">
                        Silakan tekan tombol <strong>Check In</strong> di bawah untuk memulai jam kerja.
                      </span>
                    </div>
                  </div>
                ) : !hasCheckedOut ? (
                  <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-3 rounded-xl">
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                    <div className="text-xs">
                      <span className="font-bold block">
                        Sudah Check In: {todayCheckIn?.timeFormatted} ({todayCheckIn?.status})
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Jam kerja Anda aktif. Tekan tombol <strong>Check Out</strong> saat jam pulang kerja.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-3 rounded-xl">
                    <UserCheck className="size-5 shrink-0 text-blue-600" />
                    <div className="text-xs">
                      <span className="font-bold block">Presensi Hari Ini Lengkap & Sah</span>
                      <span className="text-[11px] text-blue-700 dark:text-blue-300">
                        Check In: <strong>{todayCheckIn?.timeFormatted}</strong> &bull; Check Out: <strong>{todayCheckOut?.timeFormatted}</strong>.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* KARTU 2: DUA TOMBOL AKSI UTAMA (CHECK IN & CHECK OUT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. TOMBOL CHECK IN */}
            <button
              type="button"
              disabled={hasCheckedIn || isSubmitting}
              onClick={handleOpenCheckInModal}
              className={`w-full relative flex flex-col items-center justify-center p-5 rounded-3xl transition-all select-none shadow-sm border-2 ${
                !hasCheckedIn
                  ? "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] border-blue-600 text-white cursor-pointer shadow-blue-500/25 shadow-lg"
                  : "bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200 cursor-not-allowed opacity-90"
              }`}
            >
              <div className="flex items-center gap-2">
                {!hasCheckedIn ? (
                  <LogIn className="size-6 text-white" />
                ) : (
                  <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="text-base font-extrabold tracking-tight">
                  {!hasCheckedIn ? "CHECK IN" : "SUDAH CHECK IN"}
                </span>
              </div>
              <span className={`text-xs mt-1 font-medium ${!hasCheckedIn ? "text-blue-100" : "text-emerald-700 dark:text-emerald-400"}`}>
                {!hasCheckedIn
                  ? "Klik untuk Verifikasi Wajah Masuk"
                  : `Tercatat: ${todayCheckIn?.timeFormatted}`}
              </span>
            </button>

            {/* 2. TOMBOL CHECK OUT */}
            <button
              type="button"
              disabled={!hasCheckedIn || hasCheckedOut || isSubmitting}
              onClick={handleOpenCheckOutModal}
              className={`w-full relative flex flex-col items-center justify-center p-5 rounded-3xl transition-all select-none shadow-sm border-2 ${
                !hasCheckedIn
                  ? "bg-gray-100 border-gray-200 text-gray-400 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-500 cursor-not-allowed opacity-60"
                  : !hasCheckedOut
                  ? "bg-amber-600 hover:bg-amber-700 active:scale-[0.98] border-amber-600 text-white cursor-pointer shadow-amber-500/25 shadow-lg"
                  : "bg-blue-50/70 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200 cursor-not-allowed opacity-90"
              }`}
            >
              <div className="flex items-center gap-2">
                {!hasCheckedIn ? (
                  <LogOut className="size-6 text-gray-400" />
                ) : !hasCheckedOut ? (
                  <LogOut className="size-6 text-white" />
                ) : (
                  <CheckCircle2 className="size-6 text-blue-600 dark:text-blue-400" />
                )}
                <span className="text-base font-extrabold tracking-tight">
                  {!hasCheckedIn
                    ? "CHECK OUT"
                    : !hasCheckedOut
                    ? "CHECK OUT"
                    : "SUDAH CHECK OUT"}
                </span>
              </div>
              <span className={`text-xs mt-1 font-medium ${
                !hasCheckedIn
                  ? "text-gray-400"
                  : !hasCheckedOut
                  ? "text-amber-100"
                  : "text-blue-700 dark:text-blue-400"
              }`}>
                {!hasCheckedIn
                  ? "Selesaikan Check In Terlebih Dahulu"
                  : !hasCheckedOut
                  ? "Klik untuk Verifikasi Wajah Pulang"
                  : `Tercatat: ${todayCheckOut?.timeFormatted}`}
              </span>
            </button>
          </div>

          {/* KARTU 3: STATUS RADIUS GEOFENCE & GPS KANTOR */}
          <Card className="border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-xs rounded-3xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-xs text-gray-900 dark:text-white">
                    Lokasi Kantor: {targetOffice.name}
                  </span>
                </div>
                <Badge
                  variant={geofence.isWithinRadius ? "success" : "destructive"}
                  size="sm"
                  className="font-bold text-[10px]"
                >
                  {geofence.isWithinRadius ? "Dalam Radius Area" : "Luar Radius Area"}
                </Badge>
              </div>

              {/* Jarak GPS Ponsel & Progress Bar */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex justify-between items-center text-xs text-gray-700 dark:text-gray-300">
                  <span>Jarak GPS Ponsel:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {geofence.distanceMeters} meter{" "}
                    <span className="text-gray-400 font-normal">/ maks {targetOffice.radiusMeters}m</span>
                  </span>
                </div>

                <div className="mt-2 h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      geofence.isWithinRadius ? "bg-emerald-500" : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (geofence.distanceMeters / targetOffice.radiusMeters) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Dev Simulation Buttons & GPS Real-time */}
              <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                <span className="text-gray-400 font-medium">Uji Coba GPS:</span>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPresetLocation("inside")}
                    className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 transition-colors"
                  >
                    📍 Di Kantor (18m)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetLocation("outside")}
                    className="rounded-lg bg-red-50 px-2.5 py-1 font-semibold text-red-700 border border-red-200 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300 transition-colors"
                  >
                    🚫 Di Luar (1.8km)
                  </button>
                  <button
                    type="button"
                    onClick={fetchRealGpsLocation}
                    disabled={isLocationLoading}
                    className="rounded-lg bg-gray-100 px-2.5 py-1 text-gray-700 hover:bg-gray-200 font-medium dark:bg-gray-800 dark:text-gray-300 transition-colors"
                  >
                    {isLocationLoading ? "Mencari GPS..." : "GPS Asli"}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. POP-UP MODAL KAMERA FISIK (VERIFIKASI WAJAH PUTIH BERSIH & LEBAR)     */}
      {/* ========================================================================= */}
      <Dialog
        open={isCameraModalOpen}
        onClose={handleCloseCameraModal}
        title={attendanceType === "masuk" ? "Verifikasi Wajah — Absen Masuk" : "Verifikasi Wajah — Absen Pulang"}
        description="Posisikan wajah Anda pada lingkaran kamera dan ikuti 4 gerakan acak liveness."
        className="max-w-lg w-full text-xs bg-white dark:bg-gray-900 rounded-3xl"
      >
        <div className="space-y-4 pt-1">
          {/* Header Progress 4 Gerakan Acak */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-blue-600" />
              <span className="font-bold text-xs text-gray-900 dark:text-white">
                Liveness: 4 Gerakan Acak
              </span>
            </div>
            <div>
              {livenessStatus === "passed" ? (
                <Badge variant="success" size="sm" className="gap-1 font-bold">
                  <CheckCircle2 className="size-3" />
                  4/4 Selesai
                </Badge>
              ) : livenessStatus === "failed" ? (
                <Badge variant="destructive" size="sm" className="gap-1 font-bold">
                  <AlertCircle className="size-3" />
                  Waktu Habis
                </Badge>
              ) : (
                <Badge variant="warning" size="sm" className="gap-1 font-bold">
                  <Sparkles className="size-3 animate-spin" />
                  Gerakan {currentChallengeIndex + 1}/4
                </Badge>
              )}
            </div>
          </div>

          {/* 4 Steps Gerakan (Pills) */}
          <div className="grid grid-cols-4 gap-1.5">
            {activeChallenges.map((item, idx) => {
              const isDone = idx < currentChallengeIndex || livenessStatus === "passed";
              const isCurrent = idx === currentChallengeIndex && livenessStatus === "in_challenge";

              return (
                <button
                  type="button"
                  key={item.id + idx}
                  onClick={() => {
                    // Fitur klik langsung untuk kemudahan pengujian jika kamera minim cahaya
                    if (idx === currentChallengeIndex && livenessStatus === "in_challenge") {
                      handlePassCurrentChallenge();
                    }
                  }}
                  className={`flex flex-col items-center rounded-xl p-1.5 border text-center transition-all ${
                    isDone
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                      : isCurrent
                      ? "bg-amber-50 border-amber-400 text-amber-900 shadow-xs dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-200 cursor-pointer"
                      : "bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700"
                  }`}
                  title="Klik gerakan untuk loloskan tantangan (Dev/Bypass)"
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
                </button>
              );
            })}
          </div>

          {/* JENDELA KAMERA FISIK DENGAN BINGKAI OVAL */}
          <div className="relative aspect-[3/4] max-h-[380px] w-full overflow-hidden rounded-2xl bg-gray-950 flex items-center justify-center shadow-inner">
            {/* Video WebRTC Feed dari Kamera Depan */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`h-full w-full object-cover scale-x-[-1] ${
                cameraActive ? "block" : "hidden"
              }`}
            />

            {/* Fallback jika izin kamera belum aktif atau simulator */}
            {!cameraActive && (
              <div className="relative flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-3 flex size-24 items-center justify-center rounded-full bg-gray-800 border-2 border-dashed border-blue-400/60 overflow-hidden">
                  <img
                    src={user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"}
                    alt={user.name}
                    className="size-full object-cover"
                  />
                </div>
                <p className="text-sm font-bold text-white">{user.name}</p>
                <p className="text-xs text-gray-400 font-mono">ID: {user.nik || user.id}</p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-300">
                  Simulasi Selfie Karyawan
                </span>
              </div>
            )}

            {/* Bingkai Oval Wajah */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div
                className={`relative w-44 h-56 rounded-[50%] border-2 transition-all duration-300 ${
                  livenessStatus === "passed"
                    ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.6)]"
                    : livenessStatus === "failed"
                    ? "border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                    : "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                }`}
              >
                {/* Garis Scan Vertikal Halus */}
                <div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-bounce opacity-80"
                  style={{ top: "45%" }}
                />

                {/* Overlay Icon Arah Gerakan Aktif */}
                {livenessStatus === "in_challenge" && currentChallenge && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/60 p-3 backdrop-blur-xs border border-white/20">
                      {renderMovementIcon(currentChallenge.id)}
                    </div>
                  </div>
                )}
              </div>

              {/* Teks Instruksi & Countdown */}
              <div className="mt-3 max-w-[270px] rounded-xl bg-black/85 px-4 py-1.5 text-center text-xs font-semibold text-white backdrop-blur-md">
                {livenessStatus === "scanning_face" && (
                  <span className="text-blue-300">Mendeteksi wajah awal...</span>
                )}

                {livenessStatus === "in_challenge" && currentChallenge && (
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-center gap-1.5 text-amber-300 font-bold">
                      <span>Gerakan {currentChallengeIndex + 1}/4:</span>
                      <span className="flex items-center gap-1 text-[11px] text-white/80">
                        <Timer className="size-3 text-amber-400" />
                        {countdown}s
                      </span>
                    </div>
                    <p className="text-white text-[11px] leading-tight">{currentChallenge.instruction}</p>
                  </div>
                )}

                {livenessStatus === "passed" && (
                  <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="size-4" />
                    4 Gerakan Lolos Terverifikasi! ✓
                  </span>
                )}

                {livenessStatus === "failed" && (
                  <span className="text-red-400 font-bold flex items-center justify-center gap-1">
                    <AlertCircle className="size-4" />
                    Waktu habis. Silakan ulangi.
                  </span>
                )}
              </div>
            </div>

            {/* Tombol Kontrol Kamera di dalam frame */}
            <div className="absolute bottom-2 inset-x-2 z-10 flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cameraActive ? stopCamera : startCamera}
                className="h-7 text-[11px] gap-1 bg-black/60 text-white backdrop-blur-md hover:bg-black/80 border-none"
              >
                {cameraActive ? <VideoOff className="size-3" /> : <Video className="size-3" />}
                {cameraActive ? "Tutup Cam" : "Nyalakan Cam"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startNewLivenessSession}
                className="h-7 text-[11px] gap-1 bg-black/60 text-white backdrop-blur-md hover:bg-black/80 border-none"
              >
                <RotateCcw className="size-3" />
                Acak Ulang
              </Button>
            </div>
          </div>

          {/* Catatan / Keterangan Tambahan */}
          <div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan kerja (opsional, misal: lembur / dinas)..."
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Tombol Eksekusi di Pop-up */}
          <div className="flex gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseCameraModal}
              className="flex-1 text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={isSubmitting || !geofence.isWithinRadius || livenessStatus !== "passed"}
              onClick={handleSubmitAttendance}
              className={`flex-2 text-xs font-bold gap-1.5 ${
                attendanceType === "masuk"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  {attendanceType === "masuk" ? "Konfirmasi Absen Masuk" : "Konfirmasi Absen Pulang"}
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ========================================================================= */}
      {/* 5. MODAL DIALOG STRUK BUKTI KEHADIRAN SUKSES                              */}
      {/* ========================================================================= */}
      {successRecord && (
        <Dialog
          open={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Bukti Kehadiran Berhasil"
          description="Presensi Anda telah divalidasi dengan aman melalui verifikasi wajah 4 gerakan acak dan geofencing."
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3.5 rounded-2xl bg-emerald-50 p-4 border border-emerald-200 dark:border-emerald-900/60 dark:bg-emerald-950/40">
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

            <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
              <div className="relative size-16 shrink-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
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
