"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ModalType = "success" | "error" | "warning" | "info" | "danger";

export interface AlertOptions {
  title?: string;
  message: string;
  type?: ModalType;
  buttonText?: string;
  onClose?: () => void;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ModalContextType {
  showAlert: (options: AlertOptions | string) => void;
  showConfirm: (options: ConfirmOptions) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType>({
  showAlert: () => {},
  showConfirm: () => {},
  closeModal: () => {},
});

export function useModal() {
  return useContext(ModalContext);
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    isConfirm: boolean;
    title: string;
    message: string;
    type: ModalType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    onClose?: () => void;
  }>({
    isOpen: false,
    isConfirm: false,
    title: "",
    message: "",
    type: "info",
  });

  const closeModal = useCallback(() => {
    if (modalState.onClose) {
      modalState.onClose();
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, [modalState]);

  const showAlert = useCallback((options: AlertOptions | string) => {
    const opts: AlertOptions =
      typeof options === "string" ? { message: options } : options;

    let defaultTitle = "Pemberitahuan Sistem";
    const type = opts.type || "info";

    if (type === "success") defaultTitle = "Operasi Berhasil";
    else if (type === "error" || type === "danger") defaultTitle = "Peringatan Sistem";
    else if (type === "warning") defaultTitle = "Perhatian";

    setModalState({
      isOpen: true,
      isConfirm: false,
      title: opts.title || defaultTitle,
      message: opts.message,
      type,
      confirmText: opts.buttonText || "Mengerti & Lanjutkan",
      onClose: opts.onClose,
    });
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions) => {
    setModalState({
      isOpen: true,
      isConfirm: true,
      title: options.title || "Konfirmasi Tindakan",
      message: options.message,
      type: options.type || "warning",
      confirmText: options.confirmText || "Ya, Lanjutkan",
      cancelText: options.cancelText || "Batal",
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    });
  }, []);

  // Global Interceptor untuk window.alert bawaan browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalAlert = window.alert;

      window.alert = (msg?: any) => {
        const text = typeof msg === "string" ? msg : String(msg ?? "");
        let type: ModalType = "info";
        let title = "Pemberitahuan Sistem";

        if (/berhasil|disetujui|sukses|lolos|valid/i.test(text)) {
          type = "success";
          title = "Aksi Berhasil";
        } else if (/gagal|ditolak|salah|error|tidak mencukupi|dilarang|minus/i.test(text)) {
          type = "error";
          title = "Akses / Tindakan Ditolak";
        } else if (/harap|wajib|perhatian|peringatan/i.test(text)) {
          type = "warning";
          title = "Perhatian";
        }

        showAlert({ title, message: text, type });
      };

      return () => {
        window.alert = originalAlert;
      };
    }
  }, [showAlert]);

  const handleConfirm = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (modalState.onCancel) {
      modalState.onCancel();
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalState.isOpen) {
        closeModal();
      }
    };
    if (modalState.isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalState.isOpen, closeModal]);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, closeModal }}>
      {children}

      {/* RENDER MODAL DIALOG TEMPLATE JIKA AKTIF */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop Blur Gelap */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />

          {/* Modal Card Berdasarkan Template J-Absen */}
          <div
            className="relative z-10 w-full max-w-sm sm:max-w-md rounded-3xl border border-gray-200 bg-white p-6 sm:p-7 text-center shadow-theme-2xl dark:border-gray-800 dark:bg-gray-900 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Tombol Tutup X */}
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
              aria-label="Tutup Dialog"
            >
              <X className="size-4" />
            </button>

            {/* Ikon Badge Cantik Sesuai Tipe */}
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl shadow-theme-xs">
              {modalState.type === "success" && (
                <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800">
                  <CheckCircle2 className="size-8 animate-in zoom-in-50 duration-300" />
                </div>
              )}
              {(modalState.type === "error" || modalState.type === "danger") && (
                <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800">
                  <XCircle className="size-8 animate-in zoom-in-50 duration-300" />
                </div>
              )}
              {modalState.type === "warning" && (
                <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800">
                  <AlertTriangle className="size-8 animate-in zoom-in-50 duration-300" />
                </div>
              )}
              {modalState.type === "info" && (
                <div className="flex size-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800">
                  <Info className="size-8 animate-in zoom-in-50 duration-300" />
                </div>
              )}
            </div>

            {/* Judul & Pesan Modal */}
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {modalState.title}
            </h3>
            <p className="mt-2.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {modalState.message}
            </p>

            {/* Action Buttons */}
            <div className="mt-6 pt-2">
              {modalState.isConfirm ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancel}
                    className="w-full text-xs font-semibold py-2.5 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    {modalState.cancelText || "Batal"}
                  </Button>
                  <Button
                    type="button"
                    variant={modalState.type === "danger" ? "destructive" : "default"}
                    onClick={handleConfirm}
                    className={cn(
                      "w-full text-xs font-semibold py-2.5 rounded-xl shadow-theme-xs",
                      modalState.type === "success" && "bg-emerald-600 hover:bg-emerald-700 text-white"
                    )}
                  >
                    {modalState.confirmText || "Ya, Lanjutkan"}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  onClick={closeModal}
                  className={cn(
                    "w-full text-xs font-semibold py-2.5 rounded-xl shadow-theme-xs",
                    modalState.type === "success" && "bg-emerald-600 hover:bg-emerald-700 text-white",
                    (modalState.type === "error" || modalState.type === "danger") && "bg-rose-600 hover:bg-rose-700 text-white"
                  )}
                >
                  {modalState.confirmText || "Mengerti & Lanjutkan"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}
