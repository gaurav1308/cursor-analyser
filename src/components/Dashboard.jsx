import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, Code, TrendingUp, 
  Zap, Upload, Calendar, Flame,
  FileCode, FolderOpen, Activity, Bot, MessageCircle, Coins
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
          trends, dayOfWeekBreakdown, monthlyTrends, topProjects,
          modeBreakdown, tokenUsage, daysSinceJoin } = data

  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    label: 'Last 30 days',
    days: 30,
  })

  // Filter data based on date range
  const filteredData = useMemo(() => {
    if (!dailyActivity || dailyActivity.length === 0) {
      return { 
        dailyActivity: [], 
        summary, 
        trends: trends || {},
        modeBreakdown: modeBreakdown || { agent: 0, chat: 0 },
        tokenUsage: tokenUsage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
      }
    }

    // If "All time" selected (no start date), return all data
    if (!dateRange.start || dateRange.days === null) {
      // Calculate all-time streak
      let maxStreak = 0
      let currentStreak = 0
      const sortedDates = dailyActivity.map(d => new Date(d.date)).sort((a, b) => a - b)
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          currentStreak = 1
        } else {
          const diff = (sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24)
          if (diff === 1) {
            currentStreak++
          } else {
            currentStreak = 1
          }
        }
        maxStreak = Math.max(maxStreak, currentStreak)
      }

      const busiestDay = dailyActivity.reduce((max, d) => 
        (d.conversations || 0) > (max.conversations || 0) ? d : max, 
        { date: 'N/A', conversations: 0 }
      )

      // Calculate all-time mode breakdown from daily data
      const allTimeAgentCount = dailyActivity.reduce((sum, d) => sum + (d.agentCount || 0), 0)
      const allTimeChatCount = dailyActivity.reduce((sum, d) => sum + (d.chatCount || 0), 0)
      
      // Calculate all-time token usage from daily data
      const allTimeInputTokens = dailyActivity.reduce((sum, d) => sum + (d.inputTokens || 0), 0)
      const allTimeOutputTokens = dailyActivity.reduce((sum, d) => sum + (d.outputTokens || 0), 0)

      return { 
        dailyActivity, 
        summary: {
          ...summary,
          activeDays: dailyActivity.length,
          avgPerDay: Math.round(summary.totalConversations / dailyActivity.length) || 0,
          maxStreak,
          busiestDay,
        },
        trends: trends || {},
        modeBreakdown: {
          agent: allTimeAgentCount || modeBreakdown?.agent || 0,
          chat: allTimeChatCount || modeBreakdown?.chat || 0,
        },
        tokenUsage: {
          inputTokens: allTimeInputTokens || tokenUsage?.inputTokens || 0,
          outputTokens: allTimeOutputTokens || tokenUsage?.outputTokens || 0,
          totalTokens: (allTimeInputTokens + allTimeOutputTokens) || tokenUsage?.totalTokens || 0,
        }
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
    const activeDays = filtered.length
    const avgPerDay = activeDays > 0 ? Math.round(totalConversations / activeDays) : 0
    
    // Calculate mode breakdown from filtered data
    const filteredAgentCount = filtered.reduce((sum, d) => sum + (d.agentCount || 0), 0)
    const filteredChatCount = filtered.reduce((sum, d) => sum + (d.chatCount || 0), 0)
    
    // Calculate token usage from filtered data
    const filteredInputTokens = filtered.reduce((sum, d) => sum + (d.inputTokens || 0), 0)
    const filteredOutputTokens = filtered.reduce((sum, d) => sum + (d.outputTokens || 0), 0)
    
    // Estimate messages (avg ~10 messages per conversation)
    const totalMessages = Math.round(totalConversations * 10)
    
    // Calculate streak (consecutive days) in filtered period
    let maxStreak = 0
    let currentStreak = 0
    const sortedDates = filtered.map(d => new Date(d.date)).sort((a, b) => a - b)
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1
      } else {
        const diff = (sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24)
        if (diff === 1) {
          currentStreak++
        } else {
          currentStreak = 1
        }
      }
      maxStreak = Math.max(maxStreak, currentStreak)
    }

    // Find busiest day with count
    const busiestDay = filtered.reduce((max, d) => 
      (d.conversations || 0) > (max.conversations || 0) ? d : max, 
      { date: 'N/A', conversations: 0 }
    )

    const filteredSummary = {
      ...summary,
      totalConversations,
      totalMessages,
      activeDays,
      avgPerDay,
      maxStreak,
      busiestDay,
    }

    // Calculate filtered mode breakdown
    const filteredModeBreakdown = {
      agent: filteredAgentCount,
      chat: filteredChatCount,
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

    const filteredTokenUsage = {
      inputTokens: filteredInputTokens,
      outputTokens: filteredOutputTokens,
      totalTokens: filteredInputTokens + filteredOutputTokens,
    }

    return { 
      dailyActivity: filtered, 
      summary: filteredSummary,
      trends: filteredTrends,
      modeBreakdown: filteredModeBreakdown,
      tokenUsage: filteredTokenUsage,
    }
  }, [dateRange, dailyActivity, summary, trends, modeBreakdown, tokenUsage])

  const displaySummary = filteredData.summary
  const displayDailyActivity = filteredData.dailyActivity
  const displayTrends = filteredData.trends
  const displayModeBreakdown = filteredData.modeBreakdown || modeBreakdown
  const displayTokenUsage = filteredData.tokenUsage || tokenUsage

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
          
          {daysSinceJoin > 0 && (
            <div className="join-badge" title="Days since you started using Cursor">
              <Calendar className="join-icon" />
              <span className="join-count">{daysSinceJoin}</span>
              <span className="join-label">days</span>
            </div>
          )}
          
          <div className="streak-badge" title="Consecutive days with AI activity">
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
            title="Conversations"
            value={displaySummary.totalConversations.toLocaleString()}
            icon={MessageSquare}
            color="cyan"
            trend={null}
            subtitle={dateRange.label}
            tooltip="Total AI conversations (Agent + Chat sessions) in the selected date range"
          />
          <StatsCard
            title="Messages"
            value={displaySummary.totalMessages?.toLocaleString() || '0'}
            icon={MessageCircle}
            color="green"
            trend={null}
            subtitle={dateRange.label}
            tooltip="Estimated total chat messages exchanged with AI in the selected period (~10 per conversation)"
          />
          <StatsCard
            title="Active Days"
            value={displaySummary.activeDays || 0}
            icon={Calendar}
            color="purple"
            trend={null}
            subtitle={`~${displaySummary.avgPerDay || 0}/day`}
            tooltip="Number of days with at least one AI conversation in the selected period"
          />
          <StatsCard
            title="Best Streak"
            value={`${displaySummary.maxStreak || 0} days`}
            icon={Flame}
            color="orange"
            trend={null}
            subtitle="consecutive days"
            tooltip="Longest streak of consecutive days with AI activity in the selected period"
          />
        </motion.div>

        {/* Secondary Stats - Cumulative Totals */}
        <motion.div className="secondary-stats" variants={itemVariants}>
          <div className="mini-stat" title="Total unique projects where AI assisted with code">
            <FolderOpen className="mini-stat-icon" />
            <div className="mini-stat-content">
              <span className="mini-stat-value">{summary.projectsAssisted || topProjects?.length || 0}</span>
              <span className="mini-stat-label">Projects</span>
            </div>
          </div>
          <div className="mini-stat" title="Total files modified with AI assistance">
            <FileCode className="mini-stat-icon" />
            <div className="mini-stat-content">
              <span className="mini-stat-value">{summary.filesModified || 0}</span>
              <span className="mini-stat-label">Files</span>
            </div>
          </div>
          <div className="mini-stat" title={`Tokens sent to AI (context + prompts) - ${dateRange.label}`}>
            <Coins className="mini-stat-icon" />
            <div className="mini-stat-content">
              <span className="mini-stat-value">{((displayTokenUsage?.inputTokens || 0) / 1000000).toFixed(2)}M</span>
              <span className="mini-stat-label">Input</span>
            </div>
          </div>
          <div className="mini-stat" title={`Tokens generated by AI (responses + code) - ${dateRange.label}`}>
            <Code className="mini-stat-icon" />
            <div className="mini-stat-content">
              <span className="mini-stat-value">{((displayTokenUsage?.outputTokens || 0) / 1000000).toFixed(2)}M</span>
              <span className="mini-stat-label">Output</span>
            </div>
          </div>
        </motion.div>

        {/* Trends Row */}
        {displayTrends && (
          <motion.div className="trends-row" variants={itemVariants}>
            <div className="trend-card" title="Compares first half vs second half of selected period to show growth trend">
              <div className="trend-header">
                <span className="trend-label">Period Trend</span>
                <span className={`trend-badge ${displayTrends.weekOverWeekGrowth >= 0 ? 'positive' : 'negative'}`}>
                  {displayTrends.weekOverWeekGrowth >= 0 ? '+' : ''}{displayTrends.weekOverWeekGrowth}%
                </span>
              </div>
              <div className="trend-value">{displayTrends.thisWeek}</div>
              <div className="trend-compare">vs {displayTrends.lastWeek} prior period</div>
            </div>
            <div className="trend-card" title="Hour of the day when you have the most AI conversations">
              <div className="trend-header">
                <span className="trend-label">Peak Hour</span>
                <Zap size={14} className="trend-icon" />
              </div>
              <div className="trend-value">{displayTrends.peakHour}:00</div>
              <div className="trend-compare">Most productive time</div>
            </div>
            <div className="trend-card" title="Day of the week with highest AI activity in selected period">
              <div className="trend-header">
                <span className="trend-label">Best Day</span>
                <Flame size={14} className="trend-icon" />
              </div>
              <div className="trend-value">{displayTrends.bestDay}</div>
              <div className="trend-compare">Most active day</div>
            </div>
            <div className="trend-card" title="Days with at least one AI conversation and average conversations per day">
              <div className="trend-header">
                <span className="trend-label">Active Days</span>
                <Calendar size={14} className="trend-icon" />
              </div>
              <div className="trend-value">{displaySummary.activeDays || 0}</div>
              <div className="trend-compare">~{displaySummary.avgPerDay || 0} conv/day</div>
            </div>
          </motion.div>
        )}

        {/* Mode Stats Row */}
        {displayModeBreakdown && (
          <motion.div className="trends-row mode-token-row" variants={itemVariants}>
            <div className="trend-card agent-card" title="Agent mode: AI can execute code, run terminal commands, and make file changes autonomously">
              <div className="trend-header">
                <span className="trend-label">Agent Mode</span>
                <Bot size={14} className="trend-icon" />
              </div>
              <div className="trend-value">{(displayModeBreakdown.agent || 0).toLocaleString()}</div>
              <div className="trend-compare">
                {displayModeBreakdown.agent + displayModeBreakdown.chat > 0 
                  ? Math.round((displayModeBreakdown.agent / (displayModeBreakdown.agent + displayModeBreakdown.chat)) * 100)
                  : 0}% of sessions • {dateRange.label}
              </div>
            </div>
            <div className="trend-card chat-card" title="Chat mode: Conversational AI assistance for questions, explanations, and code suggestions">
              <div className="trend-header">
                <span className="trend-label">Chat Mode</span>
                <MessageCircle size={14} className="trend-icon" />
              </div>
              <div className="trend-value">{(displayModeBreakdown.chat || 0).toLocaleString()}</div>
              <div className="trend-compare">
                {displayModeBreakdown.agent + displayModeBreakdown.chat > 0 
                  ? Math.round((displayModeBreakdown.chat / (displayModeBreakdown.agent + displayModeBreakdown.chat)) * 100)
                  : 0}% of sessions • {dateRange.label}
              </div>
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
                    Total
                  </span>
                  <span className="legend-item purple">
                    <span className="legend-dot"></span>
                    Agent
                  </span>
                  <span className="legend-item blue">
                    <span className="legend-dot"></span>
                    Chat
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

