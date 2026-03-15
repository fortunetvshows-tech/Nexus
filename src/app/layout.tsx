import type { Metadata } from 'next'
import Script from 'next/script'
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
        {/* Pi Network SDK — must load before any Pi.authenticate() calls */}
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="beforeInteractive"
        />
        <Script id="pi-sdk-init" strategy="beforeInteractive">
          {`Pi.init({ version: "2.0", sandbox: ${isSandbox} })`}
        </Script>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
