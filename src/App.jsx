import React, { useState, useEffect } from 'react'
import QuestionSlide from './components/QuestionSlide'
import FinalScreen from './components/FinalScreen'
import './styles.css'

const STORAGE_KEY = 'wfc-application-progress'

// N8N Webhook URL - Replace with your actual webhook URL
// In development, use proxy to avoid CORS issues
// In production, use direct URL or environment variable
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 
  (import.meta.env.DEV 
    ? '/api/n8n/webhook-test/776bbd03-31ee-4092-aad8-5d91c668f7ae'
    : 'https://wayfindercollective.app.n8n.cloud/webhook-test/776bbd03-31ee-4092-aad8-5d91c668f7ae')

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

const questions = [
  {
    id: 1,
    type: 'textarea',
    question: "What area would you like Jeff's help with?",
    placeholder: "Tell us about the area where you'd like Jeff's help...",
    required: true,
    fieldName: 'lifeArea'
  },
  {
    id: 2,
    type: 'multiple-choice',
    question: 'How ready are you to make real changes in this area right now?',
    subtitle: '(Learning the priority level helps us understand your commitment)',
    options: [
      'Fully ready',
      'Very ready',
      'Somewhat ready',
      'Not ready at all'
    ],
    required: true,
    fieldName: 'readiness'
  },
  {
    id: 3,
    type: 'multiple-choice',
    question: "Which option describes your ability to invest in yourself right now?",
    options: [
      "I'm fully able to invest right now if it's the right fit",
      "I can invest, but I may need some flexibility or planning",
      "I want to invest, but I'm currently limited",
      "I'm not able to invest at this time"
    ],
    required: true,
    fieldName: 'investmentReadiness'
  },
  {
    id: 4,
    type: 'multiple-choice',
    question: "What's your current income in USD ($), per month?",
    subtitle: '(Please be honest, as it helps us understand what solutions are available to you)',
    options: [
      '$100k+ Per Month',
      '$10-100k Per Month',
      '$5-10k Per Month',
      '$3-5k Per Month',
      '$1-3k Per Month',
      '$0-1k Per Month'
    ],
    required: true,
    fieldName: 'income'
  },
  {
    id: 5,
    type: 'text',
    question: "What's your first and last name?",
    placeholder: 'First and last name',
    required: true,
    fieldName: 'fullName'
  },
  {
    id: 6,
    type: 'email',
    question: "What's your email address?",
    placeholder: 'your.email@example.com',
    required: true,
    fieldName: 'email'
  },
  {
    id: 7,
    type: 'phone',
    question: "What's your phone number?",
    required: true,
    fieldName: 'phone',
    disclaimer: 'By providing a telephone number and submitting this form you are consenting to be contacted by SMS, phone call, and/or WhatsApp. Message & data rates may apply. You can reply STOP to opt-out of further messaging.'
  }
]

function App() {
  // Load saved progress from localStorage on mount
  const loadSavedProgress = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          currentSlide: parsed.currentSlide || 0,
          formData: parsed.formData || {},
          isSubmitted: parsed.isSubmitted || false
        }
      }
    } catch (error) {
      console.error('Error loading saved progress:', error)
    }
    return {
      currentSlide: 0,
      formData: {},
      isSubmitted: false
    }
  }

  const savedState = loadSavedProgress()
  // Don't restore submitted state from localStorage - always start fresh
  const [currentSlide, setCurrentSlide] = useState(savedState.currentSlide || 0)
  const [formData, setFormData] = useState(savedState.formData || {})
  const [isSubmitted, setIsSubmitted] = useState(false) // Always start as false
  const [isBouncing, setIsBouncing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Save progress to localStorage whenever formData or currentSlide changes
  useEffect(() => {
    if (!isSubmitted) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          currentSlide,
          formData,
          isSubmitted
        }))
      } catch (error) {
        console.error('Error saving progress:', error)
      }
    }
  }, [currentSlide, formData, isSubmitted])

  // Clear saved progress when form is submitted
  useEffect(() => {
    if (isSubmitted) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [isSubmitted])

  // Inactivity detection - bounce animation after 10 seconds (repeating)
  useEffect(() => {
    if (isSubmitted) return

    let inactivityTimer
    let bounceInterval

    const startBounceCycle = () => {
      // Clear any existing timers
      clearTimeout(inactivityTimer)
      
      // Set timer for 10 seconds of inactivity
      inactivityTimer = setTimeout(() => {
        setIsBouncing(true)
        
        // After bounce completes (2 seconds), smoothly stop and repeat cycle
        setTimeout(() => {
          setIsBouncing(false)
          // Small delay to allow smooth transition before restarting cycle
          setTimeout(() => {
            // If still no interaction, start the cycle again
            startBounceCycle()
          }, 100)
        }, 2000)
      }, 10000) // 10 seconds of inactivity
    }

    // Track user interactions
    const handleInteraction = () => {
      setIsBouncing(false)
      clearTimeout(inactivityTimer)
      // Restart the cycle
      startBounceCycle()
    }

    // Start the cycle
    startBounceCycle()

    // Listen for various user interactions
    window.addEventListener('mousedown', handleInteraction)
    window.addEventListener('keydown', handleInteraction)
    window.addEventListener('scroll', handleInteraction)
    window.addEventListener('touchstart', handleInteraction)
    window.addEventListener('mousemove', handleInteraction)

    return () => {
      clearTimeout(inactivityTimer)
      clearTimeout(bounceInterval)
      window.removeEventListener('mousedown', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('scroll', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('mousemove', handleInteraction)
    }
  }, [currentSlide, isSubmitted])

  const handleAnswer = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleNext = () => {
    if (currentSlide < questions.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleSubmit = async () => {
    // Prepare data for N8N/Pipedrive
    // Extract contact info from separate fields
    const fullName = formData.fullName || ''
    // Split fullName into first and last name
    const nameParts = fullName.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    const email = formData.email || ''
    const phoneData = formData.phone || {}
    const phone = phoneData.phone || ''
    const phoneCountry = phoneData.country || ''
    
    // Format phone number for Pipedrive (add spaces for better recognition)
    const formatPhoneForPipedrive = (country, phone) => {
      if (!country || !phone) return ''
      const countryCode = countryCodes[country]?.code || ''
      if (!countryCode) return phone
      
      // Format Dutch numbers: +31 6 12345678
      if (country === 'NL' && phone.startsWith('6')) {
        return `${countryCode} ${phone.substring(0, 1)} ${phone.substring(1)}`
      }
      
      // Format US/Canada: +1 (555) 123-4567
      if ((country === 'US' || country === 'CA') && phone.length === 10) {
        return `${countryCode} (${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`
      }
      
      // Default: add space after country code for better recognition
      return `${countryCode} ${phone}`
    }
    
    const submissionData = {
      // Contact Information (for Pipedrive Person)
      name: `${firstName} ${lastName}`.trim(), // Full name
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone, // Phone without country code
      phoneCountry: phoneCountry, // Country code (e.g., 'US', 'NL')
      fullPhone: formatPhoneForPipedrive(phoneCountry, phone), // Formatted phone for Pipedrive
      
      // Survey Answers (for Pipedrive Deal custom fields)
      helpArea: formData.lifeArea || '', // Alias for lifeArea
      lifeArea: formData.lifeArea || '', // Which area do you want Jeff's help with most?
      
      readiness: formData.readiness || '', // How ready are you to make real changes in this area right now?
      urgency: formData.readiness || '', // Alias for readiness (backward compatibility)
      priority: formData.readiness || '', // Alias for readiness (backward compatibility)
      
      willingnessToInvest: formData.investmentReadiness || '', // Alias for investmentReadiness
      investmentReadiness: formData.investmentReadiness || '', // If you were given the right solution, would you be willing to invest?
      
      income: formData.income || '', // What's your current income in USD ($), per month?
      
      // Metadata
      submittedAt: new Date().toISOString(),
      timestamp: Date.now()
    }

    console.log('Form Data for N8N/Pipedrive:', JSON.stringify(submissionData, null, 2))
    
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Check if webhook URL is configured
      if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL === 'YOUR_N8N_WEBHOOK_URL_HERE') {
        console.warn('N8N Webhook URL not configured. Using test mode.')
        // In test mode, just log and proceed
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
        setIsSubmitted(true)
        return
      }

      // Send to N8N webhook
      console.log('Sending to webhook:', N8N_WEBHOOK_URL)
      console.log('Payload:', submissionData)
      
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      })

      console.log('Response status:', response.status, response.statusText)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        let errorText = ''
        try {
          errorText = await response.text()
        } catch (e) {
          errorText = 'Could not read error response'
        }
        console.error('Webhook error response:', errorText)
        throw new Error(`Submission failed: ${response.status} ${response.statusText}. ${errorText.substring(0, 200)}`)
      }

      let result
      try {
        result = await response.json()
      } catch (e) {
        // Some webhooks return empty or non-JSON responses - that's OK
        result = { success: true, message: 'Submitted successfully' }
      }
      console.log('N8N Webhook Response:', result)
      
      setIsSubmitted(true)
      setIsSubmitting(false)
    } catch (error) {
      console.error('Error submitting form to N8N:', error)
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      
      // More user-friendly error message
      let errorMessage = 'Failed to submit form. '
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage += 'Please check your internet connection and try again.'
      } else if (error.message.includes('CORS')) {
        errorMessage += 'Connection blocked. Please contact support.'
      } else if (error.message.includes('404') || error.message.includes('not registered')) {
        errorMessage += 'The webhook is not activated. Please activate it in n8n by clicking "Execute workflow" on the webhook node, then try again.'
      } else {
        errorMessage += error.message || 'Please try again.'
      }
      
      setSubmitError(errorMessage)
      setIsSubmitting(false)
      // Don't set isSubmitted to true on error, so user can retry
    }
  }

  if (isSubmitted) {
    return <FinalScreen />
  }

  const currentQuestion = questions[currentSlide]
  const progress = ((currentSlide + 1) / questions.length) * 100

  return (
    <div className="app-container">
      <div className="stars-background"></div>
      <div className="grid-overlay"></div>
      
      <div 
        className={`form-container ${isBouncing ? 'bounce-attention' : ''}`}
        style={{
          borderColor: (() => {
            const progress = currentSlide / (questions.length - 1)
            const cyan = { r: 0, g: 243, b: 255 }
            const purple = { r: 176, g: 38, b: 255 }
            const r = Math.round(cyan.r + (purple.r - cyan.r) * progress)
            const g = Math.round(cyan.g + (purple.g - cyan.g) * progress)
            const b = Math.round(cyan.b + (purple.b - cyan.b) * progress)
            return `rgba(${r}, ${g}, ${b}, 0.2)`
          })(),
          boxShadow: (() => {
            const progress = currentSlide / (questions.length - 1)
            const cyan = { r: 0, g: 243, b: 255 }
            const purple = { r: 176, g: 38, b: 255 }
            const r = Math.round(cyan.r + (purple.r - cyan.r) * progress)
            const g = Math.round(cyan.g + (purple.g - cyan.g) * progress)
            const b = Math.round(cyan.b + (purple.b - cyan.b) * progress)
            return `0 0 20px rgba(${r}, ${g}, ${b}, 0.5), 0 0 40px rgba(${r}, ${g}, ${b}, 0.3), 0 0 100px rgba(0, 0, 0, 0.8)`
          })()
        }}
      >
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="slide-container">
          {submitError && (
            <div className="error-message" style={{ 
              marginBottom: '20px',
              padding: '20px',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              border: '2px solid #ff4444',
              borderRadius: '8px',
              color: '#ff4444'
            }}>
              <p style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>⚠️ {submitError}</p>
              <button 
                onClick={() => {
                  setSubmitError(null)
                  handleSubmit()
                }}
                className="retry-button"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Retry Submission
              </button>
            </div>
          )}
          <QuestionSlide
            question={currentQuestion}
            value={formData[currentQuestion.fieldName]}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onBack={handleBack}
            isFirst={currentSlide === 0}
            isLast={currentSlide === questions.length - 1}
            totalQuestions={questions.length}
            questionIndex={currentSlide}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  )
}

export default App
