import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Dashboard from './components/Dashboard'
import FileUpload from './components/FileUpload'
import { parseCursorData, generateMockData, transformRealData } from './utils/dataParser'
import './App.css'

function App() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [dataSource, setDataSource] = useState('loading')

  useEffect(() => {
    // Try to load real data first, fall back to mock
    async function loadData() {
      try {
        const response = await fetch('/cursor-usage-data.json')
        if (response.ok) {
          const realData = await response.json()
          // Check if it has real data (not empty)
          if (realData.summary && realData.summary.totalLinesGenerated > 0) {
            setData(transformRealData(realData))
            setDataSource('real')
            setIsLoading(false)
            return
          }
        }
      } catch (e) {
        console.log('No real data found, using demo data')
      }
      
      // Fall back to mock data
      setTimeout(() => {
        setData(generateMockData())
        setDataSource('demo')
        setIsLoading(false)
      }, 1500)
    }
    
    loadData()
  }, [])

  const handleDataLoad = (newData) => {
    setData(newData)
    setShowUpload(false)
  }

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loading" />
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Dashboard 
              data={data} 
              dataSource={dataSource}
              onUploadClick={() => setShowUpload(true)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpload && (
          <FileUpload 
            onDataLoad={handleDataLoad} 
            onClose={() => setShowUpload(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function LoadingScreen() {
  const [loadingText, setLoadingText] = useState('INITIALIZING')
  
  useEffect(() => {
    const texts = [
      'INITIALIZING',
      'SCANNING AI METRICS',
      'ANALYZING PATTERNS',
      'LOADING DASHBOARD'
    ]
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % texts.length
      setLoadingText(texts[i])
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div 
      className="loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="loading-content">
        <motion.div 
          className="loading-logo"
          animate={{ 
            boxShadow: [
              '0 0 20px rgba(0, 245, 255, 0.4)',
              '0 0 60px rgba(0, 245, 255, 0.8)',
              '0 0 20px rgba(0, 245, 255, 0.4)'
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg viewBox="0 0 100 100" className="cursor-icon">
            <path d="M25 20 L75 50 L25 80 L35 50 Z" fill="url(#loadingGrad)"/>
            <defs>
              <linearGradient id="loadingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f5ff" />
                <stop offset="100%" stopColor="#00ff88" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        
        <motion.h1 
          className="loading-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          CURSOR AI ANALYZER
        </motion.h1>
        
        <div className="loading-bar-container">
          <motion.div 
            className="loading-bar"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />
        </div>
        
        <motion.p 
          className="loading-text"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {loadingText}
        </motion.p>
      </div>

      {/* Animated background particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

export default App

