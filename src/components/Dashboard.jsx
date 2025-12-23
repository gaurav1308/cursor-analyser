import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, Code, Clock, TrendingUp, 
  Zap, Upload, Calendar, Flame, Target,
  FileCode, FolderOpen, Activity
} from 'lucide-react'
import StatsCard from './StatsCard'
import ActivityChart from './ActivityChart'
import TaskPieChart from './TaskPieChart'
import HeatmapChart from './HeatmapChart'
import RecentConversations from './RecentConversations'
import InsightsPanel from './InsightsPanel'
import LanguageChart from './LanguageChart'
import DateRangeSelector from './DateRangeSelector'
import './Dashboard.css'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
}

function Dashboard({ data, dataSource, onUploadClick }) {
  const { summary, dailyActivity, taskBreakdown, languageBreakdown, 
          conversations, hourlyHeatmap, insights, streakDays, 
          trends, dayOfWeekBreakdown, monthlyTrends, topProjects } = data

  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last 30 days',
    days: 30,
  })

  // Filter data based on date range
  const filteredData = useMemo(() => {
    if (!dailyActivity || dailyActivity.length === 0) {
      return { dailyActivity: [], summary, trends: trends || {} }
    }

    // If "All time" selected (no start date), return all data
    if (!dateRange.start || dateRange.days === null) {
      return { 
        dailyActivity, 
        summary: {
          ...summary,
          activeDays: dailyActivity.length,
          avgPerDay: Math.round(summary.totalConversations / dailyActivity.length) || 0,
        },
        trends: trends || {}
      }
    }

    const startDate = new Date(dateRange.start)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(dateRange.end)
    endDate.setHours(23, 59, 59, 999)

    const filtered = dailyActivity.filter(day => {
      const dayDate = new Date(day.date)
      return dayDate >= startDate && dayDate <= endDate
    })

    // Recalculate summary for filtered range
    const totalConversations = filtered.reduce((sum, d) => sum + (d.conversations || 0), 0)
    const totalLinesGenerated = filtered.reduce((sum, d) => sum + (d.linesGenerated || 0), 0)
    const totalTimeSaved = filtered.reduce((sum, d) => sum + (d.timeSaved || 0), 0)
    const activeDays = filtered.length
    const avgPerDay = activeDays > 0 ? Math.round(totalConversations / activeDays) : 0

    const filteredSummary = {
      ...summary,
      totalConversations,
      totalLinesGenerated,
      totalTimeSaved,
      activeDays,
      avgPerDay,
    }

    // Calculate trends for filtered period
    const midPoint = new Date((startDate.getTime() + endDate.getTime()) / 2)
    const firstHalf = filtered.filter(d => new Date(d.date) < midPoint)
    const secondHalf = filtered.filter(d => new Date(d.date) >= midPoint)
    
    const firstHalfTotal = firstHalf.reduce((sum, d) => sum + (d.conversations || 0), 0)
    const secondHalfTotal = secondHalf.reduce((sum, d) => sum + (d.conversations || 0), 0)
    const periodGrowth = firstHalfTotal > 0 
      ? Math.round(((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100) 
      : 0

    // Find peak day in filtered range
    const dayTotals = {}
    filtered.forEach(d => {
      const dayName = new Date(d.date).toLocaleDateString('en-US', { weekday: 'long' })
      dayTotals[dayName] = (dayTotals[dayName] || 0) + (d.conversations || 0)
    })
    const bestDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    const filteredTrends = {
      thisWeek: secondHalfTotal,
      lastWeek: firstHalfTotal,
      weekOverWeekGrowth: periodGrowth,
      peakHour: trends?.peakHour || 14,
      bestDay,
    }

    return { 
      dailyActivity: filtered, 
      summary: filteredSummary,
      trends: filteredTrends,
    }
  }, [dateRange, dailyActivity, summary, trends])

  const displaySummary = filteredData.summary
  const displayDailyActivity = filteredData.dailyActivity
  const displayTrends = filteredData.trends

  return (
    <div className="dashboard">
      {/* Header */}
      <motion.header 
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-left">
          <div className="logo">
            <svg viewBox="0 0 100 100" className="logo-icon">
              <path d="M25 20 L75 50 L25 80 L35 50 Z" fill="url(#headerGrad)"/>
              <defs>
                <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f5ff" />
                  <stop offset="100%" stopColor="#00ff88" />
                </linearGradient>
              </defs>
            </svg>
            <div className="logo-text">
              <h1>CURSOR AI</h1>
              <span className="logo-subtitle">ANALYTICS DASHBOARD</span>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <DateRangeSelector 
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          
          {dataSource === 'real' && (
            <div className="data-badge real">
              <Zap size={14} />
              <span>Live Data</span>
            </div>
          )}
          {dataSource === 'demo' && (
            <div className="data-badge demo">
              <span>Demo Mode</span>
            </div>
          )}
          
          <div className="streak-badge">
            <Flame className="streak-icon" />
            <span className="streak-count">{streakDays}</span>
            <span className="streak-label">day streak</span>
          </div>
          
          <motion.button 
            className="upload-btn"
            onClick={onUploadClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Upload size={18} />
            <span>Import Data</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main 
        className="dashboard-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Stats Row */}
        <motion.div className="stats-row" variants={itemVariants}>
          <StatsCard
            title="Total Conversations"
            value={displaySummary.totalConversations.toLocaleString()}
            icon={MessageSquare}
            color="cyan"
            trend={+15}
            subtitle={dateRange.label}
          />
          <StatsCard
            title="Lines Generated"
            value={displaySummary.totalLinesGenerated.toLocaleString()}
            icon={Code}
            color="green"
            trend={+23}
            subtitle="of quality code"
          />
          <StatsCard
            title="Hours Saved"
            value={displaySummary.totalTimeSaved.toLocaleString()}
            icon={Clock}
            color="purple"
            trend={+18}
            subtitle="productivity boost"
          />
          <StatsCard
            title="Acceptance Rate"
            value={`${displaySummary.avgAcceptance}%`}
            icon={Target}
            color="orange"
            trend={+5}
            subtitle="code accepted"
          />
        </motion.div>

        {/* Secondary Stats */}
        <motion.div className="secondary-stats" variants={itemVariants}>
          <div className="mini-stat">
            <FolderOpen className="mini-stat-icon" />
            <div className="mini-stat-content">
              <span className="mini-stat-value">{displaySummary.projectsAssisted || topProjects?.length || 0}</span>
              <span className="mini-stat-label">Projects</span>
            </div>
          </div>
          <div className="mini-stat">
            <FileCode className="mini-stat-icon" />
            <div className="mini-stat-content">
              <span className="mini-stat-value">{displaySummary.filesModified}</span>
              <span className="mini-stat-label">Files Modified</span>
            </div>
          </div>
          <div className="mini-stat">
            <Calendar className="mini-stat-icon" />
            <div className="mini-stat-content">
              <span className="mini-stat-value">{displaySummary.activeDays || streakDays}</span>
              <span className="mini-stat-label">Active Days</span>
            </div>
          </div>
          <div className="mini-stat">
            <Activity className="mini-stat-icon" />
            <div className="mini-stat-content">
              <span className="mini-stat-value">{displaySummary.avgPerDay || Math.round(displaySummary.totalConversations / (displaySummary.activeDays || 1))}</span>
              <span className="mini-stat-label">Avg/Day</span>
            </div>
          </div>
        </motion.div>

        {/* Trends Row */}
        {displayTrends && (
          <motion.div className="trends-row" variants={itemVariants}>
            <div className="trend-card">
              <div className="trend-header">
                <span className="trend-label">Period Trend</span>
                <span className={`trend-badge ${displayTrends.weekOverWeekGrowth >= 0 ? 'positive' : 'negative'}`}>
                  {displayTrends.weekOverWeekGrowth >= 0 ? '+' : ''}{displayTrends.weekOverWeekGrowth}%
                </span>
              </div>
              <div className="trend-value">{displayTrends.thisWeek}</div>
              <div className="trend-compare">vs {displayTrends.lastWeek} prior period</div>
            </div>
            <div className="trend-card">
              <div className="trend-header">
                <span className="trend-label">Peak Hour</span>
                <Zap size={14} className="trend-icon" />
              </div>
              <div className="trend-value">{displayTrends.peakHour}:00</div>
              <div className="trend-compare">Most productive time</div>
            </div>
            <div className="trend-card">
              <div className="trend-header">
                <span className="trend-label">Best Day</span>
                <Flame size={14} className="trend-icon" />
              </div>
              <div className="trend-value">{displayTrends.bestDay}</div>
              <div className="trend-compare">Most active day</div>
            </div>
            <div className="trend-card">
              <div className="trend-header">
                <span className="trend-label">Active Days</span>
                <Calendar size={14} className="trend-icon" />
              </div>
              <div className="trend-value">{displaySummary.activeDays || 0}</div>
              <div className="trend-compare">~{displaySummary.avgPerDay || 0} conv/day</div>
            </div>
          </motion.div>
        )}

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Activity Chart - Full Width */}
          <motion.div className="chart-card activity-chart-card" variants={itemVariants}>
            <div className="chart-header">
              <h2>
                <Calendar size={18} />
                Daily Activity
              </h2>
              <div className="chart-header-right">
                <span className="chart-range-label">{dateRange.label}</span>
                <div className="chart-legend">
                  <span className="legend-item cyan">
                    <span className="legend-dot"></span>
                    Conversations
                  </span>
                  <span className="legend-item green">
                    <span className="legend-dot"></span>
                    Lines Generated
                  </span>
                </div>
              </div>
            </div>
            <ActivityChart 
              key={`activity-${dateRange.label}-${displayDailyActivity.length}`} 
              data={displayDailyActivity} 
            />
          </motion.div>

          {/* Task Breakdown */}
          <motion.div className="chart-card" variants={itemVariants}>
            <div className="chart-header">
              <h2>
                <Zap size={18} />
                Task Breakdown
              </h2>
            </div>
            <TaskPieChart data={taskBreakdown} />
          </motion.div>

          {/* Language Distribution */}
          <motion.div className="chart-card" variants={itemVariants}>
            <div className="chart-header">
              <h2>
                <Code size={18} />
                Languages Used
              </h2>
            </div>
            <LanguageChart data={languageBreakdown} />
          </motion.div>

          {/* Heatmap */}
          <motion.div className="chart-card heatmap-card" variants={itemVariants}>
            <div className="chart-header">
              <h2>
                <Activity size={18} />
                Activity Heatmap
              </h2>
              <span className="chart-subtitle">When you code with AI</span>
            </div>
            <HeatmapChart data={hourlyHeatmap} />
          </motion.div>

          {/* Recent Conversations */}
          <motion.div className="chart-card conversations-card" variants={itemVariants}>
            <div className="chart-header">
              <h2>
                <MessageSquare size={18} />
                Recent Sessions
              </h2>
            </div>
            <RecentConversations conversations={conversations} />
          </motion.div>

          {/* Insights Panel */}
          <motion.div className="chart-card insights-card" variants={itemVariants}>
            <div className="chart-header">
              <h2>
                <TrendingUp size={18} />
                AI Insights
              </h2>
            </div>
            <InsightsPanel insights={insights} />
          </motion.div>
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>
          <span className="pulse-dot"></span>
          {dataSource === 'real' ? 'Your real Cursor AI usage data' : 'Demo data • Import your data to see real stats'}
        </p>
        <p className="footer-tagline">Powered by Cursor AI ⚡</p>
      </footer>
    </div>
  )
}

export default Dashboard

