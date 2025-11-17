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
          Someone from our team will reach out in the next 24 hrs if you're eligible for an assessment.
        </p>
      </div>
    </div>
  )
}

export default FinalScreen
