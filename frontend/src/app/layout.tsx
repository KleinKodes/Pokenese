import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_SC, Noto_Sans_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sc',
  display: 'swap',
});

const notoSansMono = Noto_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-noto-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pokenese — Learn Mandarin Through Pokémon',
  description:
    'A Wordle-style daily game that teaches Mandarin Chinese through Pokémon names. Guess the English name from the Chinese!',
  keywords: ['Pokémon', 'Mandarin', 'Chinese', 'language learning', 'Wordle', 'game'],
  openGraph: {
    title: 'Pokenese',
    description: 'Learn Mandarin through Pokémon names',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0F0F1A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${notoSansSC.variable} ${notoSansMono.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
