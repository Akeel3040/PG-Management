import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-context";
import { PropertyProvider } from "@/components/property-context";

export const metadata: Metadata = {
  title: "PG Management System | Modern Hostel & Co-living SaaS",
  description: "Enterprise SaaS platform for Paying Guest, Hostel, and Co-Living management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ThemeProvider defaultTheme="system" storageKey="pg-saas-theme">
          <AuthProvider>
            <PropertyProvider>{children}</PropertyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
