import { motion } from 'framer-motion'
import './LanguageChart.css'

function LanguageChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="language-chart">
      {data.map((lang, index) => (
        <motion.div
          key={lang.name}
          className="language-bar-container"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="language-info">
            <span className="language-name">{lang.name}</span>
            <span className="language-value">{lang.value}%</span>
          </div>
          <div className="language-bar-bg">
            <motion.div
              className="language-bar"
              style={{ backgroundColor: lang.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(lang.value / maxValue) * 100}%` }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.5, ease: 'easeOut' }}
            >
              <div 
                className="language-bar-glow"
                style={{ background: lang.color }}
              />
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default LanguageChart

