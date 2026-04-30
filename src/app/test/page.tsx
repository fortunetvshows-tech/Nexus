export default function TestPage() {
  return (
    <div style={{ backgroundColor: '#07090E', color: '#EEF2FF', width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✓ Page is loading!</h1>
        <p style={{ fontSize: '20px', marginBottom: '40px', color: '#8892A8' }}>If you see this, Next.js is working</p>
        <p style={{ fontSize: '16px', color: '#454F64' }}>
          <a href="/worker/app" style={{ color: '#0095FF', textDecoration: 'underline' }}>Click here to go to /worker/app</a>
        </p>
      </div>
    </div>
  )
}

