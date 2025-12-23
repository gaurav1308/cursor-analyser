import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, X, FileJson, CheckCircle, AlertCircle } from 'lucide-react'
import { parseCursorData } from '../utils/dataParser'
import './FileUpload.css'

function FileUpload({ onDataLoad, onClose }) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [error, setError] = useState('')

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      processFile(droppedFile)
    }
  }, [])

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  const processFile = async (file) => {
    setFile(file)
    setStatus('loading')
    setError('')

    try {
      const text = await file.text()
      const data = parseCursorData(text)
      
      setTimeout(() => {
        setStatus('success')
        setTimeout(() => {
          onDataLoad(data)
        }, 1000)
      }, 1500)
    } catch (err) {
      setStatus('error')
      setError('Failed to parse file. Please ensure it\'s valid JSON.')
    }
  }

  const handleUseDemoData = () => {
    onClose()
  }

  return (
    <motion.div 
      className="file-upload-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="file-upload-modal"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="upload-header">
          <h2>Import Cursor Data</h2>
          <p>Upload your Cursor usage data or use the demo to explore</p>
        </div>

        <div
          className={`dropzone ${isDragging ? 'dragging' : ''} ${status}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {status === 'idle' && (
            <>
              <div className="dropzone-icon">
                <Upload size={32} />
              </div>
              <p className="dropzone-text">
                Drag & drop your JSON file here
              </p>
              <p className="dropzone-subtext">or</p>
              <label className="file-input-label">
                <span>Browse Files</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  hidden
                />
              </label>
            </>
          )}

          {status === 'loading' && (
            <div className="upload-loading">
              <motion.div 
                className="loading-spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p>Analyzing {file?.name}...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="upload-success">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <CheckCircle size={48} />
              </motion.div>
              <p>Data loaded successfully!</p>
            </div>
          )}

          {status === 'error' && (
            <div className="upload-error">
              <AlertCircle size={48} />
              <p>{error}</p>
              <button onClick={() => setStatus('idle')}>Try Again</button>
            </div>
          )}
        </div>

        <div className="upload-divider">
          <span>or continue with</span>
        </div>

        <motion.button
          className="demo-btn"
          onClick={handleUseDemoData}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FileJson size={18} />
          Use Demo Data
        </motion.button>

        <div className="upload-info">
          <h4>How to extract your data:</h4>
          <ul>
            <li>Open terminal in the project folder</li>
            <li>Run: <code>./scripts/extract-data.sh &gt; my-data.json</code></li>
            <li>Upload the generated JSON file here</li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default FileUpload

