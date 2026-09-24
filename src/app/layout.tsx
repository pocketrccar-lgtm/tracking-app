import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/bottom-nav";
import PWAInstall from "@/components/pwa-install";
import { VerticalSwitcher } from "@/components/vertical-switcher";
import { getVerticals, getVerticalId } from "@/lib/vertical";

export const metadata: Metadata = {
  title: "Sourcing OS",
  description:
    "Sourcing OS — vendors, quotes, tasks & supply-side research, one category at a time (Pocket RC, EV Scooters).",
  manifest: "/manifest.json",
  applicationName: "Sourcing OS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sourcing OS",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [verticals, current] = await Promise.all([getVerticals(), getVerticalId()]);
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-full bg-[#f5f5f7] text-slate-900 antialiased text-[15px]">
        {/* Light theme only — no dark mode, forced. */}
        <ThemeProvider attribute="class" forcedTheme="light">
          <Toaster richColors position="top-center" />
          <main className="mx-auto max-w-lg min-h-full bg-white shadow-sm">
            <VerticalSwitcher verticals={verticals} current={current} />
            {children}
          </main>
          <BottomNav />
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
