import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ComposedChart
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import './ActivityChart.css'

function ActivityChart({ data }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      linesScaled: (d.linesGenerated || 0) / 20, // Scale for dual axis
    }))
  }, [data])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="activity-tooltip">
          <p className="tooltip-date">{label}</p>
          <div className="tooltip-stats">
            <div className="tooltip-stat cyan">
              <span className="tooltip-label">Conversations</span>
              <span className="tooltip-value">{payload[0]?.value}</span>
            </div>
            <div className="tooltip-stat green">
              <span className="tooltip-label">Lines Generated</span>
              <span className="tooltip-value">{payload[1]?.value * 20}</span>
            </div>
            <div className="tooltip-stat purple">
              <span className="tooltip-label">Time Saved</span>
              <span className="tooltip-value">{payload[0]?.payload?.timeSaved} min</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Empty state
  if (!chartData || chartData.length === 0) {
    return (
      <div className="activity-chart activity-chart--empty">
        <motion.div 
          className="empty-state"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BarChart3 size={48} />
          <p>No activity data for this period</p>
          <span>Try selecting a different date range</span>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div 
      className="activity-chart"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#00f5ff" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorLines" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff88" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255,255,255,0.05)" 
            vertical={false}
          />
          <XAxis 
            dataKey="date" 
            stroke="#555577"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#555577"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="conversations"
            stroke="#00f5ff"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorConversations)"
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="linesScaled"
            stroke="#00ff88"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorLines)"
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

export default ActivityChart

