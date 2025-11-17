import React, { useState } from 'react'
import QuestionSlide from './components/QuestionSlide'
import FinalScreen from './components/FinalScreen'
import './styles.css'

const questions = [
  {
    id: 1,
    type: 'textarea',
    question: 'Which area of your life do you want to improve most, and why?',
    placeholder: 'Tell us about what matters most to you...',
    required: true,
    fieldName: 'lifeArea'
  },
  {
    id: 2,
    type: 'scale',
    question: 'How much of a priority is this in your life?',
    min: 1,
    max: 10,
    required: true,
    fieldName: 'priority'
  },
  {
    id: 3,
    type: 'multiple-choice',
    question: 'Assuming you were provided a correct solution, would you invest financially in fixing this today?',
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
    question: "What's your current income in USD, per month?",
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
    type: 'email',
    question: "What's the best Email to contact you with?",
    placeholder: 'your.email@example.com',
    required: true,
    fieldName: 'email'
  },
  {
    id: 6,
    type: 'phone',
    question: "What's the best Phone number to reach out on?",
    disclaimer: 'By providing a telephone number and submitting this form you are consenting to be contacted by SMS text message. Message & data rates may apply. You can reply STOP to opt-out of further messaging.',
    required: true,
    fieldName: 'phone'
  },
  {
    id: 7,
    type: 'name',
    question: "What's your First and Last name?",
    required: true,
    fieldName: 'name'
  }
]

function App() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [formData, setFormData] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)

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
    // Extract phone and name data properly
    const phoneData = formData.phone || {}
    const nameData = formData.name || {}
    
    const submissionData = {
      // Question 1: Life Area
      lifeArea: formData.lifeArea || '',
      
      // Question 2: Priority (1-10)
      priority: formData.priority || '',
      
      // Question 3: Investment Readiness
      investmentReadiness: formData.investmentReadiness || '',
      
      // Question 4: Income Range
      income: formData.income || '',
      
      // Question 5: Email
      email: formData.email || '',
      
      // Question 6: Phone (structured for Pipedrive)
      phone: phoneData.phone || '',
      phoneCountry: phoneData.country || '',
      fullPhone: phoneData.country && phoneData.phone 
        ? `${phoneData.country}${phoneData.phone}` 
        : '',
      
      // Question 7: Name (structured for Pipedrive)
      firstName: nameData.firstName || '',
      lastName: nameData.lastName || '',
      fullName: nameData.firstName && nameData.lastName
        ? `${nameData.firstName} ${nameData.lastName}`
        : '',
      
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
      
      <div className="form-container">
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
          />
        </div>
      </div>
    </div>
  )
}

export default App
