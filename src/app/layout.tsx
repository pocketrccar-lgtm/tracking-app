import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/bottom-nav";
import { QuickAddFab } from "@/components/quick-add-fab";
import PWAInstall from "@/components/pwa-install";

export const metadata: Metadata = {
  title: "Pocket RC Cars",
  description:
    "Pocket RC Cars sourcing OS — vendors, quotes, tasks & supply-side research. pokketrccar.com",
  manifest: "/manifest.json",
  applicationName: "Pocket RC Cars",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PRC Cars",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-full bg-[#f5f5f7] text-slate-900 antialiased text-[15px]">
        {/* Light theme only — no dark mode, forced. */}
        <ThemeProvider attribute="class" forcedTheme="light">
          <Toaster richColors position="top-center" />
          <main className="mx-auto max-w-lg min-h-full bg-white shadow-sm">
            {children}
          </main>
          <BottomNav />
          <QuickAddFab />
          <PWAInstall />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </body>
    </html>
  );
}
