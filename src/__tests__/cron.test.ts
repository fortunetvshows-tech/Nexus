describe('Cron route authorization', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      CRON_SECRET: 'test-secret-123',
    }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  it('rejects requests without authorization header', async () => {
    const { GET } = await import(
      '@/app/api/cron/auto-approve/route'
    )
    const req = new Request(
      'http://localhost/api/cron/auto-approve'
    ) as unknown as import('next/server').NextRequest

    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('rejects requests with wrong secret', async () => {
    const { GET } = await import(
      '@/app/api/cron/auto-approve/route'
    )
    const req = new Request(
      'http://localhost/api/cron/auto-approve',
      {
        headers: {
          authorization: 'Bearer wrong-secret',
        },
      }
    ) as unknown as import('next/server').NextRequest

    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})
