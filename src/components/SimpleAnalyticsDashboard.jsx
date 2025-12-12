import React, { useState, useEffect } from 'react'
import { 
  getLocalAnalytics, 
  clearLocalAnalytics, 
  exportAnalyticsJSON, 
  exportAnalyticsCSV,
  generateAnalyticsSummary 
} from '../analytics/funnelAnalytics'
import '../styles.css'

/**
 * Simple Analytics Dashboard
 * 
 * Reads aggregated analytics data from local storage (for localhost) 
 * or n8n HTTP endpoint (for production).
 * No Google Sheets needed - just clean, visual analytics!
 */

const SimpleAnalyticsDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dataSource, setDataSource] = useState('local') // 'local' or 'n8n'

  // TODO: Replace with your n8n analytics endpoint URL
  const ANALYTICS_ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT || 
    'https://wayfindercollective.app.n8n.cloud/webhook/analytics-stats'
  
  // n8n endpoint for clearing Google Sheets data (optional - set VITE_RESET_SHEETS_ENDPOINT)
  const RESET_SHEETS_ENDPOINT = import.meta.env.VITE_RESET_SHEETS_ENDPOINT || 
    (import.meta.env.DEV 
      ? '/api/n8n/webhook/reset-sheets'  // Dev proxy
      : null)  // Production: set via env var

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true)
      
      // In development, prefer local storage
      // In production, try n8n endpoint first, fallback to local
      const useLocalFirst = import.meta.env.DEV
      
      if (useLocalFirst) {
        // Use local analytics
        const localData = getLocalAnalytics()
        setData(localData)
        setDataSource('local')
        
        if (localData.totalSessions === 0) {
          setError('No data yet - go through the form to generate analytics events')
        } else {
          setError(null)
        }
        setLoading(false)
      } else {
        // Try n8n endpoint first
        try {
          const response = await fetch(ANALYTICS_ENDPOINT)
          if (!response.ok) {
            throw new Error('Failed to fetch analytics')
          }
          const stats = await response.json()
          
          // Check if we got real data or just zeros
          if (stats.totalSessions === 0 && stats.completed === 0 && stats.questions?.every(q => q.views === 0)) {
            // Real endpoint but no data yet - fallback to local
            const localData = getLocalAnalytics()
            setData(localData)
            setDataSource('local')
            setError('No data in n8n yet - showing local analytics')
          } else {
            // Real data from n8n!
            setData(stats)
            setDataSource('n8n')
            setError(null)
          }
          setLoading(false)
        } catch (err) {
          console.error('Analytics fetch error:', err)
          // Fallback to local analytics
          const localData = getLocalAnalytics()
          setData(localData)
          setDataSource('local')
          
          if (localData.totalSessions === 0) {
            setError('⚠️ n8n endpoint not available and no local data - go through the form to generate analytics')
          } else {
            setError('⚠️ Using local analytics - n8n endpoint not available')
          }
          setLoading(false)
        }
      }
    }

    loadAnalytics()
    // Refresh every 5 seconds (faster for localhost)
    const interval = setInterval(loadAnalytics, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: '1', fontFamily: 'system-ui, sans-serif' }}>📊</div>
        <p>Loading your analytics...</p>
      </div>
    )
  }

  const maxRate = data.questions ? Math.max(...data.questions.map(q => q.rate)) : 0

  // Export functions
  const handleExportJSON = () => {
    const json = exportAnalyticsJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const csv = exportAnalyticsCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportSummary = () => {
    const summary = generateAnalyticsSummary()
    const blob = new Blob([summary], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-summary-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopySummary = () => {
    const summary = generateAnalyticsSummary()
    navigator.clipboard.writeText(summary).then(() => {
      alert('Summary copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy. Try exporting instead.')
    })
  }

  const handleResetLocal = () => {
    if (window.confirm('⚠️ Reset Local Analytics Data?\n\nThis will clear analytics data stored in THIS browser only.\n\n✅ Your Google Sheets/n8n data is SAFE and will NOT be affected.\n\nThis is useful for testing or starting fresh locally.\n\nContinue?')) {
      if (window.confirm('⚠️ Last confirmation\n\nThis will clear LOCAL browser storage only.\n\nData already sent to Google Sheets/n8n will remain untouched.\n\nProceed with reset?')) {
        clearLocalAnalytics()
        // Reload the page to refresh data
        window.location.reload()
      }
    }
  }

  const handleResetEverything = async () => {
    if (!RESET_SHEETS_ENDPOINT) {
      alert('⚠️ Google Sheets reset endpoint not configured.\n\nTo enable this feature:\n1. Create an n8n workflow that clears Google Sheets\n2. Set VITE_RESET_SHEETS_ENDPOINT environment variable\n3. Or use "Reset Local Only" button instead')
      return
    }

    if (window.confirm('⚠️⚠️⚠️ DANGER: Reset ALL Analytics Data?\n\nThis will:\n❌ Clear LOCAL browser storage\n❌ DELETE ALL DATA from Google Sheets\n\n⚠️ This action CANNOT be undone!\n\nMake sure you\'ve exported your data first!\n\nContinue?')) {
      if (window.confirm('⚠️⚠️⚠️ FINAL WARNING\n\nYou are about to PERMANENTLY DELETE:\n• All local analytics data\n• ALL data in Google Sheets\n\nThis will free up storage but ALL historical data will be lost.\n\nType "DELETE" in the next prompt to confirm.')) {
        const confirmation = window.prompt('Type "DELETE" (all caps) to confirm permanent deletion:')
        
        if (confirmation === 'DELETE') {
          try {
            // Clear local storage first
            clearLocalAnalytics()
            
            // Call n8n endpoint to clear Google Sheets
            const response = await fetch(RESET_SHEETS_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                action: 'clear_all',
                timestamp: new Date().toISOString()
              })
            })

            if (!response.ok) {
              throw new Error(`Failed to clear Google Sheets: ${response.status}`)
            }

            const result = await response.json()
            alert(`✅ Success!\n\n• Local data cleared\n• Google Sheets cleared: ${result.message || 'Success'}\n\nPage will reload...`)
            
            // Reload the page to refresh data
            window.location.reload()
          } catch (error) {
            console.error('Reset error:', error)
            alert(`❌ Error clearing Google Sheets:\n\n${error.message}\n\nLocal data was cleared, but Google Sheets may still have data.\n\nCheck your n8n workflow configuration.`)
            // Still reload since local is cleared
            window.location.reload()
          }
        } else {
          alert('Reset cancelled. Data is safe.')
        }
      }
    }
  }

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
      color: '#ffffff',
      overflow: 'hidden'
    }}>
      {/* Stars Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)',
        zIndex: 0,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `
            radial-gradient(2px 2px at 20% 30%, white, transparent),
            radial-gradient(2px 2px at 60% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 80% 10%, white, transparent),
            radial-gradient(2px 2px at 90% 40%, white, transparent),
            radial-gradient(1px 1px at 33% 80%, white, transparent),
            radial-gradient(2px 2px at 10% 60%, white, transparent),
            radial-gradient(1px 1px at 70% 20%, white, transparent)
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
          animation: 'sparkle 20s linear infinite',
          opacity: 0.6
        }} />
      </div>

      {/* Grid Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
          linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      {/* Main Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        minHeight: '100vh'
      }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '0.5rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ 
            fontSize: '2.5rem',
            fontFamily: 'system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
            lineHeight: '1'
          }}>📊</span>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            background: 'linear-gradient(90deg, #00f3ff, #b026ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 20px rgba(0, 243, 255, 0.5)'
          }}>
            Funnel Analytics - Jeffy
          </span>
        </h1>
        <p style={{ 
          color: '#b0b0b0', 
          fontSize: '1.1rem',
          fontFamily: "'Inter', sans-serif",
          marginBottom: '2.5rem'
        }}>See exactly where people lose signal</p>
        <div style={{ 
          marginTop: '0rem', 
          padding: '0.5rem 0.75rem', 
          background: dataSource === 'local' 
            ? 'rgba(0, 255, 150, 0.1)' 
            : 'rgba(0, 243, 255, 0.1)', 
          border: `1px solid ${dataSource === 'local' 
            ? 'rgba(0, 255, 150, 0.3)' 
            : 'rgba(0, 243, 255, 0.3)'}`,
          borderRadius: '8px',
          color: dataSource === 'local' ? '#00ff96' : '#00f3ff',
          fontSize: '0.85rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          marginBottom: '1rem',
          fontFamily: "'Inter', sans-serif",
          boxShadow: dataSource === 'local'
            ? '0 0 10px rgba(0, 255, 150, 0.2)'
            : '0 0 10px rgba(0, 243, 255, 0.2)'
        }}>
          <span style={{ 
            fontSize: '1rem', 
            fontFamily: 'system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
            lineHeight: '1',
            display: 'inline-block'
          }}>
            {dataSource === 'local' ? '💾' : '☁️'}
          </span>
          <span>{dataSource === 'local' ? 'Local Analytics' : 'n8n Analytics'}</span>
        </div>

        {/* Export & Reset Controls */}
        {dataSource === 'local' && data && data.totalSessions > 0 && (
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '1rem'
          }}>
            <button
              onClick={handleExportJSON}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'rgba(10, 10, 15, 0.8)',
                border: '2px solid rgba(0, 243, 255, 0.3)',
                borderRadius: '12px',
                color: '#00f3ff',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 243, 255, 0.1)'
                e.currentTarget.style.borderColor = '#00f3ff'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 243, 255, 0.5), 0 5px 15px rgba(0, 243, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(10, 10, 15, 0.8)'
                e.currentTarget.style.borderColor = 'rgba(0, 243, 255, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              📥 Export JSON
            </button>
            <button
              onClick={handleExportCSV}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'rgba(10, 10, 15, 0.8)',
                border: '2px solid rgba(0, 255, 150, 0.3)',
                borderRadius: '12px',
                color: '#00ff96',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 255, 150, 0.1)'
                e.currentTarget.style.borderColor = '#00ff96'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 150, 0.5), 0 5px 15px rgba(0, 255, 150, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(10, 10, 15, 0.8)'
                e.currentTarget.style.borderColor = 'rgba(0, 255, 150, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              📊 Export CSV
            </button>
            <button
              onClick={handleExportSummary}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'rgba(10, 10, 15, 0.8)',
                border: '2px solid rgba(176, 38, 255, 0.3)',
                borderRadius: '12px',
                color: '#b026ff',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(176, 38, 255, 0.1)'
                e.currentTarget.style.borderColor = '#b026ff'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(176, 38, 255, 0.5), 0 5px 15px rgba(176, 38, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(10, 10, 15, 0.8)'
                e.currentTarget.style.borderColor = 'rgba(176, 38, 255, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              📄 Export Summary
            </button>
            <button
              onClick={handleCopySummary}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'rgba(10, 10, 15, 0.8)',
                border: '2px solid rgba(255, 200, 50, 0.3)',
                borderRadius: '12px',
                color: '#ffc832',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 200, 50, 0.1)'
                e.currentTarget.style.borderColor = '#ffc832'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 200, 50, 0.5), 0 5px 15px rgba(255, 200, 50, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(10, 10, 15, 0.8)'
                e.currentTarget.style.borderColor = 'rgba(255, 200, 50, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              📋 Copy Summary
            </button>
            <button
              onClick={handleResetLocal}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'rgba(10, 10, 15, 0.8)',
                border: '2px solid rgba(255, 150, 50, 0.3)',
                borderRadius: '12px',
                color: '#ff9632',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 150, 50, 0.1)'
                e.currentTarget.style.borderColor = '#ff9632'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 150, 50, 0.5), 0 5px 15px rgba(255, 150, 50, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(10, 10, 15, 0.8)'
                e.currentTarget.style.borderColor = 'rgba(255, 150, 50, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              🗑️ Reset Local Only
            </button>
          </div>
        )}
        {error && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: error.includes('demo') ? 'rgba(255, 200, 50, 0.2)' : 'rgba(0, 243, 255, 0.1)', 
            borderRadius: '8px',
            color: error.includes('demo') ? '#ffc832' : '#00f3ff',
            fontSize: '0.9rem'
          }}>
            {error.includes('demo') ? '⚠️' : 'ℹ️'} {error}
          </div>
        )}
        {!error && data && data.totalSessions === 0 && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: 'rgba(0, 243, 255, 0.1)', 
            borderRadius: '8px',
            color: '#00f3ff',
            fontSize: '0.9rem'
          }}>
            ℹ️ No data yet - go through the form to generate analytics events, then refresh
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <MetricCard 
          icon="👥" 
          value={data.totalSessions?.toLocaleString() || '0'} 
          label="Total Visitors"
          color="#00f3ff"
        />
        <MetricCard 
          icon="✅" 
          value={data.completed?.toLocaleString() || '0'} 
          label="Completed"
          color="#00ff96"
        />
        <MetricCard 
          icon="📈" 
          value={`${data.conversionRate?.toFixed(1) || '0'}%`} 
          label="Conversion Rate"
          color="#b026ff"
        />
        <MetricCard 
          icon="⚠️" 
          value={`${((100 - (data.conversionRate || 0)).toFixed(1))}%`} 
          label="Drop-off Rate"
          color="#ff6666"
        />
      </div>

      {/* Drop-off Chart */}
      {data.questions && data.questions.length > 0 && (
        <div style={{
          background: 'rgba(26, 26, 46, 0.6)',
          backdropFilter: 'blur(10px)',
          padding: '2rem',
          borderRadius: '20px',
          border: '1px solid rgba(0, 243, 255, 0.2)',
          marginBottom: '2rem',
          boxShadow: '0 0 20px rgba(0, 243, 255, 0.1)'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '2rem', 
            color: '#fff',
            fontFamily: "'Orbitron', monospace",
            fontWeight: '600'
          }}>
            Drop-off Rate by Question
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {data.questions.map((q, index) => (
              <QuestionBar 
                key={index}
                question={q}
                maxRate={maxRate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Funnel Visualization */}
      {data.questions && data.questions.length > 0 && (
        <div style={{
          background: 'rgba(26, 26, 46, 0.6)',
          backdropFilter: 'blur(10px)',
          padding: '2rem',
          borderRadius: '20px',
          border: '1px solid rgba(0, 243, 255, 0.2)',
          marginBottom: '2rem',
          boxShadow: '0 0 20px rgba(0, 243, 255, 0.1)'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            marginBottom: '2rem', 
            color: '#fff',
            fontFamily: "'Orbitron', monospace",
            fontWeight: '600'
          }}>
            Conversion Funnel
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            {data.questions.map((q, index) => {
              // Use sessionsReached (unique sessions that reached this question) for funnel
              // Fallback to views if sessionsReached not available (backward compatibility)
              const remaining = q.sessionsReached !== undefined ? q.sessionsReached : (q.views || 0)
              const width = Math.max(5, ((remaining / (data.totalSessions || 1)) * 100))
              
              return (
                <div key={index} style={{ width: '100%', maxWidth: '800px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ minWidth: '180px', fontSize: '1rem', fontWeight: '500' }}>
                      Q{q.number}: {q.name}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.9rem' }}>
                      {remaining.toLocaleString()} remaining
                    </div>
                  </div>
                  <div style={{
                    width: `${width}%`,
                    height: '50px',
                    background: (q.rate || 0) > 10 
                      ? 'linear-gradient(90deg, rgba(255, 100, 50, 0.8), rgba(255, 150, 50, 0.6))'
                      : 'linear-gradient(90deg, rgba(0, 243, 255, 0.6), rgba(0, 200, 255, 0.4))',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease',
                    boxShadow: (q.rate || 0) > 10 
                      ? '0 0 20px rgba(255, 100, 50, 0.3)'
                      : '0 0 10px rgba(0, 243, 255, 0.2)'
                  }}>
                    {remaining.toLocaleString()}
                  </div>
                  {(q.dropOffs || 0) > 0 && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      marginLeft: '180px',
                      color: (q.rate || 0) > 10 ? '#ff6666' : '#888',
                      fontSize: '0.9rem'
                    }}>
                      ↓ {q.dropOffs} dropped off ({q.rate?.toFixed(1) || '0'}%)
                    </div>
                  )}
                </div>
              )
            })}
            
            {/* Completion */}
            <div style={{ width: '100%', maxWidth: '800px', marginTop: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{ minWidth: '180px', fontSize: '1rem', fontWeight: '500', color: '#00ff96' }}>
                  ✓ Completed
                </div>
                <div style={{ color: '#00ff96', fontSize: '0.9rem' }}>
                  {(data.completed || 0).toLocaleString()} submissions
                </div>
              </div>
              <div style={{
                width: `${((data.completed || 0) / (data.totalSessions || 1)) * 100}%`,
                height: '50px',
                background: 'linear-gradient(90deg, rgba(0, 255, 150, 0.8), rgba(0, 200, 100, 0.6))',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                boxShadow: '0 0 20px rgba(0, 255, 150, 0.3)'
              }}>
                {(data.completed || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* What You Asked For - 4 Key Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* 1. At What Point Someone Stopped */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.2rem', 
            marginBottom: '1rem', 
            color: '#00f3ff',
            fontFamily: "'Orbitron', monospace",
            fontWeight: '600',
            textShadow: '0 0 10px rgba(0, 243, 255, 0.5)'
          }}>
            📍 Where People Stopped
          </h3>
          {data.questions && data.questions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.questions
                .filter(q => (q.dropOffs || 0) > 0)
                .sort((a, b) => (b.dropOffs || 0) - (a.dropOffs || 0))
                .slice(0, 5)
                .map((q, i) => (
                  <div key={i} style={{
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '6px'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      Q{q.number}: {q.name}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.9rem' }}>
                      {q.dropOffs} people stopped here
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 2. At What Question Someone Stopped */}
        <div style={{
          background: 'rgba(26, 26, 46, 0.6)',
          backdropFilter: 'blur(10px)',
          padding: '1.5rem',
          borderRadius: '20px',
          border: '1px solid rgba(176, 38, 255, 0.2)',
          boxShadow: '0 0 20px rgba(176, 38, 255, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.2rem', 
            marginBottom: '1rem', 
            color: '#b026ff',
            fontFamily: "'Orbitron', monospace",
            fontWeight: '600',
            textShadow: '0 0 10px rgba(176, 38, 255, 0.5)'
          }}>
            ❌ Drop-off by Question
          </h3>
          {data.questions && data.questions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.questions.map((q, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem',
                  background: (q.rate || 0) > 10 ? 'rgba(255, 100, 50, 0.1)' : 'transparent',
                  borderRadius: '4px'
                }}>
                  <span style={{ fontSize: '0.9rem' }}>Q{q.number}</span>
                  <span style={{ 
                    fontWeight: '600',
                    color: (q.rate || 0) > 10 ? '#ff6666' : '#fff'
                  }}>
                    {(q.rate || 0).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. When They Quit */}
        <div style={{
          background: 'rgba(26, 26, 46, 0.6)',
          backdropFilter: 'blur(10px)',
          padding: '1.5rem',
          borderRadius: '20px',
          border: '1px solid rgba(0, 255, 150, 0.2)',
          boxShadow: '0 0 20px rgba(0, 255, 150, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.2rem', 
            marginBottom: '1rem', 
            color: '#00ff96',
            fontFamily: "'Orbitron', monospace",
            fontWeight: '600',
            textShadow: '0 0 10px rgba(0, 255, 150, 0.5)'
          }}>
            ⏰ Recent Drop-offs
          </h3>
          {data.recentDropOffs && data.recentDropOffs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.recentDropOffs.map((dropoff, i) => (
                <div key={i} style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ color: '#888', marginBottom: '0.25rem' }}>
                    {dropoff.time}
                  </div>
                  <div style={{ fontWeight: '500' }}>
                    Stopped at {dropoff.question}: {dropoff.questionName}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#888', fontSize: '0.9rem' }}>No recent drop-offs</p>
          )}
        </div>

        {/* 4. How Long It Took to Answer */}
        <div style={{
          background: 'rgba(26, 26, 46, 0.6)',
          backdropFilter: 'blur(10px)',
          padding: '1.5rem',
          borderRadius: '20px',
          border: '1px solid rgba(255, 200, 50, 0.2)',
          boxShadow: '0 0 20px rgba(255, 200, 50, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.2rem', 
            marginBottom: '1rem', 
            color: '#ffc832',
            fontFamily: "'Orbitron', monospace",
            fontWeight: '600',
            textShadow: '0 0 10px rgba(255, 200, 50, 0.5)'
          }}>
            ⏱️ Time Per Question
          </h3>
          {data.questions && data.questions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.questions.map((q, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '6px'
                }}>
                  <span style={{ fontSize: '0.9rem' }}>Q{q.number}: {q.name}</span>
                  <span style={{ 
                    fontWeight: '600',
                    color: '#00f3ff',
                    fontSize: '1rem'
                  }}>
                    {q.avgTimeSeconds || 0}s
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Key Insight */}
      {data.questions && data.questions.length > 0 && (() => {
        const worstQuestion = data.questions.reduce((worst, q) => (q.rate || 0) > (worst.rate || 0) ? q : worst)
        return (
          <div style={{
            background: 'rgba(255, 100, 50, 0.1)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 100, 50, 0.3)',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#ff6666' }}>
              🔍 Key Insight
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#fff' }}>
              <strong>Question {worstQuestion.number} ({worstQuestion.name})</strong> has the highest drop-off rate at <strong>{(worstQuestion.rate || 0).toFixed(1)}%</strong>. 
              {(worstQuestion.rate || 0) > 10 && ' This is a problem area - consider simplifying this question or providing more context.'}
            </p>
          </div>
        )
      })()}

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: 'rgba(0, 243, 255, 0.05)', 
        borderRadius: '8px', 
        fontSize: '0.9rem', 
        color: '#888',
        textAlign: 'center'
      }}>
        <p>
          <strong>Note:</strong> {dataSource === 'local' 
            ? 'Dashboard is reading from local browser storage. Analytics events are stored automatically as you use the form.'
            : 'Dashboard reads from n8n endpoint. Set up the analytics aggregation workflow in n8n to see real-time data.'}
        </p>
        {dataSource === 'local' && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            💡 Tip: Go through the form to generate analytics events, then refresh this page to see updated stats.
          </p>
        )}
      </div>

      {/* Reset ALL DATA Button - Fixed Bottom Right */}
      {dataSource === 'local' && data && data.totalSessions > 0 && (
        <button
          onClick={handleResetEverything}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            padding: '1rem 2rem',
            background: 'rgba(255, 50, 50, 0.2)',
            border: '2px solid rgba(255, 50, 50, 0.5)',
            borderRadius: '12px',
            color: '#ff3232',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: '700',
            fontFamily: "'Inter', sans-serif",
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(255, 50, 50, 0.3)',
            zIndex: 1000,
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 50, 50, 0.3)'
            e.currentTarget.style.borderColor = '#ff3232'
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 50, 50, 0.6), 0 6px 16px rgba(255, 50, 50, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 50, 50, 0.2)'
            e.currentTarget.style.borderColor = 'rgba(255, 50, 50, 0.5)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 50, 50, 0.3)'
          }}
        >
          ⚠️ Reset ALL DATA
        </button>
      )}
      </div>
    </div>
  )
}

// Helper component for metric cards
const MetricCard = ({ icon, value, label, color }) => (
  <div style={{
    background: `rgba(${color === '#00f3ff' ? '0, 243, 255' : color === '#00ff96' ? '0, 255, 150' : color === '#b026ff' ? '176, 38, 255' : '255, 100, 100'}, 0.1)`,
    padding: '2rem',
    borderRadius: '16px',
    border: `1px solid rgba(${color === '#00f3ff' ? '0, 243, 255' : color === '#00ff96' ? '0, 255, 150' : color === '#b026ff' ? '176, 38, 255' : '255, 100, 100'}, 0.3)`,
    textAlign: 'center',
    transition: 'transform 0.2s',
  }}
  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{icon}</div>
    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color, marginBottom: '0.5rem' }}>
      {value}
    </div>
    <div style={{ color: '#888', fontSize: '1rem' }}>{label}</div>
  </div>
)

// Helper component for question bars
const QuestionBar = ({ question, maxRate }) => {
  const dropOffs = question.dropOffs || 0
  const rate = question.rate || 0
  const barWidth = maxRate > 0 ? Math.max(2, (rate / maxRate) * 100) : 0
  
  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '0.75rem',
        gap: '1rem'
      }}>
        <div style={{ 
          fontSize: '1.1rem', 
          fontWeight: '500',
          fontFamily: "'Inter', sans-serif",
          flex: '1',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          Q{question.number}: {question.name}
        </div>
        <div style={{ 
          fontSize: '1.3rem', 
          fontWeight: 'bold',
          fontFamily: "'Orbitron', monospace",
          color: rate > 10 ? '#ff6666' : '#00f3ff',
          textShadow: rate > 10 ? '0 0 10px rgba(255, 100, 100, 0.5)' : '0 0 10px rgba(0, 243, 255, 0.5)',
          flexShrink: 0,
          whiteSpace: 'nowrap'
        }}>
          {rate.toFixed(1)}%
        </div>
      </div>
      <div style={{
        height: '40px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        overflow: 'visible',
        position: 'relative',
        border: '1px solid rgba(0, 243, 255, 0.1)'
      }}>
        <div style={{
          height: '100%',
          width: `${barWidth}%`,
          minWidth: dropOffs > 0 ? '60px' : '0',
          background: rate > 10
            ? 'linear-gradient(90deg, rgba(255, 100, 50, 0.9), rgba(255, 150, 50, 0.7))'
            : 'linear-gradient(90deg, rgba(0, 243, 255, 0.7), rgba(0, 200, 255, 0.5))',
          borderRadius: '8px',
          transition: 'width 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          color: '#fff',
          fontWeight: '600',
          fontSize: '0.9rem',
          fontFamily: "'Inter', sans-serif",
          boxShadow: rate > 10 
            ? '0 0 15px rgba(255, 100, 50, 0.4)' 
            : '0 0 15px rgba(0, 243, 255, 0.3)',
          whiteSpace: 'nowrap',
          overflow: 'visible'
        }}>
          {dropOffs > 0 ? `${dropOffs} drop-off${dropOffs !== 1 ? 's' : ''}` : '0 drop-offs'}
        </div>
        {dropOffs === 0 && (
          <div style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#b0b0b0',
            fontSize: '0.9rem',
            fontFamily: "'Inter', sans-serif",
            fontWeight: '500',
            whiteSpace: 'nowrap'
          }}>
            0 drop-offs
          </div>
        )}
      </div>
    </div>
  )
}

// Demo data fallback
const getDemoData = () => ({
  totalSessions: 1250,
  completed: 312,
  conversionRate: 24.96,
  questions: [
    { name: 'Help Area', number: 1, views: 1250, dropOffs: 45, rate: 3.6 },
    { name: 'Commitment Level', number: 2, views: 1205, dropOffs: 38, rate: 3.1 },
    { name: 'Readiness', number: 3, views: 1167, dropOffs: 52, rate: 4.5 },
    { name: 'Investment Readiness', number: 4, views: 1115, dropOffs: 187, rate: 16.8 },
    { name: 'Income Level', number: 5, views: 928, dropOffs: 28, rate: 3.0 },
    { name: 'Full Name', number: 6, views: 900, dropOffs: 89, rate: 9.9 },
    { name: 'Email Address', number: 7, views: 811, dropOffs: 67, rate: 8.3 },
    { name: 'Phone Number', number: 8, views: 744, dropOffs: 32, rate: 4.3 }
  ]
})

export default SimpleAnalyticsDashboard
