import React, { useState, useEffect } from 'react'

const QuestionSlide = ({ question, value, onAnswer, onNext, onBack, isFirst, isLast }) => {
  const getInitialValue = () => {
    if (question.type === 'phone' || question.type === 'name') {
      return value || {}
    }
    return value || ''
  }

  const [localValue, setLocalValue] = useState(getInitialValue())

  useEffect(() => {
    setLocalValue(getInitialValue())
  }, [value, question.type])

  const handleChange = (newValue) => {
    setLocalValue(newValue)
    onAnswer(question.fieldName, newValue)
  }

  const handleScaleClick = (num) => {
    handleChange(num)
  }

  const handleOptionClick = (option) => {
    handleChange(option)
  }

  const canProceed = () => {
    if (!question.required) return true
    if (question.type === 'name') {
      const nameVal = typeof localValue === 'object' ? localValue : {}
      return nameVal.firstName && nameVal.lastName
    }
    if (question.type === 'phone') {
      const phoneVal = typeof localValue === 'object' ? localValue : {}
      return phoneVal.phone && phoneVal.country
    }
    return localValue !== '' && localValue !== null && localValue !== undefined
  }

  const handleNextClick = () => {
    if (canProceed()) {
      onNext()
    }
  }

  const renderInput = () => {
    switch (question.type) {
      case 'textarea':
        return (
          <textarea
            className="form-textarea"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            rows="6"
            autoFocus
          />
        )

      case 'scale':
        return (
          <div className="scale-container">
            <div className="scale-labels">
              <span className="scale-label">Low</span>
              <span className="scale-label">High</span>
            </div>
            <div className="scale-buttons">
              {Array.from({ length: question.max - question.min + 1 }, (_, i) => {
                const num = question.min + i
                return (
                  <button
                    key={num}
                    className={`scale-button ${localValue === num ? 'active' : ''}`}
                    onClick={() => handleScaleClick(num)}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 'multiple-choice':
        return (
          <div className="options-container">
            {question.options.map((option, index) => (
              <button
                key={index}
                className={`option-button ${localValue === option ? 'active' : ''}`}
                onClick={() => handleOptionClick(option)}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        )

      case 'email':
        return (
          <input
            type="email"
            className="form-input"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            autoFocus
          />
        )

      case 'phone':
        const phoneValue = typeof localValue === 'object' ? localValue : {}
        return (
          <div className="phone-container">
            <select
              className="country-select"
              value={phoneValue.country || ''}
              onChange={(e) => handleChange({ ...phoneValue, country: e.target.value })}
            >
              <option value="">Select Country</option>
              <option value="US">🇺🇸 US (+1)</option>
              <option value="UK">🇬🇧 UK (+44)</option>
              <option value="CA">🇨🇦 CA (+1)</option>
              <option value="AU">🇦🇺 AU (+61)</option>
              <option value="DE">🇩🇪 DE (+49)</option>
              <option value="FR">🇫🇷 FR (+33)</option>
              <option value="IT">🇮🇹 IT (+39)</option>
              <option value="ES">🇪🇸 ES (+34)</option>
              <option value="NL">🇳🇱 NL (+31)</option>
              <option value="BE">🇧🇪 BE (+32)</option>
              <option value="CH">🇨🇭 CH (+41)</option>
              <option value="AT">🇦🇹 AT (+43)</option>
              <option value="SE">🇸🇪 SE (+46)</option>
              <option value="NO">🇳🇴 NO (+47)</option>
              <option value="DK">🇩🇰 DK (+45)</option>
              <option value="FI">🇫🇮 FI (+358)</option>
              <option value="PL">🇵🇱 PL (+48)</option>
              <option value="PT">🇵🇹 PT (+351)</option>
              <option value="IE">🇮🇪 IE (+353)</option>
              <option value="GR">🇬🇷 GR (+30)</option>
              <option value="CZ">🇨🇿 CZ (+420)</option>
              <option value="HU">🇭🇺 HU (+36)</option>
              <option value="RO">🇷🇴 RO (+40)</option>
              <option value="BG">🇧🇬 BG (+359)</option>
              <option value="HR">🇭🇷 HR (+385)</option>
              <option value="SK">🇸🇰 SK (+421)</option>
              <option value="SI">🇸🇮 SI (+386)</option>
              <option value="EE">🇪🇪 EE (+372)</option>
              <option value="LV">🇱🇻 LV (+371)</option>
              <option value="LT">🇱🇹 LT (+370)</option>
              <option value="LU">🇱🇺 LU (+352)</option>
              <option value="MT">🇲🇹 MT (+356)</option>
              <option value="CY">🇨🇾 CY (+357)</option>
            </select>
            <input
              type="tel"
              className="form-input phone-input"
              value={phoneValue.phone || ''}
              onChange={(e) => handleChange({ ...phoneValue, phone: e.target.value })}
              placeholder="Phone number"
              autoFocus
            />
            {question.disclaimer && (
              <p className="phone-disclaimer">{question.disclaimer}</p>
            )}
          </div>
        )

      case 'name':
        const nameValue = typeof localValue === 'object' ? localValue : {}
        return (
          <div className="name-container">
            <input
              type="text"
              className="form-input name-input"
              value={nameValue.firstName || ''}
              onChange={(e) => handleChange({ ...nameValue, firstName: e.target.value })}
              placeholder="First name"
              autoFocus
            />
            <input
              type="text"
              className="form-input name-input"
              value={nameValue.lastName || ''}
              onChange={(e) => handleChange({ ...nameValue, lastName: e.target.value })}
              placeholder="Last name"
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="question-slide">
      <div className="question-number">Question {question.id}</div>
      <h1 className="question-text">{question.question}</h1>
      
      <div className="input-wrapper">
        {renderInput()}
      </div>

      <div className="navigation-buttons">
        {!isFirst && (
          <button className="nav-button back-button" onClick={onBack}>
            ← Back
          </button>
        )}
        <button
          className={`nav-button next-button ${!canProceed() ? 'disabled' : ''}`}
          onClick={handleNextClick}
          disabled={!canProceed()}
        >
          {isLast ? 'Submit' : 'Next →'}
        </button>
      </div>
    </div>
  )
}

export default QuestionSlide
