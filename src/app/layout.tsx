import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { ModalProvider } from "@/context/modal-context";

export const metadata: Metadata = {
  title: "J-Absen | Sistem Absensi Karyawan Berbasis Wajah & Geofence",
  description: "Aplikasi absensi karyawan dengan verifikasi wajah, challenge liveness, dan validasi lokasi geofence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen font-sans bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <AuthProvider>
          <ModalProvider>{children}</ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
