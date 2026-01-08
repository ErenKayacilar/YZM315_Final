import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Header from "../components/Header";
import { ThemeProvider } from "../components/theme-provider";
import { I18nProvider } from "../components/I18nProvider";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LMS Platform",
  description: "Learning Management System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LMS Platform",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ServiceWorkerRegistration />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <I18nProvider>
            <AuthProvider>
              <Header />
              {children}
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
