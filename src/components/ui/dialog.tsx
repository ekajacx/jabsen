"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      // 1. Kunci total scroll latar belakang (baik di <body> maupun <html>)
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyPaddingRight = document.body.style.paddingRight;

      // Kompensasi lebar scrollbar agar halaman di belakang tidak "lompat" / shift layout
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  // Cek apakah dialog menggunakan kustomisasi khusus (misal: modal POV atau modal khusus yang sudah p-0)
  const isCustomLayout = className?.includes("p-0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200 overflow-hidden overscroll-contain">
      {/* Backdrop Gelap Blur dengan pencegahan scroll tembus */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card Berbatas Ketinggian Layar (max-h) & Scroll Internal */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-2xl sm:rounded-3xl border border-gray-200 bg-white shadow-theme-xl transition-all dark:border-gray-800 dark:bg-gray-900 overscroll-contain",
          className
        )}
      >
        {/* Tombol Tutup X Pinned */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex size-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          aria-label="Tutup Dialog"
        >
          <X className="size-4" />
        </button>

        {isCustomLayout ? (
          children
        ) : (
          <>
            {/* Header Dialog Fixed di Atas */}
            {(title || description) && (
              <div className="shrink-0 border-b border-gray-100 dark:border-gray-800/80 px-6 pt-5 pb-4">
                {title && (
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white pr-8">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 pr-8 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Scrollable Body Content dengan Scrollbar Cantik & Bebas Tembus Scroll */}
            <div className="flex-1 overflow-y-auto px-6 py-5 overscroll-contain [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
