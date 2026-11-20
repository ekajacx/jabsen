"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function AppLayout({ children, pageTitle = "Dashboard" }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const handleSetCollapsed = (val: boolean) => {
    setCollapsed(val);
    try {
      localStorage.setItem("sidebar_collapsed", String(val));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Desktop Sidebar & Mobile Drawer */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={handleSetCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Container */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          collapsed ? "lg:ml-20" : "lg:ml-64",
          // Add padding bottom for mobile bottom navigation bar
          "pb-20 lg:pb-8"
        )}
      >
        {/* Top Header */}
        <Header onMenuClick={() => setMobileOpen(true)} pageTitle={pageTitle} />

        {/* Content Area - Full width panel tanpa pembatas max-width */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav onOpenSidebar={() => setMobileOpen(true)} />
    </div>
  );
}
