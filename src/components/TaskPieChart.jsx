import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts'
import { motion } from 'framer-motion'
import './TaskPieChart.css'

const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent
  } = props

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0 0 15px ${fill})` }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        fill={fill}
        opacity={0.3}
      />
      <text 
        x={cx} 
        y={cy - 10} 
        textAnchor="middle" 
        fill="#e8e8f0"
        style={{ fontFamily: 'Orbitron', fontSize: '1.5rem', fontWeight: 700 }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      <text 
        x={cx} 
        y={cy + 15} 
        textAnchor="middle" 
        fill="#8888aa"
        style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', letterSpacing: '0.05em' }}
      >
        {payload.name}
      </text>
    </g>
  )
}

function TaskPieChart({ data }) {
  const [activeIndex, setActiveIndex] = useState(0)

  const onPieEnter = (_, index) => {
    setActiveIndex(index)
  }

  return (
    <div className="task-pie-chart">
      <div className="pie-container">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              dataKey="value"
              onMouseEnter={onPieEnter}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="transparent"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="pie-legend">
        {data.map((item, index) => (
          <motion.div
            key={item.name}
            className={`pie-legend-item ${activeIndex === index ? 'active' : ''}`}
            onMouseEnter={() => setActiveIndex(index)}
            whileHover={{ x: 4 }}
          >
            <span 
              className="pie-legend-color"
              style={{ background: item.color }}
            />
            <span className="pie-legend-name">{item.name}</span>
            <span className="pie-legend-value">{item.value}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default TaskPieChart

