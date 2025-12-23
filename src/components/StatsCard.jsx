import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import './StatsCard.css'

function StatsCard({ title, value, icon: Icon, color, trend, subtitle }) {
  const isPositive = trend >= 0

  return (
    <motion.div 
      className={`stats-card stats-card--${color}`}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="stats-card-header">
        <div className={`stats-card-icon stats-card-icon--${color}`}>
          <Icon size={22} />
        </div>
        <div className={`stats-card-trend ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{isPositive ? '+' : ''}{trend}%</span>
        </div>
      </div>
      
      <div className="stats-card-body">
        <motion.h3 
          className="stats-card-value"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          {value}
        </motion.h3>
        <p className="stats-card-title">{title}</p>
        <span className="stats-card-subtitle">{subtitle}</span>
      </div>

      {/* Animated glow effect */}
      <div className={`stats-card-glow stats-card-glow--${color}`}></div>
    </motion.div>
  )
}

export default StatsCard

