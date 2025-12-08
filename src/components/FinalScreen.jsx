import React from 'react'

const FinalScreen = () => {
  return (
    <div className="final-screen">
      <div className="stars-background"></div>
      <div className="grid-overlay"></div>
      
      <div className="final-content">
        <div className="success-icon">✓</div>
        <h1 className="final-title">Thank You</h1>
        <p className="final-message">
          Your application has been received and is now in our review queue.
        </p>
        <div className="final-next-steps">
          <ul className="next-steps-list">
            <li>Jeff's team will review your answers shortly</li>
            <li>If there's a potential fit, we'll reach out once your application is processed</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default FinalScreen
