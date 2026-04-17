import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FieldIQ | Gestión Deportiva Inteligente con IA",
  description: "La plataforma definitiva para la gestión de centros deportivos. Optimización de reservas, analítica avanzada y automatización con IA.",
};
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TransitionProvider } from "@/components/ui/TransitionOverlay";
import { StripeProvider } from "@/components/providers/StripeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <StripeProvider>
            <TransitionProvider>
              {children}
            </TransitionProvider>
          </StripeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
