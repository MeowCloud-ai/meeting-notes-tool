import React from 'react'

/** Main application component */
export function App(): React.ReactElement {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🐱 MeowMeet</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>AI-powered Meeting Notes</p>
      <div
        style={{
          padding: '2rem',
          borderRadius: '12px',
          background: '#f5f5f5',
          maxWidth: '320px',
          margin: '0 auto'
        }}
      >
        <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>🎙️ Ready to record</p>
        <button
          style={{
            padding: '12px 32px',
            fontSize: '1rem',
            borderRadius: '8px',
            border: 'none',
            background: '#4CAF50',
            color: 'white',
            cursor: 'pointer'
          }}
          onClick={() => alert('Recording will be implemented in Task 3!')}
        >
          Start Recording
        </button>
      </div>
    </div>
  )
}
