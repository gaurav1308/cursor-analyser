import { motion } from 'framer-motion'
import { Sparkles, Bug, RefreshCw, FileText, Zap } from 'lucide-react'
import './RecentConversations.css'

const typeIcons = {
  feature: { icon: Sparkles, color: '#00f5ff' },
  bugfix: { icon: Bug, color: '#ff0080' },
  refactor: { icon: RefreshCw, color: '#bf00ff' },
  docs: { icon: FileText, color: '#f0ff00' },
  optimization: { icon: Zap, color: '#00ff88' },
}

function RecentConversations({ conversations }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)} min ago`
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)} hours ago`
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="recent-conversations">
      {conversations.map((conv, index) => {
        const typeConfig = typeIcons[conv.type] || typeIcons.feature
        const Icon = typeConfig.icon

        return (
          <motion.div
            key={conv.id}
            className="conversation-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ x: 8, backgroundColor: 'rgba(255,255,255,0.02)' }}
          >
            <div 
              className="conversation-icon"
              style={{ 
                backgroundColor: `${typeConfig.color}15`,
                color: typeConfig.color
              }}
            >
              <Icon size={16} />
            </div>
            
            <div className="conversation-content">
              <h4 className="conversation-title">{conv.title}</h4>
              <div className="conversation-meta">
                <span className="conversation-time">{formatTime(conv.timestamp)}</span>
                <span className="conversation-divider">•</span>
                <span className="conversation-lines">{conv.linesGenerated} lines</span>
              </div>
            </div>

            <div 
              className="conversation-badge"
              style={{ 
                backgroundColor: `${typeConfig.color}15`,
                color: typeConfig.color,
                borderColor: `${typeConfig.color}30`
              }}
            >
              {conv.type}
            </div>
          </motion.div>
        )
      })}

      <motion.button 
        className="view-all-btn"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        View All Sessions →
      </motion.button>
    </div>
  )
}

export default RecentConversations

