describe('Analytics helpers', () => {

  const mockTransactions = [
    {
      id: 'tx-001', type: 'worker_payout',
      amount: 1.00, netAmount: 0.94,
      platformFee: 0.05, status: 'confirmed',
      createdAt: new Date().toISOString(),
      task: { id: 'task-001', title: 'Test Task', category: 'Survey & Research' },
    },
    {
      id: 'tx-002', type: 'worker_payout',
      amount: 2.30, netAmount: 2.175,
      platformFee: 0.115, status: 'pending',
      createdAt: new Date().toISOString(),
      task: { id: 'task-002', title: 'Another Task', category: 'Content Review' },
    },
    {
      id: 'tx-003', type: 'worker_payout',
      amount: 0.50, netAmount: 0.465,
      platformFee: 0.025, status: 'confirmed',
      createdAt: new Date(Date.now() - 10 * 86400_000).toISOString(),
      task: null,
    },
  ]

  it('calculates total earned from confirmed transactions', () => {
    const total = mockTransactions
      .filter(t => t.status === 'confirmed')
      .reduce((sum, t) => sum + t.netAmount, 0)
    expect(total).toBeCloseTo(1.405)
  })

  it('calculates total pending from pending transactions', () => {
    const pending = mockTransactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.netAmount, 0)
    expect(pending).toBeCloseTo(2.175)
  })

  it('calculates this week earnings correctly', () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const thisWeek = mockTransactions
      .filter(t =>
        t.status === 'confirmed' &&
        new Date(t.createdAt) > oneWeekAgo
      )
      .reduce((sum, t) => sum + t.netAmount, 0)

    // Only tx-001 is confirmed and within 7 days
    expect(thisWeek).toBeCloseTo(0.94)
  })

  it('formats Pi amounts to 4 decimal places', () => {
    const format = (n: number) => `${n.toFixed(4)}π`
    expect(format(0.94)).toBe('0.9400π')
    expect(format(2.175)).toBe('2.1750π')
    expect(format(0)).toBe('0.0000π')
  })

  it('maps transaction types to readable labels', () => {
    const labels: Record<string, string> = {
      worker_payout:   'Payout',
      platform_fee:    'Fee',
      escrow_in:       'Escrow',
      refund:          'Refund',
      dispute_release: 'Dispute',
    }
    expect(labels['worker_payout']).toBe('Payout')
    expect(labels['platform_fee']).toBe('Fee')
  })
})

