import type { Metadata } from 'next'
import './globals.css'

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
        {/* Google Fonts — Inter and Fira Code */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap"
          rel="stylesheet"
        />
        
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
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
