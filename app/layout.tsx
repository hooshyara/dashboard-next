import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { AuthProvider } from '@/components/auth/auth-provider';
import { PermissionProvider } from '@/components/auth/permission-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { PwaManager } from '@/components/pwa/pwa-manager';
import './globals.css';
import localFont from 'next/font/local';

const yekanBakh = localFont({
  src: '../public/fonts/YekanBakhFaNum-VF.woff',
  display: 'swap',
});
export const metadata: Metadata = {
  title: 'تشریفات گلستان علی | سامانه مدیریت لجستیک',
  description: 'داشبورد مدیریت حمل و نقل و تحویل مرسولات - تشریفات گلستان علی',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.png',
        type: 'image/svg+xml',
      },
    ],
    apple: '/icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0C0C0C' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='fa'
      dir='rtl'
      className='bg-background'
      suppressHydrationWarning
    >
      <body className={`${yekanBakh.className}`}>
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          enableSystem={false}
          storageKey='theme'
        >
          <AuthProvider>
            <PermissionProvider>{children}</PermissionProvider>
          </AuthProvider>
          <PwaManager />
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
