import React from 'react'

const FinalScreen = () => {
  return (
    <div className="final-screen">
      <div className="stars-background"></div>
      <div className="grid-overlay"></div>
      
      <div className="final-content">
        <div className="success-icon">✓</div>
        <h1 className="final-title">Thank you.</h1>
        <p className="final-message">
          We have your answers. Jeff and the team review every application by hand.
        </p>
        <p className="final-message">
          If there is a fit, we will reach out with an invitation for an assessment call.
        </p>
        <p className="final-message" style={{ marginTop: '2em' }}>
          Most people feel a spike of fear and go back to sleep after they hit submit. That exact pattern is what we work on. If we reach out, treat it as a test. Show up for yourself.
        </p>
      </div>
    </div>
  )
}

export default FinalScreen
