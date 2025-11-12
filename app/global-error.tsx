"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ color: 'white', background: '#18181b', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ fontSize: 32, marginBottom: 16 }}>Something went wrong</h2>
        <pre style={{ color: '#ff6b35', marginBottom: 24 }}>{error?.message || 'Unknown error'}</pre>
        <button onClick={() => reset()} style={{ background: '#ff6b35', color: 'white', border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 18, cursor: 'pointer' }}>
          Try again
        </button>
      </body>
    </html>
  );
}
