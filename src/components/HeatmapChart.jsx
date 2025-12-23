import { motion } from 'framer-motion'
import './HeatmapChart.css'

function HeatmapChart({ data }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getColor = (intensity) => {
    if (intensity < 0.1) return 'rgba(0, 245, 255, 0.05)'
    if (intensity < 0.3) return 'rgba(0, 245, 255, 0.15)'
    if (intensity < 0.5) return 'rgba(0, 245, 255, 0.3)'
    if (intensity < 0.7) return 'rgba(0, 245, 255, 0.5)'
    if (intensity < 0.85) return 'rgba(0, 255, 136, 0.6)'
    return 'rgba(0, 255, 136, 0.8)'
  }

  const getCellData = (day, hour) => {
    return data.find(d => d.day === day && d.hour === hour)
  }

  return (
    <div className="heatmap-chart">
      <div className="heatmap-grid">
        {/* Hour labels */}
        <div className="heatmap-hour-labels">
          <div className="heatmap-corner"></div>
          {hours.filter((_, i) => i % 3 === 0).map(hour => (
            <div key={hour} className="heatmap-hour-label">
              {hour === 0 ? '12a' : hour === 12 ? '12p' : hour > 12 ? `${hour - 12}p` : `${hour}a`}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {days.map((day, dayIndex) => (
          <div key={day} className="heatmap-row">
            <div className="heatmap-day-label">{day}</div>
            <div className="heatmap-cells">
              {hours.map((hour, hourIndex) => {
                const cellData = getCellData(day, hour)
                const intensity = cellData?.intensity || 0
                
                return (
                  <motion.div
                    key={`${day}-${hour}`}
                    className="heatmap-cell"
                    style={{ backgroundColor: getColor(intensity) }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      delay: (dayIndex * 24 + hourIndex) * 0.003,
                      type: 'spring',
                      stiffness: 200
                    }}
                    whileHover={{ 
                      scale: 1.5, 
                      zIndex: 10,
                      boxShadow: intensity > 0.3 ? '0 0 15px rgba(0, 255, 136, 0.5)' : 'none'
                    }}
                    title={`${day} ${hour}:00 - ${cellData?.conversations || 0} conversations`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        <div className="heatmap-legend-scale">
          {[0.05, 0.2, 0.4, 0.6, 0.8].map((intensity, i) => (
            <div 
              key={i}
              className="heatmap-legend-cell"
              style={{ backgroundColor: getColor(intensity) }}
            />
          ))}
        </div>
        <span className="heatmap-legend-label">More</span>
      </div>
    </div>
  )
}

export default HeatmapChart

