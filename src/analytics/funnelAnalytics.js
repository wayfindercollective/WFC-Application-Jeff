/**
 * Funnel Analytics Module
 * 
 * Tracks user behavior through the application funnel and sends events to n8n.
 * This enables detailed drop-off analysis and conversion optimization.
 */

// Analytics webhook URL - separate from form submission webhook
const ANALYTICS_WEBHOOK_URL = import.meta.env.VITE_ANALYTICS_WEBHOOK_URL || 
  (import.meta.env.DEV 
    ? '/api/n8n/webhook/analytics'  // Dev proxy
    : 'https://wayfindercollective.app.n8n.cloud/webhook/funnel-analytics')

// Generate a unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

// Get or create session ID (persists for the browser session)
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('wfc_analytics_session')
  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem('wfc_analytics_session', sessionId)
  }
  return sessionId
}

// Get visitor ID (persists across sessions)
const getVisitorId = () => {
  let visitorId = localStorage.getItem('wfc_visitor_id')
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    localStorage.setItem('wfc_visitor_id', visitorId)
  }
  return visitorId
}

// Track timestamps for time calculations
// Store original timestamp and current visit timestamp separately
const questionTimestamps = {} // Original first view timestamp
const questionCurrentTimestamps = {} // Current visit timestamp (for back navigation)
let sessionStartTime = null
let lastQuestionIndex = -1
let sessionStartTracked = false // Prevent duplicate session_start on refresh
let submissionTracked = false // Prevent duplicate submissions

// Question labels for readable analytics
const QUESTION_LABELS = {
  0: 'Help Area',
  1: 'Commitment Level',
  2: 'Readiness',
  3: 'Investment Readiness',
  4: 'Income Level',
  5: 'Full Name',
  6: 'Email Address',
  7: 'Phone Number'
}

/**
 * Get basic device/browser info for segmentation
 */
const getDeviceInfo = () => {
  const ua = navigator.userAgent
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua)
  
  return {
    deviceType: isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop'),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    userAgent: ua.substring(0, 200), // Truncate for storage
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer: document.referrer || 'direct'
  }
}

/**
 * Get UTM parameters from URL
 */
const getUtmParams = () => {
  const urlParams = new URLSearchParams(window.location.search)
  return {
    utm_source: urlParams.get('utm_source') || '',
    utm_medium: urlParams.get('utm_medium') || '',
    utm_campaign: urlParams.get('utm_campaign') || '',
    utm_term: urlParams.get('utm_term') || '',
    utm_content: urlParams.get('utm_content') || ''
  }
}

/**
 * Store analytics event locally in localStorage
 */
const storeEventLocally = (payload) => {
  try {
    const storageKey = 'wfc_analytics_events'
    const existingEvents = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    // Add new event
    existingEvents.push(payload)
    
    // Keep only last 10,000 events to prevent storage bloat
    const trimmedEvents = existingEvents.slice(-10000)
    
    localStorage.setItem(storageKey, JSON.stringify(trimmedEvents))
    
    if (import.meta.env.DEV) {
      console.log('💾 Stored analytics event locally:', payload.eventType)
    }
  } catch (err) {
    // Silent fail - storage might be full or disabled
    if (import.meta.env.DEV) {
      console.warn('Failed to store analytics locally:', err.message)
    }
  }
}

/**
 * Send analytics event to n8n webhook
 */
const sendEvent = async (eventType, eventData) => {
  const payload = {
    // Event identification
    eventType,
    eventId: `${eventType}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
    
    // Session/Visitor tracking
    sessionId: getSessionId(),
    visitorId: getVisitorId(),
    
    // Event-specific data
    ...eventData,
    
    // Device info (on first event of session)
    ...(eventType === 'session_start' ? { deviceInfo: getDeviceInfo() } : {}),
    
    // UTM params (on first event)
    ...(eventType === 'session_start' ? { utmParams: getUtmParams() } : {})
  }
  
  // Always store locally for localhost analytics
  storeEventLocally(payload)
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('📊 Analytics Event:', eventType, payload)
  }
  
  // Send to webhook (fire and forget - don't block UI)
  try {
    // Use sendBeacon for reliability (especially on page close)
    if (eventType === 'drop_off' && navigator.sendBeacon) {
      navigator.sendBeacon(ANALYTICS_WEBHOOK_URL, JSON.stringify(payload))
    } else {
      fetch(ANALYTICS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true // Allows request to complete even if page closes
      }).catch(err => {
        // Silent fail - don't impact user experience
        if (import.meta.env.DEV) {
          console.warn('Analytics send failed:', err.message)
        }
      })
    }
  } catch (err) {
    // Silent fail
    if (import.meta.env.DEV) {
      console.warn('Analytics error:', err.message)
    }
  }
  
  return payload // Return for local storage/debugging
}

/**
 * Track session start
 */
export const trackSessionStart = () => {
  // Prevent duplicate session_start on page refresh
  if (sessionStartTracked) {
    return null
  }
  
  sessionStartTime = Date.now()
  sessionStartTracked = true
  
  return sendEvent('session_start', {
    url: window.location.href,
    deviceInfo: getDeviceInfo(),
    utmParams: getUtmParams()
  })
}

/**
 * Track when a question is viewed
 */
export const trackQuestionView = (questionIndex, questionFieldName) => {
  const now = Date.now()
  
  // Calculate time spent on previous question (use current timestamp if going back)
  let timeOnPreviousQuestion = null
  if (lastQuestionIndex >= 0 && lastQuestionIndex !== questionIndex) {
    const prevTimestamp = questionCurrentTimestamps[lastQuestionIndex] || questionTimestamps[lastQuestionIndex]
    if (prevTimestamp) {
      timeOnPreviousQuestion = now - prevTimestamp
    }
  }
  
  // Check if this is a revisit before updating timestamps
  const isRevisit = !!questionTimestamps[questionIndex]
  
  // Store original timestamp only if this is first time viewing this question
  if (!questionTimestamps[questionIndex]) {
    questionTimestamps[questionIndex] = now
  }
  
  // Always update current timestamp (for back navigation time tracking)
  questionCurrentTimestamps[questionIndex] = now
  lastQuestionIndex = questionIndex
  
  return sendEvent('question_view', {
    questionIndex,
    questionNumber: questionIndex + 1,
    questionLabel: QUESTION_LABELS[questionIndex] || `Question ${questionIndex + 1}`,
    questionFieldName,
    previousQuestionIndex: lastQuestionIndex >= 0 && lastQuestionIndex !== questionIndex ? lastQuestionIndex : null,
    timeOnPreviousQuestion,
    totalTimeInFunnel: sessionStartTime ? now - sessionStartTime : null,
    progressPercent: Math.round(((questionIndex + 1) / 8) * 100),
    isRevisit
  })
}

/**
 * Track when a question is answered (but not necessarily submitted)
 */
export const trackQuestionAnswered = (questionIndex, questionFieldName, answerType) => {
  const now = Date.now()
  const timeToAnswer = questionTimestamps[questionIndex] 
    ? now - questionTimestamps[questionIndex] 
    : null
  
  return sendEvent('question_answered', {
    questionIndex,
    questionNumber: questionIndex + 1,
    questionLabel: QUESTION_LABELS[questionIndex] || `Question ${questionIndex + 1}`,
    questionFieldName,
    answerType, // 'text', 'multiple-choice', 'email', 'phone', etc.
    timeToAnswer,
    progressPercent: Math.round(((questionIndex + 1) / 8) * 100)
  })
}

/**
 * Track progression to next question (answer was valid)
 */
export const trackQuestionCompleted = (questionIndex, questionFieldName) => {
  const now = Date.now()
  // Use current timestamp if available (for back navigation), otherwise original
  const startTimestamp = questionCurrentTimestamps[questionIndex] || questionTimestamps[questionIndex]
  const timeOnQuestion = startTimestamp ? now - startTimestamp : null
  
  return sendEvent('question_completed', {
    questionIndex,
    questionNumber: questionIndex + 1,
    questionLabel: QUESTION_LABELS[questionIndex] || `Question ${questionIndex + 1}`,
    questionFieldName,
    timeOnQuestion,
    totalTimeInFunnel: sessionStartTime ? now - sessionStartTime : null,
    progressPercent: Math.round(((questionIndex + 1) / 8) * 100),
    nextQuestionIndex: questionIndex + 1
  })
}

/**
 * Track going back to a previous question
 */
export const trackQuestionBack = (fromIndex, toIndex) => {
  return sendEvent('question_back', {
    fromQuestionIndex: fromIndex,
    toQuestionIndex: toIndex,
    fromQuestionLabel: QUESTION_LABELS[fromIndex],
    toQuestionLabel: QUESTION_LABELS[toIndex]
  })
}

/**
 * Track form submission (success)
 */
export const trackFormSubmitted = (formData) => {
  // Prevent duplicate submissions (double-click, network retry, etc.)
  if (submissionTracked) {
    console.warn('📊 Submission already tracked, ignoring duplicate')
    return null
  }
  
  const now = Date.now()
  submissionTracked = true
  
  // Mark drop-off as not applicable since they completed
  if (window.__wfc_analytics) {
    window.__wfc_analytics.dropOffTracked = true
  }
  
  return sendEvent('form_submitted', {
    totalTimeInFunnel: sessionStartTime ? now - sessionStartTime : null,
    questionsCompleted: 8,
    // Don't send sensitive data - just metadata
    hasEmail: !!formData.email,
    hasPhone: !!formData.phone,
    incomeLevel: formData.income || 'not_provided',
    readinessLevel: formData.readiness || 'not_provided',
    commitmentLevel: formData.commitment || 'not_provided'
  })
}

/**
 * Track form submission error
 */
export const trackSubmissionError = (errorMessage, questionIndex) => {
  return sendEvent('submission_error', {
    errorMessage: errorMessage?.substring(0, 200), // Truncate
    questionIndex,
    questionLabel: QUESTION_LABELS[questionIndex]
  })
}

/**
 * Track drop-off (page close/navigation away)
 * Called on beforeunload, visibilitychange, or inactivity
 */
export const trackDropOff = (lastViewedQuestionIndex, formData = {}) => {
  // Prevent duplicate drop-off tracking
  if (window.__wfc_analytics?.dropOffTracked) {
    return null
  }
  
  // Don't track drop-off if they already submitted
  if (submissionTracked) {
    return null
  }
  
  const now = Date.now()
  // Use current timestamp if available (for back navigation), otherwise original
  const lastQuestionStartTime = questionCurrentTimestamps[lastViewedQuestionIndex] || questionTimestamps[lastViewedQuestionIndex]
  const timeOnLastQuestion = lastQuestionStartTime ? now - lastQuestionStartTime : null
  
  // Calculate which questions were answered
  const answeredQuestions = Object.entries(formData)
    .filter(([key, value]) => {
      // Handle object values (like phone)
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v && v !== '')
      }
      return value && value !== ''
    })
    .map(([key]) => key)
  
  // Mark drop-off as tracked (prevent duplicates)
  window.__wfc_analytics = window.__wfc_analytics || {}
  window.__wfc_analytics.dropOffTracked = true
  
  return sendEvent('drop_off', {
    lastQuestionIndex: lastViewedQuestionIndex,
    lastQuestionNumber: lastViewedQuestionIndex + 1,
    lastQuestionLabel: QUESTION_LABELS[lastViewedQuestionIndex],
    timeOnLastQuestion,
    totalTimeInFunnel: sessionStartTime ? now - sessionStartTime : null,
    progressPercent: Math.round(((lastViewedQuestionIndex + 1) / 8) * 100),
    questionsAnswered: answeredQuestions.length,
    answeredFields: answeredQuestions
  })
}

/**
 * Initialize analytics - call once when app loads
 */
export const initAnalytics = () => {
  // Track session start
  trackSessionStart()
  
  // Store reference for drop-off tracking
  window.__wfc_analytics = {
    lastQuestionIndex: 0,
    formData: {}
  }
  
  // Track drop-offs on page close
  const handleBeforeUnload = () => {
    const { lastQuestionIndex, formData } = window.__wfc_analytics || {}
    // Only track drop-off if they haven't completed the form
    // Use current formData (it's updated via updateAnalyticsState)
    if (lastQuestionIndex !== undefined && lastQuestionIndex < 7 && !submissionTracked) {
      trackDropOff(lastQuestionIndex, formData || {})
    }
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  // Also track on visibility change (mobile browser tab switches)
  // But only if they've been inactive for a while (not just switching tabs briefly)
  let visibilityHiddenTime = null
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      visibilityHiddenTime = Date.now()
      // Only track drop-off if hidden for more than 5 seconds (not just tab switch)
      setTimeout(() => {
        if (document.visibilityState === 'hidden' && visibilityHiddenTime) {
          const hiddenDuration = Date.now() - visibilityHiddenTime
          const { lastQuestionIndex, formData } = window.__wfc_analytics || {}
          if (
            lastQuestionIndex !== undefined && 
            lastQuestionIndex < 7 && 
            hiddenDuration > 5000 && // Hidden for more than 5 seconds
            !window.__wfc_analytics?.dropOffTracked &&
            !submissionTracked
          ) {
            trackDropOff(lastQuestionIndex, formData)
          }
        }
      }, 5000) // Wait 5 seconds before tracking
    } else {
      // Page visible again - reset hidden time
      visibilityHiddenTime = null
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // Track inactivity drop-offs (if user is inactive for 30 seconds)
  let inactivityTimer
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer)
    inactivityTimer = setTimeout(() => {
      const { lastQuestionIndex, formData } = window.__wfc_analytics || {}
      // Check multiple conditions to prevent duplicate drop-offs
      if (
        lastQuestionIndex !== undefined && 
        lastQuestionIndex < 7 && 
        !window.__wfc_analytics?.dropOffTracked &&
        !submissionTracked &&
        document.visibilityState === 'visible' // Only track if page is still visible
      ) {
        console.log('📊 Tracking inactivity drop-off at question', lastQuestionIndex)
        trackDropOff(lastQuestionIndex, formData)
      }
    }, 30000) // 30 seconds of inactivity
  }
  
  // Reset timer on any interaction
  const handleInteraction = () => {
    resetInactivityTimer()
  }
  
  window.addEventListener('mousedown', handleInteraction)
  window.addEventListener('keydown', handleInteraction)
  window.addEventListener('scroll', handleInteraction)
  window.addEventListener('touchstart', handleInteraction)
  
  resetInactivityTimer() // Start the timer
  
  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}

/**
 * Update analytics state (call when question changes)
 */
export const updateAnalyticsState = (questionIndex, formData) => {
  if (window.__wfc_analytics) {
    window.__wfc_analytics.lastQuestionIndex = questionIndex
    window.__wfc_analytics.formData = formData
  }
}

/**
 * Aggregate analytics data from local storage
 * Returns statistics in the format expected by SimpleAnalyticsDashboard
 */
export const getLocalAnalytics = () => {
  try {
    const storageKey = 'wfc_analytics_events'
    const events = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    if (events.length === 0) {
      return {
        totalSessions: 0,
        completed: 0,
        conversionRate: 0,
        questions: Object.keys(QUESTION_LABELS).map(index => ({
          name: QUESTION_LABELS[index],
          number: parseInt(index) + 1,
          views: 0,
          completions: 0,
          dropOffs: 0,
          rate: 0,
          avgTimeSeconds: 0
        })),
        recentDropOffs: []
      }
    }
    
    // Get unique sessions
    const uniqueSessions = new Set(events.map(e => e.sessionId))
    const totalSessions = uniqueSessions.size
    
    // Count completions
    const completed = events.filter(e => e.eventType === 'form_submitted').length
    
    // Track question views and completions
    const questionStats = {}
    
    Object.keys(QUESTION_LABELS).forEach(index => {
      const idx = parseInt(index)
      questionStats[idx] = {
        name: QUESTION_LABELS[idx],
        number: idx + 1,
        views: 0,
        completions: 0,
        dropOffs: 0,
        totalTime: 0,
        timeCount: 0
      }
    })
    
    // Track maximum question reached per session (for proper funnel calculation)
    const sessionMaxQuestion = {}
    const submittedSessions = new Set()
    
    // Process events
    events.forEach(event => {
      const qIndex = event.questionIndex
      const sessionId = event.sessionId
      
      // Track submitted sessions separately (they reached all questions)
      if (event.eventType === 'form_submitted' && sessionId) {
        submittedSessions.add(sessionId)
        // Submitted sessions reached all questions, so set max to 7 (last question index)
        sessionMaxQuestion[sessionId] = 7
      }
      
      // Track the furthest question each session reached
      if (qIndex !== undefined && sessionId && !submittedSessions.has(sessionId)) {
        if (!sessionMaxQuestion[sessionId] || qIndex > sessionMaxQuestion[sessionId]) {
          sessionMaxQuestion[sessionId] = qIndex
        }
      }
      
      // Count question views (for display purposes, but funnel uses max reached)
      if (event.eventType === 'question_view' && qIndex !== undefined) {
        questionStats[qIndex].views++
      }
      
      if (event.eventType === 'question_completed' && qIndex !== undefined) {
        questionStats[qIndex].completions++
        if (event.timeOnQuestion) {
          questionStats[qIndex].totalTime += event.timeOnQuestion
          questionStats[qIndex].timeCount++
        }
      }
      
      if (event.eventType === 'drop_off' && event.lastQuestionIndex !== undefined) {
        questionStats[event.lastQuestionIndex].dropOffs++
      }
    })
    
    // Calculate how many sessions reached each question (for funnel)
    // A session "reached" a question if their max question >= that question index
    Object.entries(sessionMaxQuestion).forEach(([sessionId, maxQIndex]) => {
      // Count this session for all questions up to and including maxQIndex
      for (let i = 0; i <= maxQIndex; i++) {
        if (questionStats[i]) {
          questionStats[i].sessionsReached = (questionStats[i].sessionsReached || 0) + 1
        }
      }
    })
    
    // Convert to array and calculate rates
    const questions = Object.values(questionStats)
      .sort((a, b) => a.number - b.number)
      .map(q => ({
        name: q.name,
        number: q.number,
        views: q.views, // Total view events (for reference)
        sessionsReached: q.sessionsReached || 0, // Unique sessions that reached this question (for funnel)
        completions: q.completions,
        dropOffs: q.dropOffs,
        rate: (q.sessionsReached || 0) > 0 ? (q.dropOffs / (q.sessionsReached || 1)) * 100 : 0,
        avgTimeSeconds: q.timeCount > 0 ? Math.round(q.totalTime / q.timeCount / 1000) : 0
      }))
    
    // Get recent drop-offs
    const recentDropOffs = events
      .filter(e => e.eventType === 'drop_off')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(e => ({
        time: new Date(e.timestamp).toLocaleString(),
        question: `Q${(e.lastQuestionIndex || 0) + 1}`,
        questionName: QUESTION_LABELS[e.lastQuestionIndex] || 'Unknown'
      }))
    
    const conversionRate = totalSessions > 0 ? (completed / totalSessions) * 100 : 0
    
    return {
      totalSessions,
      completed,
      conversionRate,
      questions,
      recentDropOffs
    }
  } catch (err) {
    console.error('Error aggregating local analytics:', err)
    return {
      totalSessions: 0,
      completed: 0,
      conversionRate: 0,
      questions: [],
      recentDropOffs: []
    }
  }
}

/**
 * Get all raw events from local storage
 */
export const getAllLocalEvents = () => {
  try {
    const storageKey = 'wfc_analytics_events'
    return JSON.parse(localStorage.getItem(storageKey) || '[]')
  } catch (err) {
    console.error('Error reading local events:', err)
    return []
  }
}

/**
 * Clear/reset all analytics data from local storage
 */
export const clearLocalAnalytics = () => {
  try {
    const storageKey = 'wfc_analytics_events'
    localStorage.removeItem(storageKey)
    return true
  } catch (err) {
    console.error('Error clearing analytics:', err)
    return false
  }
}

/**
 * Export analytics data as JSON
 */
export const exportAnalyticsJSON = () => {
  const events = getAllLocalEvents()
  const aggregated = getLocalAnalytics()
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    summary: {
      totalEvents: events.length,
      totalSessions: aggregated.totalSessions,
      completed: aggregated.completed,
      conversionRate: aggregated.conversionRate
    },
    aggregated: aggregated,
    rawEvents: events
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Export analytics data as CSV
 */
export const exportAnalyticsCSV = () => {
  const aggregated = getLocalAnalytics()
  
  // Create CSV header
  let csv = 'Question,Views,Completions,Drop-offs,Drop-off Rate (%),Avg Time (seconds)\n'
  
  // Add question data
  aggregated.questions.forEach(q => {
    csv += `"${q.name}",${q.views},${q.completions},${q.dropOffs},${q.rate.toFixed(2)},${q.avgTimeSeconds}\n`
  })
  
  // Add summary row
  csv += `\nSummary\n`
  csv += `Total Sessions,${aggregated.totalSessions}\n`
  csv += `Completed,${aggregated.completed}\n`
  csv += `Conversion Rate,${aggregated.conversionRate.toFixed(2)}%\n`
  
  return csv
}

/**
 * Generate a text summary of analytics
 */
export const generateAnalyticsSummary = () => {
  const aggregated = getLocalAnalytics()
  const events = getAllLocalEvents()
  
  const summary = `
📊 ANALYTICS SUMMARY
Generated: ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERALL METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Sessions: ${aggregated.totalSessions}
Completed Submissions: ${aggregated.completed}
Conversion Rate: ${aggregated.conversionRate.toFixed(2)}%
Drop-off Rate: ${(100 - aggregated.conversionRate).toFixed(2)}%
Total Events Tracked: ${events.length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTION BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${aggregated.questions.map(q => 
  `Q${q.number}: ${q.name}
  └─ Views: ${q.views} | Completions: ${q.completions} | Drop-offs: ${q.dropOffs} (${q.rate.toFixed(1)}%) | Avg Time: ${q.avgTimeSeconds}s`
).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOP DROP-OFF QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${aggregated.questions
  .filter(q => q.dropOffs > 0)
  .sort((a, b) => b.rate - a.rate)
  .slice(0, 5)
  .map((q, i) => `${i + 1}. Q${q.number}: ${q.name} - ${q.dropOffs} drop-offs (${q.rate.toFixed(1)}%)`)
  .join('\n')}
`
  
  return summary.trim()
}

export default {
  initAnalytics,
  trackSessionStart,
  trackQuestionView,
  trackQuestionAnswered,
  trackQuestionCompleted,
  trackQuestionBack,
  trackFormSubmitted,
  trackSubmissionError,
  trackDropOff,
  updateAnalyticsState,
  getLocalAnalytics,
  getAllLocalEvents,
  clearLocalAnalytics,
  exportAnalyticsJSON,
  exportAnalyticsCSV,
  generateAnalyticsSummary
}

