import type { Metadata } from 'next'
import './globals.css'
import { PiPaymentProvider } from '@/contexts/PiPaymentContext'

export const metadata: Metadata = {
  title: 'Nexus',
  description: 'Earn Pi for real work. The Pi Network labor marketplace.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isSandbox = process.env.PI_SANDBOX === 'true'

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Nexus</title>
        <meta name="description" content="Earn Pi for real work. The Pi Network labor marketplace." />
        <link rel="icon" href="/favicon.ico" sizes="256x256" type="image/x-icon" />
        
        {/* Pi Network SDK — loads synchronously before page renders */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://sdk.minepi.com/pi-sdk.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                Pi.init({ version: "2.0", sandbox: ${isSandbox} });
                console.log('[Nexus] Pi SDK initialized. Sandbox: ${isSandbox}');
              } catch(e) {
                console.warn('[Nexus] Pi SDK init failed:', e.message);
              }
            `,
          }}
        />

        {/* Google Fonts — Inter and Fira Code */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap"
          rel="stylesheet"
        />

        {/* Global CSS Reset — transitions, focus ring, base styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          *, *::before, *::after {
            box-sizing: border-box;
            transition-property: background-color, border-color, color, box-shadow, opacity, transform;
            transition-duration: 150ms;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }

          :focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4);
            border-radius: 6px;
          }

          button:active {
            transform: scale(0.98);
          }

          a {
            color: inherit;
            text-decoration: none;
          }

          body {
            font-family: 'Inter', system-ui, sans-serif;
            background: #0F172A;
            color: #F1F5F9;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            margin: 0;
            padding: 0;
          }

          input, textarea, select {
            font-family: 'Inter', system-ui, sans-serif;
          }

          input::placeholder,
          textarea::placeholder {
            color: #64748B;
          }

          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }

          ::-webkit-scrollbar-track {
            background: #0F172A;
          }

          ::-webkit-scrollbar-thumb {
            background: #263348;
            border-radius: 3px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #334155;
          }
        `}} />
      </head>
      <body>
        <PiPaymentProvider>
          {children}
        </PiPaymentProvider>
      </body>
    </html>
  )
}
