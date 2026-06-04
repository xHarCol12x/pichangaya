import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PichangaLibre | Gestión Deportiva Inteligente con IA",
  description: "La plataforma definitiva para la gestión de centros deportivos. Optimización de reservas, analítica avanzada y automatización con IA.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PichangaLibre",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TransitionProvider } from "@/components/ui/TransitionOverlay";
import { SidebarProvider } from "@/context/SidebarContext";
import { VenueProvider } from "@/context/VenueContext";
import { LogoutProvider } from "@/context/LogoutContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <TransitionProvider>
            <LogoutProvider>
              <VenueProvider>
                <SidebarProvider>
                  {children}
                </SidebarProvider>
              </VenueProvider>
            </LogoutProvider>
          </TransitionProvider>
        </ThemeProvider>

        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('[PWA] SW registered:', reg.scope); })
                    .catch(function(err) { console.log('[PWA] SW failed:', err); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
