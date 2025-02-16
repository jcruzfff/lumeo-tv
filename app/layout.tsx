'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import Sidebar from './components/Sidebar';
import { TimerProvider } from './contexts/TimerContext';
import { MediaProvider } from './contexts/MediaContext';
import { PokerRoomProvider } from './contexts/PokerRoomContext';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isDisplayPage = pathname === '/display';
  const isAuthPage = pathname.startsWith('/auth');

  // Don't show sidebar on landing, display, or auth pages
  const showSidebar = !isLandingPage && !isDisplayPage && !isAuthPage;

  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#1d1d1f] pt-8 pl-4 border-l border-t border-[#2C2C2E] rounded-tl-lg text-text-primary min-h-screen`}>
        <SessionProvider>
          <TimerProvider>
            <MediaProvider>
              <PokerRoomProvider>
                <div className="flex min-h-screen bg-[#1d1d1f]">
                  {showSidebar && <Sidebar />}
                  <main 
                    className={`flex-1 min-h-screen ${
                      showSidebar ? 'ml-64' : ''
                    }  backdrop-blur-sm`}
                  >
                    {children}
                  </main>
                </div>
              </PokerRoomProvider>
            </MediaProvider>
          </TimerProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
