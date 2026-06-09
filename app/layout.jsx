import { Inter } from 'next/font/google';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import ToastProvider from '@/components/ToastProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'DataDrop — Buy Cheap Data Instantly',
  description: 'Zero-friction Nigerian mobile data. No account needed.',
  themeColor: '#10b981',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className={`${inter.className} bg-zinc-950 min-h-screen`}>
        <ServiceWorkerRegistrar />
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
