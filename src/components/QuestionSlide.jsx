import React, { useState, useEffect } from 'react'

// Function to interpolate color between cyan and purple based on progress
const getQuestionColor = (index, total) => {
  const progress = index / (total - 1) // 0 to 1
  const cyan = { r: 0, g: 243, b: 255 }
  const purple = { r: 176, g: 38, b: 255 }
  
  const r = Math.round(cyan.r + (purple.r - cyan.r) * progress)
  const g = Math.round(cyan.g + (purple.g - cyan.g) * progress)
  const b = Math.round(cyan.b + (purple.b - cyan.b) * progress)
  
  return `rgb(${r}, ${g}, ${b})`
}

// Country code mapping
const countryCodes = {
  // North America
  'US': { code: '+1', flag: '🇺🇸', name: 'US' },
  'CA': { code: '+1', flag: '🇨🇦', name: 'CA' },
  'MX': { code: '+52', flag: '🇲🇽', name: 'MX' },
  
  // Europe
  'UK': { code: '+44', flag: '🇬🇧', name: 'UK' },
  'DE': { code: '+49', flag: '🇩🇪', name: 'DE' },
  'FR': { code: '+33', flag: '🇫🇷', name: 'FR' },
  'IT': { code: '+39', flag: '🇮🇹', name: 'IT' },
  'ES': { code: '+34', flag: '🇪🇸', name: 'ES' },
  'NL': { code: '+31', flag: '🇳🇱', name: 'NL' },
  'BE': { code: '+32', flag: '🇧🇪', name: 'BE' },
  'CH': { code: '+41', flag: '🇨🇭', name: 'CH' },
  'AT': { code: '+43', flag: '🇦🇹', name: 'AT' },
  'SE': { code: '+46', flag: '🇸🇪', name: 'SE' },
  'NO': { code: '+47', flag: '🇳🇴', name: 'NO' },
  'DK': { code: '+45', flag: '🇩🇰', name: 'DK' },
  'FI': { code: '+358', flag: '🇫🇮', name: 'FI' },
  'PL': { code: '+48', flag: '🇵🇱', name: 'PL' },
  'PT': { code: '+351', flag: '🇵🇹', name: 'PT' },
  'IE': { code: '+353', flag: '🇮🇪', name: 'IE' },
  'GR': { code: '+30', flag: '🇬🇷', name: 'GR' },
  'CZ': { code: '+420', flag: '🇨🇿', name: 'CZ' },
  'HU': { code: '+36', flag: '🇭🇺', name: 'HU' },
  'RO': { code: '+40', flag: '🇷🇴', name: 'RO' },
  'BG': { code: '+359', flag: '🇧🇬', name: 'BG' },
  'HR': { code: '+385', flag: '🇭🇷', name: 'HR' },
  'SK': { code: '+421', flag: '🇸🇰', name: 'SK' },
  'SI': { code: '+386', flag: '🇸🇮', name: 'SI' },
  'EE': { code: '+372', flag: '🇪🇪', name: 'EE' },
  'LV': { code: '+371', flag: '🇱🇻', name: 'LV' },
  'LT': { code: '+370', flag: '🇱🇹', name: 'LT' },
  'LU': { code: '+352', flag: '🇱🇺', name: 'LU' },
  'MT': { code: '+356', flag: '🇲🇹', name: 'MT' },
  'CY': { code: '+357', flag: '🇨🇾', name: 'CY' },
  'IS': { code: '+354', flag: '🇮🇸', name: 'IS' },
  'RU': { code: '+7', flag: '🇷🇺', name: 'RU' },
  'UA': { code: '+380', flag: '🇺🇦', name: 'UA' },
  'TR': { code: '+90', flag: '🇹🇷', name: 'TR' },
  
  // Asia
  'CN': { code: '+86', flag: '🇨🇳', name: 'CN' },
  'JP': { code: '+81', flag: '🇯🇵', name: 'JP' },
  'IN': { code: '+91', flag: '🇮🇳', name: 'IN' },
  'KR': { code: '+82', flag: '🇰🇷', name: 'KR' },
  'SG': { code: '+65', flag: '🇸🇬', name: 'SG' },
  'MY': { code: '+60', flag: '🇲🇾', name: 'MY' },
  'TH': { code: '+66', flag: '🇹🇭', name: 'TH' },
  'PH': { code: '+63', flag: '🇵🇭', name: 'PH' },
  'ID': { code: '+62', flag: '🇮🇩', name: 'ID' },
  'VN': { code: '+84', flag: '🇻🇳', name: 'VN' },
  'HK': { code: '+852', flag: '🇭🇰', name: 'HK' },
  'TW': { code: '+886', flag: '🇹🇼', name: 'TW' },
  'AE': { code: '+971', flag: '🇦🇪', name: 'AE' },
  'SA': { code: '+966', flag: '🇸🇦', name: 'SA' },
  'IL': { code: '+972', flag: '🇮🇱', name: 'IL' },
  'NZ': { code: '+64', flag: '🇳🇿', name: 'NZ' },
  
  // South America
  'BR': { code: '+55', flag: '🇧🇷', name: 'BR' },
  'AR': { code: '+54', flag: '🇦🇷', name: 'AR' },
  'CL': { code: '+56', flag: '🇨🇱', name: 'CL' },
  'CO': { code: '+57', flag: '🇨🇴', name: 'CO' },
  'PE': { code: '+51', flag: '🇵🇪', name: 'PE' },
  
  // Africa
  'ZA': { code: '+27', flag: '🇿🇦', name: 'ZA' },
  'EG': { code: '+20', flag: '🇪🇬', name: 'EG' },
  'NG': { code: '+234', flag: '🇳🇬', name: 'NG' },
  'KE': { code: '+254', flag: '🇰🇪', name: 'KE' },
  
  // Oceania
  'AU': { code: '+61', flag: '🇦🇺', name: 'AU' }
}

// Function to detect country code from phone number
const detectCountryFromPhone = (phoneNumber) => {
  if (!phoneNumber) return null
  
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '')
  
  // Check if it starts with +
  if (cleaned.startsWith('+')) {
    // Try to match country codes (longest first to avoid false matches)
    // This ensures +358 (Finland) matches before +35 (which doesn't exist)
    const sortedCodes = Object.entries(countryCodes).sort((a, b) => b[1].code.length - a[1].code.length)
    
    for (const [country, data] of sortedCodes) {
      if (cleaned.startsWith(data.code)) {
        return country
      }
    }
  }
  
  return null
}

// Function to extract phone number without prefix
const extractPhoneWithoutPrefix = (phoneNumber, countryCode) => {
  if (!phoneNumber || !countryCode) return phoneNumber.replace(/[^\d]/g, '')
  
  const cleaned = phoneNumber.replace(/[^\d+]/g, '')
  const prefix = countryCodes[countryCode]?.code || ''
  
  if (cleaned.startsWith(prefix)) {
    return cleaned.substring(prefix.length)
  }
  
  // If it starts with + but not our prefix, try to detect
  if (cleaned.startsWith('+')) {
    const detected = detectCountryFromPhone(phoneNumber)
    if (detected && countryCodes[detected]) {
      return cleaned.substring(countryCodes[detected].code.length)
    }
    // Just remove the +
    return cleaned.substring(1)
  }
  
  // Remove all non-digits
  return cleaned
}

const QuestionSlide = ({ question, value, onAnswer, onNext, onBack, isFirst, isLast, questionIndex = 0, totalQuestions = 5 }) => {
  const questionColor = getQuestionColor(questionIndex, totalQuestions)
  const getInitialValue = () => {
    if (question.type === 'phone' || question.type === 'name' || question.type === 'contact-info') {
      return value || {}
    }
    if (question.multiSelect) {
      return Array.isArray(value) ? value : []
    }
    return value || ''
  }

  const [localValue, setLocalValue] = useState(getInitialValue())

  useEffect(() => {
    setLocalValue(getInitialValue())
  }, [value, question.type])

  const canProceed = () => {
    if (!question.required) return true
    if (question.type === 'name') {
      const nameVal = typeof localValue === 'object' ? localValue : {}
      return nameVal.firstName?.trim() && nameVal.lastName?.trim()
    }
    if (question.type === 'phone') {
      const phoneVal = typeof localValue === 'object' ? localValue : {}
      return phoneVal.phone?.trim() && phoneVal.country
    }
    if (question.type === 'contact-info') {
      const contactVal = typeof localValue === 'object' ? localValue : {}
      return contactVal.fullName?.trim() && contactVal.phone?.trim() && contactVal.email?.trim() && contactVal.country
    }
    if (question.multiSelect) {
      return Array.isArray(localValue) && localValue.length > 0
    }
    // For text and textarea inputs, ensure there's at least one non-whitespace character
    if (question.type === 'text' || question.type === 'textarea') {
      return typeof localValue === 'string' && localValue.trim().length > 0
    }
    // For email inputs, ensure it's a valid email format (basic validation)
    if (question.type === 'email') {
      if (typeof localValue !== 'string' || !localValue.trim()) return false
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(localValue.trim())
    }
    return localValue !== '' && localValue !== null && localValue !== undefined
  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle Enter key
      if (e.key !== 'Enter') return
      
      // Don't trigger if user is typing in a textarea (allow multi-line input)
      if (e.target.tagName === 'TEXTAREA') return
      
      // Don't trigger if user is in a select dropdown
      if (e.target.tagName === 'SELECT') return
      
      // Don't trigger if user is typing in an input field (for contact-info, allow normal input)
      // Only trigger Enter on contact-info if all fields are filled
      if (question.type === 'contact-info' && e.target.tagName === 'INPUT') {
        // Allow Enter to work only if form is complete
        if (canProceed()) {
          e.preventDefault()
          onNext()
        }
        return
      }
      
      // Only proceed if form is valid
      if (canProceed()) {
        e.preventDefault()
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [localValue, question.type, question.required, question.multiSelect, onNext])

  const handleChange = (newValue) => {
    setLocalValue(newValue)
    onAnswer(question.fieldName, newValue)
  }

  const handleScaleClick = (num) => {
    handleChange(num)
  }

  const handleOptionClick = (option) => {
    if (question.multiSelect) {
      const currentArray = Array.isArray(localValue) ? localValue : []
      const newArray = currentArray.includes(option)
        ? currentArray.filter(item => item !== option)
        : [...currentArray, option]
      handleChange(newArray)
    } else {
      handleChange(option)
      // Auto-advance to next question after selecting an option (for single-select)
      // For required single-select questions, any option selection is valid
      if (question.required || option) {
        setTimeout(() => {
          onNext()
        }, 150)
      }
    }
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
            style={{ borderColor: questionColor }}
            onFocus={(e) => e.target.style.boxShadow = `0 0 10px ${questionColor}50`}
            onBlur={(e) => e.target.style.boxShadow = 'none'}
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
                    style={localValue === num ? {
                      borderColor: questionColor,
                      background: `${questionColor}1a`,
                      boxShadow: `0 0 15px ${questionColor}50`,
                      color: questionColor
                    } : {
                      borderColor: `${questionColor}30`
                    }}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 'multiple-choice':
        const isMultiSelect = question.multiSelect
        const selectedValues = isMultiSelect 
          ? (Array.isArray(localValue) ? localValue : [])
          : [localValue]
        return (
          <div className="options-container">
            {isMultiSelect && (
              <p className="multi-select-hint">Choose as many as you like</p>
            )}
            {question.options.map((option, index) => {
              const isSelected = isMultiSelect
                ? selectedValues.includes(option)
                : localValue === option
              return (
                <button
                  key={index}
                  className={`option-button ${isSelected ? 'active' : ''}`}
                  onClick={() => handleOptionClick(option)}
                  style={isSelected ? {
                    borderColor: questionColor,
                    background: `${questionColor}1a`,
                    boxShadow: `0 0 15px ${questionColor}50`
                  } : {
                    borderColor: `${questionColor}30`
                  }}
                >
                  <span className="option-letter" style={{ color: questionColor }}>
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="option-text">{option}</span>
                </button>
              )
            })}
          </div>
        )

      case 'text':
        return (
          <input
            type="text"
            className="form-input"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            autoFocus
            style={{ borderColor: questionColor }}
            onFocus={(e) => e.target.style.boxShadow = `0 0 10px ${questionColor}50`}
            onBlur={(e) => e.target.style.boxShadow = 'none'}
          />
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
            style={{ borderColor: questionColor }}
            onFocus={(e) => e.target.style.boxShadow = `0 0 10px ${questionColor}50`}
            onBlur={(e) => e.target.style.boxShadow = 'none'}
          />
        )

      case 'phone':
        const phoneValue = typeof localValue === 'object' ? localValue : {}
        return (
          <div className="phone-container">
            <div className="phone-input-row">
              <select
                className="country-select contact-country-select"
                value={phoneValue.country || ''}
                onChange={(e) => {
                  const newCountry = e.target.value
                  handleChange({ ...phoneValue, country: newCountry })
                }}
                style={{ borderColor: questionColor }}
                onFocus={(e) => e.target.style.boxShadow = `0 0 10px ${questionColor}50`}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              >
                <option value="">Select Country</option>
                {Object.entries(countryCodes).map(([code, data]) => (
                  <option key={code} value={code}>
                    {data.flag} {data.name} ({data.code})
                  </option>
                ))}
              </select>
              <div className="phone-input-wrapper">
                {phoneValue.country && countryCodes[phoneValue.country] && (
                  <span 
                    className="phone-prefix clickable-prefix"
                    onClick={() => {
                      // Clear country when prefix is clicked
                      handleChange({ ...phoneValue, country: '', phone: phoneValue.phone || '' })
                    }}
                    title="Click to remove country selection"
                    style={{ color: questionColor }}
                  >
                    {countryCodes[phoneValue.country].code}
                  </span>
                )}
                <input
                  type="tel"
                  className="form-input contact-input phone-number-input"
                  value={(() => {
                    // If country is selected, show only the number part (prefix is shown separately)
                    if (phoneValue.country && countryCodes[phoneValue.country]) {
                      return phoneValue.phone || ''
                    }
                    // If no country selected, show the full input including + if present
                    return phoneValue.phone || ''
                  })()}
                  onKeyDown={(e) => {
                    // If backspace is pressed at the start of input and country is selected, clear country
                    if (e.key === 'Backspace' && phoneValue.country && countryCodes[phoneValue.country]) {
                      const input = e.target
                      if (input.selectionStart === 0 && input.selectionEnd === 0) {
                        // Cursor is at the beginning, clear the country
                        e.preventDefault()
                        handleChange({ ...phoneValue, country: '', phone: phoneValue.phone || '' })
                      }
                    }
                  }}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    let newCountry = phoneValue.country
                    let phoneValueInput = inputValue
                    
                    // Check if user is typing a number with + prefix
                    const cleaned = inputValue.replace(/[^\d+]/g, '')
                    
                    // If country is selected and user deletes everything, clear country
                    if (inputValue === '' && newCountry) {
                      newCountry = ''
                      phoneValueInput = ''
                    } else if (cleaned.startsWith('+')) {
                      // User typed a number starting with +
                      const detected = detectCountryFromPhone(inputValue)
                      
                      if (detected) {
                        // Country detected! Set it and extract the number part
                        newCountry = detected
                        const prefix = countryCodes[detected].code
                        // Remove the prefix and any formatting, keep only digits
                        phoneValueInput = cleaned.substring(prefix.length)
                      } else {
                        // + detected but country not recognized yet
                        // Keep the full input including + so user can see what they're typing
                        // Store the cleaned version (with +) so they can continue typing
                        phoneValueInput = cleaned
                        // Don't change country yet - wait for full match
                      }
                    } else if (inputValue && !newCountry) {
                      // User typing without + and no country selected
                      // Just store what they typed (digits)
                      phoneValueInput = cleaned
                    } else if (newCountry) {
                      // Country already selected, user typing number
                      // Remove any + they might have typed (since prefix is shown separately)
                      phoneValueInput = cleaned.replace(/\+/g, '')
                    } else {
                      // No country, no +, just digits
                      phoneValueInput = cleaned
                    }
                    
                    handleChange({ ...phoneValue, country: newCountry, phone: phoneValueInput })
                  }}
                  placeholder={phoneValue.country ? "Phone number" : "e.g., +31 6 12345678"}
                  style={{ borderColor: questionColor }}
                  onFocus={(e) => e.target.style.boxShadow = `0 0 10px ${questionColor}50`}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                  autoFocus
                />
              </div>
            </div>
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

      case 'contact-info':
        const contactValue = typeof localValue === 'object' ? localValue : {}
        return (
          <div className="contact-info-container">
            {question.disclaimer && (
              <p className="contact-disclaimer">{question.disclaimer}</p>
            )}
            <div className="contact-field-group">
              <label className="contact-label">First and Last name*</label>
              <input
                type="text"
                className="form-input contact-input"
                value={contactValue.fullName || ''}
                onChange={(e) => handleChange({ ...contactValue, fullName: e.target.value })}
                placeholder="Jane Smith"
                autoFocus
                style={{ borderColor: questionColor }}
                onFocus={(e) => e.target.style.boxShadow = `0 0 10px ${questionColor}50`}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>
            <div className="contact-field-group">
              <label className="contact-label">Phone number*</label>
              <div className="phone-input-row">
                <select
                  className="country-select contact-country-select"
                  value={contactValue.country || ''}
                  onChange={(e) => {
                    const newCountry = e.target.value
                    handleChange({ ...contactValue, country: newCountry })
                  }}
                  style={{ borderColor: questionColor }}
                  onFocus={(e) => e.target.style.boxShadow = `0 0 10px ${questionColor}50`}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                >
                  <option value="">Select Country</option>
                  {Object.entries(countryCodes).map(([code, data]) => (
                    <option key={code} value={code}>
                      {data.flag} {data.name} ({data.code})
                    </option>
                  ))}
                </select>
                <div className="phone-input-wrapper">
                  {contactValue.country && countryCodes[contactValue.country] && (
                    <span 
                      className="phone-prefix clickable-prefix"
                      onClick={() => {
                        // Clear country when prefix is clicked
                        handleChange({ ...contactValue, country: '', phone: contactValue.phone || '' })
                      }}
                      title="Click to remove country selection"
                      style={{ color: questionColor }}
                    >
                      {countryCodes[contactValue.country].code}
                    </span>
                  )}
                  <input
                    type="tel"
                    className="form-input contact-input phone-number-input"
                    value={(() => {
                      // If country is selected, show only the number part (prefix is shown separately)
                      if (contactValue.country && countryCodes[contactValue.country]) {
                        return contactValue.phone || ''
                      }
                      // If no country selected, show the full input including + if present
                      return contactValue.phone || ''
                    })()}
                    onKeyDown={(e) => {
                      // If backspace is pressed at the start of input and country is selected, clear country
                      if (e.key === 'Backspace' && contactValue.country && countryCodes[contactValue.country]) {
                        const input = e.target
                        if (input.selectionStart === 0 && input.selectionEnd === 0) {
                          // Cursor is at the beginning, clear the country
                          e.preventDefault()
                          handleChange({ ...contactValue, country: '', phone: contactValue.phone || '' })
                        }
                      }
                    }}
                    onChange={(e) => {
                      const inputValue = e.target.value
                      let newCountry = contactValue.country
                      let phoneValue = inputValue
                      
                      // Check if user is typing a number with + prefix
                      const cleaned = inputValue.replace(/[^\d+]/g, '')
                      
                      // If country is selected and user deletes everything, clear country
                      if (inputValue === '' && newCountry) {
                        newCountry = ''
                        phoneValue = ''
                      } else if (cleaned.startsWith('+')) {
                        // User typed a number starting with +
                        const detected = detectCountryFromPhone(inputValue)
                        
                        if (detected) {
                          // Country detected! Set it and extract the number part
                          newCountry = detected
                          const prefix = countryCodes[detected].code
                          // Remove the prefix and any formatting, keep only digits
                          phoneValue = cleaned.substring(prefix.length)
                        } else {
                          // + detected but country not recognized yet
                          // Keep the full input including + so user can see what they're typing
                          // Store the cleaned version (with +) so they can continue typing
                          phoneValue = cleaned
                          // Don't change country yet - wait for full match
                        }
                      } else if (inputValue && !newCountry) {
                        // User typing without + and no country selected
                        // Just store what they typed (digits)
                        phoneValue = cleaned
                      } else if (newCountry) {
                        // Country already selected, user typing number
                        // Remove any + they might have typed (since prefix is shown separately)
                        phoneValue = cleaned.replace(/\+/g, '')
                      } else {
                        // No country, no +, just digits
                        phoneValue = cleaned
                      }
                      
                      handleChange({ ...contactValue, country: newCountry, phone: phoneValue })
                    }}
                    placeholder={contactValue.country ? "Phone number" : "e.g., +31 6 12345678"}
                    style={{ borderColor: questionColor }}
                    onFocus={(e) => e.target.style.boxShadow = `0 0 10px ${questionColor}50`}
                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                  />
                </div>
              </div>
            </div>
            <div className="contact-field-group">
              <label className="contact-label">Email*</label>
              <input
                type="email"
                className="form-input contact-input"
                value={contactValue.email || ''}
                onChange={(e) => handleChange({ ...contactValue, email: e.target.value })}
                placeholder="name@example.com"
                style={{ borderColor: questionColor }}
                onFocus={(e) => e.target.style.boxShadow = `0 0 10px ${questionColor}50`}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="question-slide" style={{ '--question-color': questionColor }}>
      <div className="question-number" style={{ color: questionColor, textShadow: `0 0 10px ${questionColor}80` }}>
        Question {question.id}
      </div>
      <h1 className="question-text" style={{ color: questionColor }}>
        {question.question}
      </h1>
      {question.subtitle && (
        <p className="question-subtitle">{question.subtitle}</p>
      )}
      
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
          style={canProceed() ? {
            borderColor: questionColor,
            background: `linear-gradient(135deg, ${questionColor}33, ${questionColor}66)`
          } : {}}
        >
          {isLast ? 'Submit' : 'Next →'}
        </button>
      </div>
    </div>
  )
}

export default QuestionSlide
