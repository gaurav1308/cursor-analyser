import { motion } from 'framer-motion'
import { TrendingUp, Clock, Zap, Bug, Lightbulb, AlertCircle } from 'lucide-react'
import './InsightsPanel.css'

const iconMap = {
  'trending-up': TrendingUp,
  'clock': Clock,
  'zap': Zap,
  'bug': Bug,
  'lightbulb': Lightbulb,
  'alert': AlertCircle,
}

function InsightsPanel({ insights }) {
  return (
    <div className="insights-panel">
      {insights.map((insight, index) => {
        const Icon = iconMap[insight.icon] || Lightbulb

        return (
          <motion.div
            key={index}
            className={`insight-item insight-item--${insight.type}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="insight-icon">
              <Icon size={16} />
            </div>
            <p className="insight-message">{insight.message}</p>
          </motion.div>
        )
      })}

      <div className="insights-cta">
        <Lightbulb size={14} />
        <span>AI analyzing your patterns...</span>
      </div>
    </div>
  )
}

export default InsightsPanel

