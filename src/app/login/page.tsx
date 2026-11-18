"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, User, Lock, Eye, EyeOff, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, UserRole } from "@/context/auth-context";
import { NeuralBackground } from "@/components/ui/neural-background";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>(undefined);
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoginSuccess(null);

    // Validation
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      newErrors.username = "NIP atau Username wajib diisi";
    }
    if (!password) {
      newErrors.password = "Kata sandi wajib diisi";
    } else if (password.length < 4) {
      newErrors.password = "Kata sandi minimal 4 karakter";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Simulate login and redirect
    setIsLoading(true);
    setTimeout(() => {
      login(username, selectedRole);
      setIsLoading(false);
      setLoginSuccess(`Berhasil masuk sebagai ${username}! Mengalihkan ke Dashboard...`);
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    }, 800);
  };

  const handleQuickFill = (demoUser: string, role: UserRole) => {
    setUsername(demoUser);
    setPassword("password123");
    setSelectedRole(role);
    setErrors({});
    setLoginSuccess(null);
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
                  placeholder="Contoh: 20260101 atau admin.it"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setSelectedRole(undefined);
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
                    onClick={() => alert("Silakan hubungi Administrator IT atau HRD untuk mereset kata sandi.")}
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
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { role: "Staff" as UserRole, user: "staff.operasional" },
                  { role: "Supervisor" as UserRole, user: "spv.operasional" },
                  { role: "HRD" as UserRole, user: "hrd.admin" },
                  { role: "GM" as UserRole, user: "gm.operasional" },
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
    </div>
  );
}
