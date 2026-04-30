import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { PiPaymentProvider } from '@/contexts/PiPaymentContext'
import { ConditionalNav } from '@/components/ConditionalNav'

export const metadata: Metadata = {
  title: 'ProofGrid',
  description: 'ProofGrid — Decentralized Work Marketplace on Pi Network',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isSandbox = (process.env.NEXT_PUBLIC_PI_SANDBOX ?? process.env.PI_SANDBOX) === 'true'

  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ProofGrid</title>
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
                console.log('[ProofGrid] Pi SDK initialized. Sandbox: ${isSandbox}');
              } catch(e) {
                console.warn('[ProofGrid] Pi SDK init failed:', e.message);
              }
            `,
          }}
        />

        {/* Tailwind is built via PostCSS (`@import "tailwindcss"` in `globals.css`) */}

        {/* Google Fonts — DM Sans, Bebas Neue, IBM Plex Mono, Space Grotesk, Manrope */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@300..700&family=Manrope:wght@200..800&display=swap"
          rel="stylesheet"
        />

        {/* Material Symbols */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
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
            font-family: 'Manrope', sans-serif;
            background: #07090E;
            color: #e2e2ea;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
          }

          html, body {
            height: 100%;
            width: 100%;
          }

          html {
            background: #07090E;
          }

          @keyframes breathe {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }

          @keyframes gemIn {
            0% { opacity: 0; transform: scale(0.96) translateY(-8px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }

          @keyframes slideInUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }

          input, textarea, select {
            font-family: inherit;
          }

          input[type="checkbox"] {
            cursor: pointer;
            accent-color: #0095FF;
          }

          scrollbar-width: thin;
          scrollbar-color: rgba(136, 146, 168, 0.4) transparent;
          
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }

          ::-webkit-scrollbar-track {
            background: transparent;
          }

          ::-webkit-scrollbar-thumb {
            background: rgba(136, 146, 168, 0.4);
            border-radius: 3px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: rgba(136, 146, 168, 0.6);
          }

          .hide-mobile {
            display: none;
          }

          .show-mobile {
            display: block;
          }

          @media (min-width: 768px) {
            .hide-mobile {
              display: block;
            }

            .show-mobile {
              display: none;
            }
          }
        ` }} />

        {/* Meta tags for PWA */}
        <meta name="theme-color" content="#07090E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ProofGrid" />
      </head>

      <body>
        <PiPaymentProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {children}
            <ConditionalNav />
          </div>
        </PiPaymentProvider>
      </body>
    </html>
  )
}


