import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NightGuard — Wi-Fi Digital Wellbeing & Device Access Management',
  description:
    'Control internet access and digital usage schedules for selected devices on your existing Wi-Fi network without external hardware.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-graphite-950 text-warm-50 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
