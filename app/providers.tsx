'use client';

import { SessionProvider } from 'next-auth/react';
import { TimerProvider } from './contexts/TimerContext';
import { MediaProvider } from './contexts/MediaContext';
import { PokerRoomProvider } from './contexts/PokerRoomContext';
import Sidebar from './components/Sidebar';
import { usePathname } from 'next/navigation';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isDisplayPage = pathname.startsWith('/display/');
  const isAuthPage = pathname.startsWith('/auth');

  // Don't show sidebar on landing, display, or auth pages
  const showSidebar = !isLandingPage && !isDisplayPage && !isAuthPage;

  return (
    <SessionProvider>
      <TimerProvider>
        <MediaProvider>
          <PokerRoomProvider>
            <div className="flex min-h-screen bg-[#1d1d1f]">
              {showSidebar && <Sidebar />}
              <main 
                className={`flex-1 min-h-screen  ${
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
  );
} 