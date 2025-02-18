import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#1d1d1f]  pl-4 border-l text-text-primary min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
