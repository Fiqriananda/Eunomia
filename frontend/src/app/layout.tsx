import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eunomia – Issue Tracking & Project Management',
  description:
    'The project management and issue tracker designed for high-performing engineering teams.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-[#090a0f] text-foreground flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
