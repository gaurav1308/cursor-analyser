import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import './DateRangeSelector.css'

const PRESET_RANGES = [
  { label: 'Today', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time', days: null },
]

function DateRangeSelector({ dateRange, onDateRangeChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activePreset, setActivePreset] = useState('Last 30 days')
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePresetSelect = (preset) => {
    setActivePreset(preset.label)
    
    const endDate = new Date()
    let startDate = null
    
    if (preset.days) {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - preset.days)
    }
    
    onDateRangeChange({
      start: startDate,
      end: endDate,
      label: preset.label,
      days: preset.days,
    })
    
    setIsOpen(false)
  }

  const formatDateRange = () => {
    if (!dateRange?.start) return activePreset
    
    const options = { month: 'short', day: 'numeric' }
    const start = dateRange.start.toLocaleDateString('en-US', options)
    const end = dateRange.end.toLocaleDateString('en-US', options)
    
    if (dateRange.days === 1) return 'Today'
    return `${start} - ${end}`
  }

  return (
    <div className="date-range-selector" ref={dropdownRef}>
      <motion.button 
        className="date-range-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Calendar size={16} />
        <span className="date-range-label">{formatDateRange()}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="date-range-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="preset-list">
              {PRESET_RANGES.map((preset) => (
                <motion.button
                  key={preset.label}
                  className={`preset-item ${activePreset === preset.label ? 'active' : ''}`}
                  onClick={() => handlePresetSelect(preset)}
                  whileHover={{ x: 4 }}
                >
                  <span>{preset.label}</span>
                  {activePreset === preset.label && (
                    <motion.div 
                      className="active-indicator"
                      layoutId="activePreset"
                    />
                  )}
                </motion.button>
              ))}
            </div>
            
            <div className="dropdown-footer">
              <span className="footer-hint">
                Showing data for selected period
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DateRangeSelector

