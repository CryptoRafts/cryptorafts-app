export default function LoginSimplePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid #333',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '30px' }}>
          LOGIN FORM - WORKING!
        </h1>
        
        <div style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
          <p>This is a simple login form that should definitely show up.</p>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input
            type="email"
            placeholder="Email"
            style={{
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid #333',
              borderRadius: '8px',
              color: 'white'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            style={{
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid #333',
              borderRadius: '8px',
              color: 'white'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            LOGIN
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href="/signup" style={{ color: '#60a5fa' }}>
            Go to Signup
          </a>
        </div>
      </div>
    </div>
  );
}
