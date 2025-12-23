import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ComposedChart, Bar
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
    }))
  }, [data])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      return (
        <div className="activity-tooltip">
          <p className="tooltip-date">{label}</p>
          <div className="tooltip-stats">
            <div className="tooltip-stat cyan">
              <span className="tooltip-label">Conversations</span>
              <span className="tooltip-value">{data?.conversations || 0}</span>
            </div>
            <div className="tooltip-stat purple">
              <span className="tooltip-label">Agent Mode</span>
              <span className="tooltip-value">{data?.agentCount || 0}</span>
            </div>
            <div className="tooltip-stat blue">
              <span className="tooltip-label">Chat Mode</span>
              <span className="tooltip-value">{data?.chatCount || 0}</span>
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
          <Bar
            dataKey="agentCount"
            stackId="mode"
            fill="#a855f7"
            radius={[0, 0, 0, 0]}
            isAnimationActive={true}
            animationDuration={800}
          />
          <Bar
            dataKey="chatCount"
            stackId="mode"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            animationDuration={800}
          />
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
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

export default ActivityChart
