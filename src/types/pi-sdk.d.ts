// Type declarations for Pi Network SDK
// SDK loads via script tag: https://sdk.minepi.com/pi-sdk.js
// No npm package exists — these types are hand-maintained

interface PiAuthResult {
  accessToken: string
  user: {
    uid: string
    username?: string
  }
}

interface PiPaymentData {
  amount: number
  memo: string
  metadata: Record<string, unknown>
}

interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void
  onReadyForServerCompletion: (paymentId: string, txid: string) => void
  onCancel: (paymentId: string) => void
  onError: (error: Error, payment?: unknown) => void
}

interface PiSDK {
  authenticate(
    scopes: string[],
    onIncompletePaymentFound: (payment: unknown) => void
  ): Promise<PiAuthResult>
  createPayment(
    paymentData: PiPaymentData,
    callbacks: PiPaymentCallbacks
  ): Promise<unknown>
  init(config: { version: string; sandbox?: boolean }): void
}

declare global {
  interface Window {
    Pi: PiSDK
  }
}

export {}

