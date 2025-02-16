import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TimerProvider } from "./contexts/TimerContext";
import { MediaProvider } from "./contexts/MediaContext";
import { PokerRoomProvider } from "./contexts/PokerRoomContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Timer Display App",
  description: "Real-time timer application with display mode for poker and basketball",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TimerProvider>
          <MediaProvider>
            <PokerRoomProvider>
              <main className="min-h-screen bg-gray-100">
                {children}
              </main>
            </PokerRoomProvider>
          </MediaProvider>
        </TimerProvider>
      </body>
    </html>
  );
}
