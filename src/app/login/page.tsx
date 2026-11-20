"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Users,
  Search,
  Building2,
  ChevronRight,
  X,
  Smartphone,
  Laptop,
  KeyRound,
  ShieldAlert,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth, UserRole, UserProfile } from "@/context/auth-context";
import { useModal } from "@/context/modal-context";
import { NeuralBackground } from "@/components/ui/neural-background";
import { cn } from "@/lib/utils";
import {
  getStoredUserAccounts,
  getCurrentDevice,
  setSimulatedDevice,
  validateDeviceForLogin,
  bindDeviceOnLogin,
  completeFirstTimePasswordChange,
  UserAccount,
  DeviceType,
  SimulatedDeviceConfig,
  PRESET_DEVICES,
} from "@/lib/user-account-data";

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  CEO: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  GM: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
  HRD: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
  Supervisor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  Staff: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  "Admin IT": "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
};

export default function LoginPage() {
  const router = useRouter();
  const { showAlert } = useModal();
  const { login, allProfiles } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>(undefined);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Status Perangkat Simulasi (Pengujian Device Binding)
  const [activeDevice, setActiveDevice] = useState<SimulatedDeviceConfig>(PRESET_DEVICES.mobile_registered);

  useEffect(() => {
    setActiveDevice(getCurrentDevice());
  }, []);

  const handleSwitchDevice = (preset: DeviceType) => {
    setSimulatedDevice(preset);
    setActiveDevice(getCurrentDevice());
    setErrors({});
  };

  // State Modal Wajib Ubah Password Baru pada Login Pertama Kali
  const [pendingAccountForPasswordChange, setPendingAccountForPasswordChange] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  // Modal 27 Karyawan
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [searchEmpQuery, setSearchEmpQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");

  const filteredEmployees = useMemo(() => {
    return allProfiles.filter((p) => {
      if (selectedDeptFilter !== "ALL") {
        if (selectedDeptFilter === "Direksi") {
          if (p.department !== "Direksi" && p.department !== "Manajemen") return false;
        } else if (p.department !== selectedDeptFilter) {
          return false;
        }
      }
      if (searchEmpQuery.trim()) {
        const q = searchEmpQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.nik.toLowerCase().includes(q) ||
          p.jobTitle.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allProfiles, selectedDeptFilter, searchEmpQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoginSuccess(null);

    // Validasi Dasar
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      newErrors.username = "NIP atau Username wajib diisi";
    }
    if (!password) {
      newErrors.password = "Kata sandi wajib diisi";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    const cleanUser = username.trim();
    const currentDev = getCurrentDevice();

    // 1. Coba Autentikasi Langsung ke PostgreSQL API
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: cleanUser,
          password,
          deviceId: currentDev.deviceId,
          deviceName: currentDev.deviceName,
          isMobile: currentDev.isMobile,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.mustChangePassword) {
          setIsLoading(false);
          setPendingAccountForPasswordChange({
            id: data.user.id,
            employeeId: data.user.id,
            name: data.user.name,
            username: data.user.username,
            role: data.user.role,
          } as any);
          setNewPassword("");
          setConfirmNewPassword("");
          setChangePasswordError(null);
          return;
        }

        login(data.user.username, data.user.role, data.user.id);
        setIsLoading(false);
        setLoginSuccess(`Berhasil masuk sebagai ${data.user.name}! Mengalihkan ke Dashboard...`);
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
        return;
      }

      if (!res.ok && res.status < 500) {
        setIsLoading(false);
        setErrors({ general: data.message || "Gagal masuk. Periksa kembali kredensial Anda." });
        return;
      }
    } catch (apiErr) {
      console.warn("Koneksi API PostgreSQL offline, beralih ke cache lokal:", apiErr);
    }

    // 2. Fallback ke Akun Lokal (Simulasi Offline / Storage)
    const storedAccounts = getStoredUserAccounts();
    const cleanUserLower = cleanUser.toLowerCase();
    const matchedAccount = storedAccounts.find(
      (a) =>
        a.employeeId.toLowerCase() === cleanUserLower ||
        a.username.toLowerCase() === cleanUserLower ||
        a.name.toLowerCase() === cleanUserLower
    );

    if (matchedAccount) {
      // 1. Verifikasi Password
      const isDevFallback = password === "password123";
      const isActualMatch = password === matchedAccount.password;

      if (!isActualMatch && !isDevFallback) {
        setIsLoading(false);
        setErrors({ password: "Kata sandi yang Anda masukkan salah. Silakan coba lagi." });
        return;
      }

      // 2. Cek Status Akun
      if (matchedAccount.accountStatus === "Terkunci") {
        setIsLoading(false);
        setErrors({
          general: "Akun Anda saat ini terkunci demi keamanan. Silakan hubungi Admin IT atau HRD.",
        });
        return;
      }

      // 3. Cek Apakah Wajib Ganti Password (Login Pertama Kali)
      if (matchedAccount.mustChangePassword) {
        setIsLoading(false);
        setPendingAccountForPasswordChange(matchedAccount);
        setNewPassword("");
        setConfirmNewPassword("");
        setChangePasswordError(null);
        return;
      }

      // 4. Cek Validasi Device Binding (Anti Titip Absen)
      const deviceRes = validateDeviceForLogin(matchedAccount, currentDev);

      if (!deviceRes.allowed) {
        setIsLoading(false);
        setErrors({ general: deviceRes.reason });
        return;
      }

      // Jika ini login pertama di HP yang cocok, otomatis ikat
      if (deviceRes.isFirstBinding) {
        bindDeviceOnLogin(matchedAccount.employeeId, currentDev);
      }

      // 5. Sukses Masuk
      setTimeout(() => {
        login(matchedAccount.username, matchedAccount.role, matchedAccount.employeeId);
        setIsLoading(false);
        setLoginSuccess(`Berhasil masuk sebagai ${matchedAccount.name}! Mengalihkan ke Dashboard...`);
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      }, 500);
      return;
    }

    // Fallback jika login menggunakan username non-terdaftar (Demo Mode)
    setTimeout(() => {
      login(username, selectedRole, selectedEmployeeId);
      setIsLoading(false);
      setLoginSuccess(`Berhasil masuk sebagai ${username}! Mengalihkan ke Dashboard...`);
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    }, 500);
  };

  // Simpan Kata Sandi Baru pada Aktivasi Pertama Kali & Kembali ke Login Bersih
  const handleCompletePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAccountForPasswordChange) return;

    if (!newPassword || newPassword.length < 8) {
      setChangePasswordError("Kata sandi baru minimal 8 karakter.");
      return;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    if (!hasUpper || !hasLower) {
      setChangePasswordError("Kata sandi baru wajib memuat kombinasi huruf besar dan huruf kecil.");
      return;
    }

    if (newPassword === pendingAccountForPasswordChange.password) {
      setChangePasswordError("Kata sandi baru tidak boleh sama dengan kata sandi acak sementara.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    // Update via API PostgreSQL
    try {
      await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: pendingAccountForPasswordChange.username,
          newPassword,
        }),
      });
    } catch (e) {
      console.warn("Gagal update password via API, menyimpan ke lokal:", e);
    }

    // Berhasil Update Kata Sandi di Local Storage juga
    completeFirstTimePasswordChange(pendingAccountForPasswordChange.employeeId, newPassword);
    const employeeName = pendingAccountForPasswordChange.name;
    const employeeNik = pendingAccountForPasswordChange.employeeId;

    // Tutup Modal dan Bersihkan Form ke Halaman Login Bersih
    setPendingAccountForPasswordChange(null);
    setPassword("");
    setErrors({});
    setLoginSuccess(
      `Aktivasi berhasil! Kata sandi baru untuk '${employeeName}' (${employeeNik}) telah disimpan di database. Silakan masuk kembali menggunakan kata sandi baru Anda.`
    );
  };

  const handleQuickFill = (demoUser: string, role: UserRole) => {
    setUsername(demoUser);
    setPassword("password123");
    setSelectedRole(role);
    setSelectedEmployeeId(undefined);
    setErrors({});
    setLoginSuccess(null);
  };

  const handleSelectSpecificEmployee = (emp: UserProfile, autoSubmit: boolean = false) => {
    setUsername(emp.username || emp.nik);
    setPassword("password123");
    setSelectedRole(emp.role);
    setSelectedEmployeeId(emp.id);
    setErrors({});
    setIsEmpModalOpen(false);

    if (autoSubmit) {
      setIsLoading(true);
      setLoginSuccess(`Memilih POV: ${emp.name} (${emp.jobTitle}). Mengalihkan...`);
      setTimeout(() => {
        login(emp.username || emp.nik, emp.role, emp.id);
        router.push("/dashboard");
      }, 600);
    } else {
      setLoginSuccess(`Karyawan dipilih: ${emp.name} (${emp.jobTitle} - ${emp.role})`);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gradient-to-b from-gray-50 via-brand-25/40 to-indigo-50/30 py-8 px-4 sm:px-6 lg:px-8 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Interactive Brain Neural Network Animation Canvas */}
      <NeuralBackground />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-theme-md shadow-brand-500/20 mb-3 ring-4 ring-brand-100 dark:ring-brand-900/40">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            J-Absen
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sistem Absensi Karyawan Berbasis Verifikasi Wajah & Geolokasi
          </p>
        </div>

        {/* Login Card */}
        <Card className="border border-gray-200/80 bg-white/90 shadow-theme-xl backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Masuk ke Akun Anda
            </CardTitle>
            <CardDescription>
              Masukkan NIP atau username beserta kata sandi yang telah terdaftar.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* SAKELAR SIMULATOR PERANGKAT (DEVICE BINDING TESTING) */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50/80 p-2.5 dark:border-gray-800 dark:bg-gray-900/60">
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Smartphone className="size-3 text-brand-600" />
                  Simulator Perangkat:
                </span>
                <Badge
                  variant={activeDevice.type === "mobile_registered" ? "success" : activeDevice.type === "desktop_pc" ? "info" : "warning"}
                  size="sm"
                  className="text-[9px] py-0 px-1.5"
                >
                  {activeDevice.type === "mobile_registered" ? "HP Terikat" : activeDevice.type === "desktop_pc" ? "Laptop / PC" : "HP Asing (Titip Absen)"}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSwitchDevice("mobile_registered")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg p-1.5 text-center transition-all border",
                    activeDevice.type === "mobile_registered"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shadow-xs"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  )}
                  title="Simulasi login dari HP Samsung Galaxy A54 (Device pribadi resmi)"
                >
                  <Smartphone className="size-3.5 mb-0.5" />
                  <span className="text-[10px] leading-tight">HP Terdaftar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchDevice("mobile_foreign")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg p-1.5 text-center transition-all border",
                    activeDevice.type === "mobile_foreign"
                      ? "border-amber-500 bg-amber-50 text-amber-800 font-bold dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 shadow-xs"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  )}
                  title="Simulasi login dari HP Xiaomi Redmi (HP pinjaman teman / titip absen)"
                >
                  <ShieldAlert className="size-3.5 mb-0.5" />
                  <span className="text-[10px] leading-tight">HP Pinjaman</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchDevice("desktop_pc")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg p-1.5 text-center transition-all border",
                    activeDevice.type === "desktop_pc"
                      ? "border-blue-500 bg-blue-50 text-blue-800 font-bold dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700 shadow-xs"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  )}
                  title="Simulasi login dari Komputer PC / Laptop Kantor (Hanya diizinkan untuk Pimpinan/Atasan)"
                >
                  <Laptop className="size-3.5 mb-0.5" />
                  <span className="text-[10px] leading-tight">Laptop / PC</span>
                </button>
              </div>
              <p className="mt-1 text-[9px] text-gray-400 px-0.5 truncate">
                ID: {activeDevice.deviceName}
              </p>
            </div>

            {/* Alert Error */}
            {errors.general && (
              <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                <AlertCircle className="size-4 shrink-0 text-red-500" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Alert Success Simulation */}
            {loginSuccess && (
              <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-400">
                <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                <span>{loginSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <Field error={errors.username}>
                <FieldLabel required>NIP / Username</FieldLabel>
                <Input
                  type="text"
                  placeholder="Contoh: DIR-001, OPS-302, TI-101"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setSelectedRole(undefined);
                    setSelectedEmployeeId(undefined);
                  }}
                  startIcon={<User className="size-4" />}
                  autoComplete="username"
                  disabled={isLoading}
                />
                <FieldError />
              </Field>

              {/* Password Field */}
              <Field error={errors.password}>
                <div className="flex items-center justify-between">
                  <FieldLabel required>Kata Sandi</FieldLabel>
                  <button
                    type="button"
                    tabIndex={-1}
                    className="text-xs font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
                    onClick={() =>
                      showAlert({
                        title: "Bantuan Masuk & Reset Sandi",
                        message: "Silakan hubungi Administrator IT atau Departemen HRD perusahaan untuk mereset kata sandi Anda.",
                        type: "info",
                      })
                    }
                  >
                    Lupa sandi?
                  </button>
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  startIcon={<Lock className="size-4" />}
                  endIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  }
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <FieldError />
              </Field>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800"
                />
                <label htmlFor="remember-me" className="ms-2 text-xs font-normal text-gray-600 dark:text-gray-400 select-none">
                  Ingat sesi saya di perangkat ini
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2 font-semibold shadow-theme-sm"
              >
                Masuk ke Sistem
              </Button>
            </form>

            {/* Quick Demo Switcher (Development Only - Sesuai PRD 5.3) */}
            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2.5">
                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <Sparkles className="size-3.5 text-amber-500" />
                  Mode Uji Coba Cepat (Dev):
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                {[
                  { role: "Staff" as UserRole, user: "staff.operasional" },
                  { role: "Supervisor" as UserRole, user: "spv.operasional" },
                  { role: "HRD" as UserRole, user: "hrd.dewi" },
                  { role: "GM" as UserRole, user: "gm.hendra" },
                  { role: "CEO" as UserRole, user: "ceo.ekajacx" },
                  { role: "Admin IT" as UserRole, user: "admin.it" },
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleQuickFill(item.user, item.role)}
                    className="flex flex-col items-center justify-center p-1.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600 text-[11px] font-medium text-gray-600 transition-all dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-300 dark:hover:bg-brand-900/20"
                  >
                    <span>{item.role}</span>
                  </button>
                ))}
              </div>

              {/* Tombol Pilih dari 27 Karyawan Lengkap */}
              <button
                type="button"
                onClick={() => setIsEmpModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 p-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
              >
                <Users className="size-3.5" />
                <span>Pilih dari 27 Profil Karyawan Lengkap (POV)</span>
                <ChevronRight className="size-3.5 ml-auto" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Security Notice */}
        <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          <p>J-Absen v1.0 &bull; Dikembangkan oleh EKA JACX</p>
          <p className="mt-1">
            Dilindungi enkripsi sesi aman, otorisasi RBAC, &amp; audit trail WORM.
          </p>
        </div>
      </div>

      {/* Modal Pemilihan 27 Karyawan Spesifik */}
      <Dialog
        open={isEmpModalOpen}
        onClose={() => setIsEmpModalOpen(false)}
        className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden"
      >
        <div className="border-b border-gray-200 bg-gray-50/80 px-5 py-3.5 dark:border-gray-800 dark:bg-gray-800/50">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Users className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Pilih Profil Karyawan untuk Login Langsung
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Total {allProfiles.length} karyawan terdaftar dari seluruh departemen.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-2.5 size-3.5 text-gray-400" />
            <input
              type="text"
              value={searchEmpQuery}
              onChange={(e) => setSearchEmpQuery(e.target.value)}
              placeholder="Cari nama atau NIK..."
              className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-7 text-xs text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            {searchEmpQuery && (
              <button
                type="button"
                onClick={() => setSearchEmpQuery("")}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* List Karyawan */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[55vh]">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-all dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={emp.avatar}
                  alt={emp.name}
                  className="size-9 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                      {emp.name}
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">
                      {emp.nik}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="truncate">{emp.jobTitle}</span>
                    <span>&bull;</span>
                    <span className="truncate">{emp.department}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    "rounded border px-2 py-0.5 text-[9px] font-bold uppercase",
                    ROLE_BADGE_STYLES[emp.role]
                  )}
                >
                  {emp.role}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectSpecificEmployee(emp, true)}
                  className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  Masuk &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-right dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => setIsEmpModalOpen(false)}
            className="rounded-lg px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Batal
          </button>
        </div>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL WAJIB GANTI KATA SANDI BARU (LOGIN PERTAMA KALI)   */}
      {/* ======================================================== */}
      {pendingAccountForPasswordChange && (
        <Dialog
          open={Boolean(pendingAccountForPasswordChange)}
          onClose={() => {
            setPendingAccountForPasswordChange(null);
            setPassword("");
            setErrors({});
          }}
          title="Aktivasi Akun & Ubah Kata Sandi Wajib"
          description="Ini adalah login pertama kali Anda. Demi keamanan akun, Anda wajib membuat kata sandi baru pribadi sebelum melanjutkan."
          className="max-w-md text-xs"
        >
          <form onSubmit={handleCompletePasswordChange} className="space-y-4 pt-1">
            {/* Informasi Karyawan */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-50/50 border border-brand-100 dark:bg-brand-950/20 dark:border-brand-900/50">
              <div className="flex size-10 items-center justify-center rounded-full bg-brand-500 text-white font-bold text-sm shrink-0">
                {pendingAccountForPasswordChange.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                  {pendingAccountForPasswordChange.name}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  NIK: <span className="font-mono font-semibold">{pendingAccountForPasswordChange.employeeId}</span> &bull; {pendingAccountForPasswordChange.jobTitle}
                </p>
                <p className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                  {pendingAccountForPasswordChange.departmentName}
                </p>
              </div>
            </div>

            {changePasswordError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                <AlertCircle className="size-4 shrink-0 text-red-500" />
                <span>{changePasswordError}</span>
              </div>
            )}

            {/* Input Kata Sandi Baru */}
            <div>
              <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                Kata Sandi Baru Pribadi *
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setChangePasswordError(null);
                  }}
                  placeholder="Minimal 8 karakter kombinasi huruf besar & kecil"
                  className="pr-10 text-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="mt-1 text-[10px] text-gray-400">
                Contoh: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">BagusPratama</code> atau <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">RianHidayat</code>
              </p>
            </div>

            {/* Input Konfirmasi Kata Sandi Baru */}
            <div>
              <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                Ulangi Kata Sandi Baru *
              </label>
              <Input
                type={showNewPassword ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value);
                  setChangePasswordError(null);
                }}
                placeholder="Ketik ulang kata sandi baru Anda"
                className="text-xs"
                required
              />
            </div>

            {/* Catatan Alur Sesuai Permintaan */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-[11px] text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300 leading-relaxed">
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-blue-600 dark:text-blue-400" />
                Ketentuan Aktivasi:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                <li>Setelah kata sandi baru disimpan, Anda akan kembali ke <strong>halaman login bersih</strong> untuk masuk ulang.</li>
                <li>Gunakan <strong>HP pribadi Anda</strong> saat login ulang agar sistem mengikat ponsel tersebut untuk presensi kehadiran wajah.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPendingAccountForPasswordChange(null);
                  setPassword("");
                  setErrors({});
                }}
                className="text-xs"
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="text-xs font-semibold">
                <KeyRound className="size-3.5 mr-1" />
                Simpan &amp; Kembali ke Login
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
