'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    date: '',
    venue: '',
    coverageScope: 'Both Sides',
    message: ''
  })
  
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [startedTyping, setStartedTyping] = useState(false)

  const handleFocus = (field: string) => {
    setFocusedField(field)
    if (!startedTyping) {
      setStartedTyping(true)
      if (typeof window !== 'undefined' && (window as any).trackEvent) {
        (window as any).trackEvent('begin_inquiry')
      }
    }
  }
  const handleBlur = (field: string, value: string) => {
    if (focusedField === field) {
      setFocusedField(null)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Client-side validation
    if (!formData.name.trim()) {
      setErrorMsg('Please enter your name.')
      return
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Please enter your phone number.')
      return
    }

    setStatus('submitting')
    setErrorMsg('')

    try {
      const response = await fetch('/api/enquire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        if (typeof window !== 'undefined' && (window as any).trackEvent) {
          (window as any).trackEvent('submit_inquiry', { scope: formData.coverageScope })
        }
      } else {
        setStatus('error')
        setErrorMsg(data.error || 'Failed to submit inquiry. Please try again.')
      }
    } catch (err) {
      console.error('Submission error:', err)
      setStatus('error')
      setErrorMsg('A network error occurred. Please check your connection and try again.')
    }
  }

  const isFieldActive = (field: keyof typeof formData) => {
    return focusedField === field || formData[field].length > 0
  }

  return (
    <div style={{ position: 'relative', minHeight: '450px' }}>
      <AnimatePresence mode="wait">
        {status !== 'success' ? (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}
          >
            {/* Name */}
            <div style={inputContainerStyle}>
              <label style={labelStyle(isFieldActive('name'))}>
                Your Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => handleFocus('name')}
                onBlur={() => handleBlur('name', formData.name)}
                style={inputStyle}
                autoComplete="name"
              />
            </div>

            {/* Two Column Fields */}
            <div style={rowStyle}>
              {/* Email */}
              <div style={{ ...inputContainerStyle, flex: 1 }}>
                <label style={labelStyle(isFieldActive('email'))}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email', formData.email)}
                  style={inputStyle}
                  autoComplete="email"
                />
              </div>

              {/* Phone */}
              <div style={{ ...inputContainerStyle, flex: 1 }}>
                <label style={labelStyle(isFieldActive('phone'))}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onFocus={() => handleFocus('phone')}
                  onBlur={() => handleBlur('phone', formData.phone)}
                  style={inputStyle}
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Two Column: Instagram and Date */}
            <div style={rowStyle}>
              {/* Instagram Handle */}
              <div style={{ ...inputContainerStyle, flex: 1 }}>
                <label style={labelStyle(isFieldActive('instagram'))}>
                  Instagram Handle
                </label>
                <input
                  type="text"
                  name="instagram"
                  placeholder={focusedField === 'instagram' ? '@couple_aesthetic' : ''}
                  value={formData.instagram}
                  onChange={handleChange}
                  onFocus={() => handleFocus('instagram')}
                  onBlur={() => handleBlur('instagram', formData.instagram)}
                  style={inputStyle}
                />
              </div>

              {/* Wedding Date */}
              <div style={{ ...inputContainerStyle, flex: 1 }}>
                <label style={labelStyle(isFieldActive('date'))}>
                  Wedding Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  onFocus={() => handleFocus('date')}
                  onBlur={() => handleBlur('date', formData.date)}
                  style={{
                    ...inputStyle,
                    color: formData.date ? 'var(--ink)' : 'transparent',
                  }}
                />
              </div>
            </div>

            {/* Two Column: Venue and Coverage Scope */}
            <div style={rowStyle}>
              {/* Venue & City */}
              <div style={{ ...inputContainerStyle, flex: 1 }}>
                <label style={labelStyle(isFieldActive('venue'))}>
                  Venue / City
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  onFocus={() => handleFocus('venue')}
                  onBlur={() => handleBlur('venue', formData.venue)}
                  style={inputStyle}
                />
              </div>

              {/* Coverage Scope Dropdown */}
              <div style={{ ...inputContainerStyle, flex: 1 }}>
                <label style={labelStyle(isFieldActive('coverageScope'))}>
                  Coverage Scope
                </label>
                <select
                  name="coverageScope"
                  value={formData.coverageScope}
                  onChange={handleChange}
                  onFocus={() => handleFocus('coverageScope')}
                  onBlur={() => handleBlur('coverageScope', formData.coverageScope)}
                  style={{
                    ...inputStyle,
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: 0,
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a09a90\' stroke-width=\'1\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.25rem center',
                    backgroundSize: '0.75rem',
                    paddingRight: '1.5rem',
                  }}
                >
                  <option value="Both Sides" style={optionStyle}>Both Photography & Films</option>
                  <option value="Photography" style={optionStyle}>Photography Only</option>
                  <option value="Films" style={optionStyle}>Films Only</option>
                </select>
              </div>
            </div>

            {/* Message/Story */}
            <div style={inputContainerStyle}>
              <label style={labelStyle(isFieldActive('message'))}>
                Your Story
              </label>
              <textarea
                name="message"
                rows={3}
                value={formData.message}
                onChange={handleChange}
                onFocus={() => handleFocus('message')}
                onBlur={() => handleBlur('message', formData.message)}
                placeholder={focusedField === 'message' ? 'Tell us about your wedding events, style, and values...' : ''}
                style={{
                  ...inputStyle,
                  resize: 'none',
                  lineHeight: '1.6'
                }}
              />
            </div>

            {errorMsg && (
              <p style={{ color: '#c23b22', fontFamily: 'var(--font-sans)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 300 }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              style={{
                marginTop: '0.5rem',
                alignSelf: 'flex-start',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.5875rem',
                fontWeight: 400,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                background: 'none',
                border: '1px solid var(--ink)',
                padding: '0.875rem 2.5rem',
                cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}
              className="contact-submit"
            >
              {status === 'submitting' ? 'Sending Inquiry...' : 'Send Inquiry'}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              padding: '3rem 2rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(8px)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: '1px solid var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink)',
                fontSize: '1.25rem',
                fontWeight: 300,
                fontFamily: 'var(--font-sans)'
              }}
            >
              ✓
            </motion.div>
            <div>
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.75rem',
                fontWeight: 300,
                color: 'var(--ink)',
                marginBottom: '0.75rem',
                letterSpacing: '0.04em'
              }}>
                Thank You
              </h3>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.8125rem',
                color: 'var(--ink-mid)',
                lineHeight: 1.8,
                maxWidth: '42ch',
                margin: '0 auto',
                fontWeight: 300,
              }}>
                Your story has been shared. We read every inquiry personally and will get back to you within 24 hours to begin mapping your memories.
              </p>
            </div>
            
            <button
              onClick={() => {
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  instagram: '',
                  date: '',
                  venue: '',
                  coverageScope: 'Both Sides',
                  message: ''
                })
                setStatus('idle')
              }}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.5rem',
                fontWeight: 300,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--ink-light)',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '2px',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                marginTop: '1rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--ink-light)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              Send Another Inquiry
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Inline luxury styles
const inputContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  paddingTop: '0.75rem',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  flexWrap: 'wrap',
}

const labelStyle = (active: boolean): React.CSSProperties => ({
  position: 'absolute',
  top: active ? '-0.25rem' : '1.25rem',
  left: 0,
  fontFamily: 'var(--font-sans)',
  fontSize: active ? '0.45rem' : '0.5875rem',
  fontWeight: 400,
  letterSpacing: active ? '0.3em' : '0.2em',
  textTransform: 'uppercase',
  color: active ? 'var(--ink-mid)' : 'var(--ink-light)',
  pointerEvents: 'none',
  transition: 'all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
})

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border)',
  padding: '0.5rem 0',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.875rem',
  fontWeight: 400,
  color: 'var(--ink-mid)',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.3s ease',
}

const optionStyle: React.CSSProperties = {
  background: 'var(--linen)',
  color: 'var(--ink-mid)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.875rem',
  fontWeight: 400,
}
