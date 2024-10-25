import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import React from "react";

const GraphSkeleton = ({
  width,
  height,
  xTicks = 5,
  yTicks = 5,
  linePoints,
  gridColor = "currentColor",
  lineColor = "currentColor",
  lineWidth = 2,
  animate = true,
}) => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
  >
    <rect
      width="100%"
      height="100%"
      fill="none"
      stroke={gridColor}
      strokeWidth="0.5"
      className="text-muted"
    />
    {/* Y-axis ticks */}
    {[...Array(yTicks)].map((_, i) => {
      const y = (i / (yTicks - 1)) * 100;
      return (
        <line
          key={`y-${i}`}
          x1="0"
          y1={y}
          x2="100"
          y2={y}
          stroke={gridColor}
          strokeWidth="0.5"
          className="text-muted"
        />
      );
    })}
    {/* X-axis ticks */}
    {[...Array(xTicks)].map((_, i) => {
      const x = (i / (xTicks - 1)) * 100;
      return (
        <line
          key={`x-${i}`}
          x1={x}
          y1="0"
          x2={x}
          y2="100"
          stroke={gridColor}
          strokeWidth="0.5"
          className="text-muted"
        />
      );
    })}
    {/* Placeholder line */}
    <polyline
      points={linePoints}
      fill="none"
      stroke={lineColor}
      strokeWidth={lineWidth}
      className={`text-primary ${animate ? "animate-pulse" : ""}`}
    />
  </svg>
);

const SkeletonItem = ({ className, customStyles }) => (
  <Skeleton className={className} style={customStyles} />
);

export default function CustomizableGraphComponent({
  title = "Graph Title",
  width = "w-full max-w-3xl",
  height = "h-[300px]",
  xAxisItems = 6,
  showLegend = true,
  legendItems = 3,
  linePoints = "0,90 20,60 40,80 60,20 80,50 100,30",
  cardClassName = "",
  headerClassName = "flex flex-row items-center justify-between space-y-0 pb-2",
  titleClassName = "text-2xl font-bold",
  contentClassName = "",
  gridColor = "currentColor",
  lineColor = "currentColor",
  lineWidth = 2,
  animate = true,
  xTicks = 5,
  yTicks = 5,
  skeletonColor = "",
  customSkeletonStyles = {},
}) {
  return (
    <Card className={`${width} ${cardClassName}`}>
      <CardHeader className={headerClassName}>
        <CardTitle className={titleClassName}>{title}</CardTitle>
        <SkeletonItem
          className={`h-4 w-[100px] ${skeletonColor}`}
          customStyles={customSkeletonStyles}
        />
      </CardHeader>
      <CardContent className={contentClassName}>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <SkeletonItem
              className={`h-4 w-[100px] ${skeletonColor}`}
              customStyles={customSkeletonStyles}
            />
            <SkeletonItem
              className={`h-4 w-[60px] ${skeletonColor}`}
              customStyles={customSkeletonStyles}
            />
          </div>
          <div className={`${height} w-full`} aria-label="Graph skeleton">
            <GraphSkeleton
              linePoints={linePoints}
              xTicks={xTicks}
              yTicks={yTicks}
              gridColor={gridColor}
              lineColor={lineColor}
              lineWidth={lineWidth}
              animate={animate}
            />
          </div>
          <div className="flex justify-between">
            {[...Array(xAxisItems)].map((_, i) => (
              <SkeletonItem
                key={i}
                className={`h-4 w-[40px] ${skeletonColor}`}
                customStyles={customSkeletonStyles}
              />
            ))}
          </div>
        </div>
        {showLegend && (
          <div className="mt-4 flex items-center justify-between">
            <SkeletonItem
              className={`h-4 w-[100px] ${skeletonColor}`}
              customStyles={customSkeletonStyles}
            />
            <div className="flex space-x-2">
              {[...Array(legendItems)].map((_, i) => (
                <SkeletonItem
                  key={i}
                  className={`h-8 w-8 rounded-full ${skeletonColor}`}
                  customStyles={customSkeletonStyles}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
