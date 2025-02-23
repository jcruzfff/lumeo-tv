import { Inter } from 'next/font/google';
import { TimerProvider } from '../contexts/TimerContext';
import { MediaProvider } from '../contexts/MediaContext';
import { PokerRoomProvider } from '../contexts/PokerRoomContext';

const inter = Inter({ subsets: ['latin'] });

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} bg-black text-white min-h-screen`}>
      <TimerProvider>
        <MediaProvider>
          <PokerRoomProvider>
            {children}
          </PokerRoomProvider>
        </MediaProvider>
      </TimerProvider>
    </div>
  );
} 