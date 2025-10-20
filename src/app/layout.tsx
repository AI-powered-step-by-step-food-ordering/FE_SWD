import "@/css/satoshi.css";
import "@/css/style.css";
import "@/css/animations.css";
import 'react-toastify/dist/ReactToastify.css';

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import LoadingProvider from "@/components/shared/LoadingProvider";
import { ToastContainer } from 'react-toastify';

export const metadata: Metadata = {
  title: {
    template: "%s | HealthyBowl - Smart Food Ordering",
    default: "HealthyBowl - Smart Food Ordering System",
  },
  description:
    "Step-by-step healthy food ordering system with AI-powered nutritional recommendations for office workers.",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      // { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="mask-icon" href="/icon.svg" color="#22C55E" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900" suppressHydrationWarning>
          <NextTopLoader color="#10B981" showSpinner={false} />
          <LoadingProvider>
            <main className="min-h-screen" suppressHydrationWarning>
              {children}
            </main>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </LoadingProvider>
      </body>
    </html>
  );
}
