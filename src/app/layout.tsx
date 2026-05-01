import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { PiPaymentProvider } from '@/contexts/PiPaymentContext'
import { ConditionalNav } from '@/components/ConditionalNav'

export const metadata: Metadata = {
  title: 'ProofGrid',
  description: 'ProofGrid — Decentralized Work Marketplace on Pi Network',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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

          @media (min-width: 1100px) {
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
          <div className="min-h-dvh bg-[#07090E] relative overflow-x-hidden">

            {/* Ambient glow background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
              <div style={{
                position: 'absolute',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(0,149,255,0.07) 0%, transparent 70%)',
                top: '-150px',
                left: '-100px',
                animation: 'drift1 20s ease-in-out infinite alternate',
              }} />
              <div style={{
                position: 'absolute',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)',
                bottom: '-80px',
                right: '-80px',
                animation: 'drift2 25s ease-in-out infinite alternate',
              }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='48'%3E%3Cpath d='M28 2L54 16v16L28 46 2 32V16z' fill='none' stroke='rgba(255,255,255,.025)' stroke-width='.5'/%3E%3C/svg%3E")`,
                backgroundSize: '56px 48px',
              }} />
            </div>

            {/* Content shell */}
            <div className="relative z-10 flex flex-col min-h-dvh">

              {/* Page content — responsive container */}
              <div className="flex-1 w-full mx-auto px-4 pb-24 sm:px-6 md:px-8 md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
                {children}
              </div>

            </div>

            {/* Bottom nav — always at bottom */}
            <ConditionalNav />

          </div>
        </PiPaymentProvider>
      </body>
    </html>
  )
}


