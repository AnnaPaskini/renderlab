"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{
        color: 'white',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #18181b 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{
          width: 48,
          height: 48,
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          fontSize: 24,
          fontWeight: 'bold'
        }}>
          R
        </div>

        <h2 style={{ fontSize: 28, marginBottom: 8, fontWeight: 600 }}>
          Oops! Something went wrong
        </h2>

        <p style={{ color: '#a1a1aa', marginBottom: 24, maxWidth: 400 }}>
          We're having trouble loading this page. Please try again or come back later.
        </p>

        <button
          onClick={() => reset()}
          style={{
            background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '14px 36px',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
          }}
        >
          Try again
        </button>

        <a
          href="/"
          style={{
            color: '#71717a',
            marginTop: 16,
            fontSize: 14,
            textDecoration: 'none'
          }}
        >
          ← Back to home
        </a>
      </body>
    </html>
  );
}
