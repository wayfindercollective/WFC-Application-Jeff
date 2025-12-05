import React, { useState, useEffect } from 'react'
import QuestionSlide from './components/QuestionSlide'
import FinalScreen from './components/FinalScreen'
import './styles.css'

const STORAGE_KEY = 'wfc-application-progress'

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
    type: 'multiple-choice',
    question: "Which area do you want Jeff's help with most?",
    options: [
      'Influence / Charisma',
      'Dating/Relationships',
      'Career',
      'Being more Assertive',
      'Other'
    ],
    required: true,
    fieldName: 'lifeArea'
  },
  {
    id: 2,
    type: 'multiple-choice',
    question: 'How important is it for you to change this, today?',
    subtitle: '(Learning the priority level helps us understand your commitment)',
    options: [
      'Extremely High Priority',
      'High Priority',
      'Medium Priority',
      'Low Priority'
    ],
    required: true,
    fieldName: 'priority'
  },
  {
    id: 3,
    type: 'multiple-choice',
    question: 'If you were given the right solution, would you be willing to invest in yourself to solve this?',
    options: [
      "I'm ready to invest in myself today",
      "I'd need to move funds around, but it's a priority",
      "I'd prefer to get free resources first"
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
    type: 'contact-info',
    question: 'Please add your contact information for the assessment with my team.',
    disclaimer: 'By providing a telephone number and submitting this form you are consenting to be contacted by SMS, phone call, and/or WhatsApp. Message & data rates may apply. You can reply STOP to opt-out of further messaging.',
    required: true,
    fieldName: 'contactInfo'
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
  const [currentSlide, setCurrentSlide] = useState(savedState.currentSlide)
  const [formData, setFormData] = useState(savedState.formData)
  const [isSubmitted, setIsSubmitted] = useState(savedState.isSubmitted)
  const [isBouncing, setIsBouncing] = useState(false)

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
    // Extract contact info data properly
    const contactData = formData.contactInfo || {}
    
    const submissionData = {
      // Question 1: Life Area (single selected option)
      lifeArea: formData.lifeArea || '',
      
      // Question 2: Priority Level
      priority: formData.priority || '',
      
      // Question 3: Investment Readiness
      investmentReadiness: formData.investmentReadiness || '',
      
      // Question 4: Income Range
      income: formData.income || '',
      
      // Question 5: Contact Information (structured for Pipedrive)
      fullName: contactData.fullName || '',
      phone: contactData.phone || '',
      phoneCountry: contactData.country || '',
      fullPhone: contactData.country && contactData.phone 
        ? `${countryCodes[contactData.country]?.code || ''}${contactData.phone}` 
        : '',
      email: contactData.email || '',
      
      // Metadata
      submittedAt: new Date().toISOString(),
      timestamp: Date.now()
    }

    console.log('Form Data for N8N/Pipedrive:', JSON.stringify(submissionData, null, 2))
    
    // Here you would send to your N8N webhook endpoint
    // Example:
    // try {
    //   const response = await fetch('YOUR_N8N_WEBHOOK_URL', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(submissionData)
    //   })
    //   if (!response.ok) throw new Error('Submission failed')
    // } catch (error) {
    //   console.error('Error submitting form:', error)
    //   // Handle error appropriately
    // }

    setIsSubmitted(true)
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
          />
        </div>
      </div>
    </div>
  )
}

export default App
