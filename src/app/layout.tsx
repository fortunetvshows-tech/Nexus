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
