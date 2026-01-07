'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

export function BurnrateAnimation({
  onComplete,
}: {
  onComplete?: () => void
}) {
  const isMobile = useIsMobile()
  const [showGraph, setShowGraph] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [pathLength, setPathLength] = useState(0)
  const [areaOpacity, setAreaOpacity] = useState(0)
  const [showAverageLine, setShowAverageLine] = useState(false)

  useEffect(() => {
    setShowGraph(false)
    setShowMetrics(false)
    setShowSummary(false)
    setPathLength(0)
    setAreaOpacity(0)
    setShowAverageLine(false)

    const graphTimer = setTimeout(() => setShowGraph(true), 300)

    let done: NodeJS.Timeout | undefined
    if (onComplete) {
      done = setTimeout(() => {
        onComplete()
      }, 10000)
    }

    return () => {
      clearTimeout(graphTimer)
      if (done) clearTimeout(done)
    }
  }, [onComplete])

  useEffect(() => {
    if (!onComplete) {
      const interval = setInterval(() => {
        setShowGraph(false)
        setShowMetrics(false)
        setShowSummary(false)
        setPathLength(0)
        setAreaOpacity(0)
        setShowAverageLine(false)
        const graphTimer = setTimeout(() => setShowGraph(true), 300)
        return () => {
          clearTimeout(graphTimer)
        }
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [onComplete])

  // Sequential reveal
  useEffect(() => {
    if (showGraph) {
      // Show graph immediately without animation
      setPathLength(1)
      setAreaOpacity(1)
      // Animate average line
      setTimeout(() => {
        setShowAverageLine(true)
      }, 300)

      const metricsTimer = setTimeout(() => setShowMetrics(true), 1200)
      const summaryTimer = setTimeout(() => setShowSummary(true), 1800)
      return () => {
        clearTimeout(metricsTimer)
        clearTimeout(summaryTimer)
      }
    }
  }, [showGraph])

  // Burn rate data points (Oct to Apr) - values in thousands
  const dataPoints = [
    { month: 'Oct', value: 4.5 },
    { month: 'Nov', value: 5.0 },
    { month: 'Dec', value: 5.8 },
    { month: 'Jan', value: 6.3 },
    { month: 'Feb', value: 6.8 },
    { month: 'Mar', value: 7.2 },
    { month: 'Apr', value: 7.5 },
  ]

  const maxValue = 15
  const averageValue = 6
  const graphWidth = 500
  const graphHeight = isMobile ? 180 : 280
  const paddingLeft = 40
  const paddingRight = 25
  const paddingTop = 10
  const paddingBottom = 25
  const chartWidth = graphWidth - paddingLeft - paddingRight
  const chartHeight = graphHeight - paddingTop - paddingBottom

  // Convert data points to SVG coordinates
  const points = dataPoints.map((point, idx) => {
    const divisor = dataPoints.length > 1 ? dataPoints.length - 1 : 1
    const x = paddingLeft + (idx / divisor) * chartWidth
    const y = paddingTop + chartHeight - (point.value / maxValue) * chartHeight
    return { x, y, month: point.month, value: point.value }
  })

  // Create path for line
  const pathData = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  // Create area path (line + bottom)
  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]
  const areaPath =
    lastPoint && firstPoint
      ? `${pathData} L ${lastPoint.x} ${paddingTop + chartHeight} L ${firstPoint.x} ${paddingTop + chartHeight} Z`
      : ''

  const averageY =
    paddingTop + chartHeight - (averageValue / maxValue) * chartHeight

  // Grid lines
  const gridLines = [0, 3, 6, 9, 12, 15].map((value) => {
    const y = paddingTop + chartHeight - (value / maxValue) * chartHeight
    return { y, value }
  })

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Header */}
      <div className="px-2 md:px-3 pt-2 md:pt-3 pb-1.5 md:pb-2 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] md:text-[14px] font-sans text-foreground">
            Monthly Burn Rate
          </h3>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div
                className="w-2 h-2 bg-foreground"
                style={{ borderRadius: '0' }}
              />
              <span className="text-[8px] md:text-[9px] font-sans text-muted-foreground">
                Current
              </span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <svg width="12" height="2" className="overflow-visible">
                <line
                  x1="0"
                  y1="1"
                  x2="12"
                  y2="1"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              </svg>
              <span className="text-[8px] md:text-[9px] font-sans text-muted-foreground">
                Average
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-2 md:p-3 overflow-hidden flex flex-col">
        <div className="flex flex-col gap-4 pt-2">
          {/* Graph Section */}
          <div className="bg-background border border-border px-2 md:px-4 flex flex-col h-[180px] md:h-[280px] relative">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showGraph ? 1 : 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full"
            >
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                preserveAspectRatio="xMidYMid meet"
                className="overflow-visible"
              >
                {/* Pattern definition for striped area */}
                <defs>
                  <pattern
                    id="burnRatePattern"
                    x="0"
                    y="0"
                    width="8"
                    height="8"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect width="8" height="8" fill="transparent" />
                    <path
                      d="M0,0 L8,8 M-2,6 L6,16 M-4,4 L4,12"
                      stroke="hsl(var(--border))"
                      strokeWidth="1.2"
                      opacity="0.6"
                    />
                  </pattern>
                </defs>

                {/* Grid lines */}
                {gridLines.map((grid, idx) => (
                  <motion.line
                    key={`grid-h-${idx}`}
                    x1={paddingLeft}
                    y1={grid.y}
                    x2={graphWidth - paddingRight}
                    y2={grid.y}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showGraph ? 0.3 : 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  />
                ))}

                {/* Y-axis labels */}
                {gridLines.map((grid, idx) => (
                  <text
                    key={`y-label-${idx}`}
                    x={paddingLeft - 8}
                    y={grid.y + 3}
                    className="text-[8px] md:text-[9px] font-sans fill-muted-foreground"
                    textAnchor="end"
                  >
                    ${grid.value}k
                  </text>
                ))}

                {/* X-axis labels */}
                {points.map((point, idx) => (
                  <text
                    key={`x-label-${idx}`}
                    x={point.x}
                    y={graphHeight - paddingBottom + 15}
                    className="text-[8px] md:text-[9px] font-sans fill-muted-foreground"
                    textAnchor="middle"
                  >
                    {point.month}
                  </text>
                ))}

                {/* Average line (dashed) */}
                <motion.line
                  x1={paddingLeft}
                  y1={averageY}
                  x2={graphWidth - paddingRight}
                  y2={averageY}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showAverageLine ? 1 : 0 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                />

                {/* Area under line with striped pattern */}
                {areaPath && (
                  <motion.path
                    d={areaPath}
                    fill="url(#burnRatePattern)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: areaOpacity }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  />
                )}

                {/* Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="2"
                />

                {/* Data points (circles) */}
                {points.map((point, idx) => (
                  <circle
                    key={`circle-${idx}`}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="hsl(var(--foreground))"
                  />
                ))}
              </svg>
            </motion.div>
          </div>

          {/* Metrics Grid */}
          {showMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              drag={false}
              className="grid grid-cols-2 gap-2 md:gap-3"
            >
              <div className="bg-background border border-border p-2 md:p-3 select-none">
                <div className="text-[8px] md:text-[9px] font-sans text-muted-foreground mb-1">
                  Current Monthly Burn
                </div>
                <div className="text-[14px] md:text-[16px] font-normal font-sans text-foreground">
                  $7,500
                </div>
                <div className="text-[7px] md:text-[8px] font-sans text-muted-foreground mt-1">
                  +5.6% vs last month
                </div>
              </div>
              <div className="bg-background border border-border p-2 md:p-3 select-none">
                <div className="text-[8px] md:text-[9px] font-sans text-muted-foreground mb-1">
                  Runway Remaining
                </div>
                <div className="text-[14px] md:text-[16px] font-normal font-sans text-foreground">
                  10.7 months
                </div>
                <div className="text-[7px] md:text-[8px] font-sans text-muted-foreground mt-1">
                  Below recommended 12+ months
                </div>
              </div>
              <div className="bg-background border border-border p-2 md:p-3 select-none">
                <div className="text-[8px] md:text-[9px] font-sans text-muted-foreground mb-1">
                  Average Burn Rate
                </div>
                <div className="text-[14px] md:text-[16px] font-normal font-sans text-foreground">
                  $6,000
                </div>
                <div className="text-[7px] md:text-[8px] font-sans text-muted-foreground mt-1">
                  Over last 6 months
                </div>
              </div>
              <div className="bg-background border border-border p-2 md:p-3 select-none">
                <div className="text-[8px] md:text-[9px] font-sans text-muted-foreground mb-1">
                  Personnel Costs
                </div>
                <div className="text-[14px] md:text-[16px] font-normal font-sans text-foreground">
                  65%
                </div>
                <div className="text-[7px] md:text-[8px] font-sans text-muted-foreground mt-1">
                  $4,875 of monthly burn
                </div>
              </div>
            </motion.div>
          )}

          {/* Summary Section */}
          {showSummary && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              drag={false}
              className="bg-background border border-border p-2 md:p-3 select-none"
            >
              <h3 className="text-[9px] md:text-[10px] font-sans text-muted-foreground mb-1.5 md:mb-2">
                Summary
              </h3>
              <p className="text-[9px] md:text-[10px] leading-[13px] md:leading-[14px] font-sans text-foreground">
                Burn rate increased 67% over 6 months ($4,500 to $7,500), driven
                by personnel costs (65% of expenses). Current runway of 10.7
                months is below the recommended 12+ months, requiring cost
                optimization or additional funding.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

