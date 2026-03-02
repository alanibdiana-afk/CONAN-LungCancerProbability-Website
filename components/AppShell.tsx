"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import PrivacyModal from "./PrivacyModal";
import OfflineBanner from "./OfflineBanner";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden app-shell-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <OfflineBanner />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
        </main>
      </div>
      <PrivacyModal />
    </div>
  );
}
