import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "10in10 - Gemeinsam abnehmen",
  description: "Tracke dein Gewicht, Training und Kalorien. Allein oder im Team.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0C0C1D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" data-theme="glass" data-font="prometo" className="h-full antialiased">
      <head>
        <link rel="stylesheet" href="/font-sets/prometo.css" />
        <link rel="stylesheet" href="/themes/glass.css" />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
