"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

interface CalendarEvent {
  id: string;
  day: number; // Day of month (1-31)
  label: string;
  color?: string;
}

interface Project {
  id: string;
  name: string;
  time: string;
  amount: string;
}

const calendarEvents: CalendarEvent[] = [
  { id: "1", day: 1, label: "Acme Corp Website (4h)" },
  { id: "2", day: 2, label: "Mobile App Redesign (3h)" },
  { id: "3", day: 3, label: "Acme Corp Website (6h)" },
  { id: "4", day: 6, label: "E-commerce Platform (6h)" },
  { id: "5", day: 8, label: "Brand Identity Design (3h)" },
  { id: "6", day: 10, label: "Dashboard Analytics (3h)" },
  { id: "7", day: 13, label: "Acme Corp Website (5h)" },
  { id: "8", day: 15, label: "Mobile App Redesign (3h)" },
  { id: "9", day: 20, label: "E-commerce Platform (5h)" },
];

const projects: Project[] = [
  { id: "1", name: "Acme Corp Website", time: "24h", amount: "€12,500" },
  { id: "2", name: "Mobile App Redesign", time: "18h", amount: "€8,900" },
  { id: "3", name: "E-commerce Platform", time: "32h", amount: "€15,200" },
  { id: "4", name: "Brand Identity Design", time: "14h", amount: "€6,500" },
  { id: "5", name: "Dashboard Analytics", time: "20h", amount: "€9,800" },
];

const weekDays = ["MON", "TUE", "WED", "THU", "FRI"];

interface CalendarDay {
  day: number | null;
  isPreviousMonth?: boolean;
  isNextMonth?: boolean;
}

// Generate calendar days for first half of month (days 1-20)
// Month starts on Wednesday (day 3), so first two days are from previous month
// Only showing Monday-Friday (5 days per week)
const generateCalendarDays = (): CalendarDay[] => {
  const days: CalendarDay[] = [];
  // First week - month starts on Wednesday
  // Previous month dates: 29, 30 (assuming 31-day month)
  // Monday (29), Tuesday (30), Wednesday (1), Thursday (2), Friday (3)
  days.push(
    { day: 29, isPreviousMonth: true },
    { day: 30, isPreviousMonth: true },
    { day: 1 },
    { day: 2 },
    { day: 3 },
  );
  // Second week - Monday (6) to Friday (10)
  days.push({ day: 6 }, { day: 7 }, { day: 8 }, { day: 9 }, { day: 10 });
  // Third week - Monday (13) to Friday (17)
  days.push({ day: 13 }, { day: 14 }, { day: 15 }, { day: 16 }, { day: 17 });
  // Fourth week - Monday (20) to Friday (24, but only show up to 20, then next month)
  days.push(
    { day: 20 },
    { day: 21, isNextMonth: true },
    { day: 22, isNextMonth: true },
    { day: 23, isNextMonth: true },
    { day: 24, isNextMonth: true },
  );
  return days;
};

export function TimeTrackingCalendarAnimation() {
  const [visibleEvents, setVisibleEvents] = useState<Set<string>>(new Set());
  const [showProjects, setShowProjects] = useState(true);
  const [selectedView, setSelectedView] = useState<"week" | "month">("month");
  const [currentDate, setCurrentDate] = useState(new Date(2024, 6, 1)); // July 2024
  const calendarDays = generateCalendarDays();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const handlePreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  useEffect(() => {
    // Show projects immediately
    setShowProjects(true);

    const animateEvents = () => {
      // Reset visible events (but keep projects visible)
      setVisibleEvents(new Set());

      // Animate events one by one with staggered delay
      calendarEvents.forEach((event, index) => {
        setTimeout(
          () => {
            setVisibleEvents((prev) => new Set(prev).add(event.id));
          },
          index * 150 + 300,
        ); // 150ms delay between each, start after 300ms
      });
    };

    // Initial animation
    animateEvents();

    // Restart animation every 8 seconds
    const interval = setInterval(() => {
      animateEvents();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const getEventsForDay = (
    day: number | null,
    isPreviousMonth?: boolean,
    isNextMonth?: boolean,
  ) => {
    if (day === null || isPreviousMonth || isNextMonth) return [];
    return calendarEvents.filter((event) => event.day === day);
  };

  return (
    <div className="w-full h-full flex flex-col bg-background m-0 p-0">
      {/* Month Navigation and Tabs */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
        {/* Month Navigation Button */}
        <div className="bg-background border border-border flex items-center gap-2 px-2 py-1.5 h-7">
          <button
            type="button"
            onClick={handlePreviousMonth}
            className="flex items-center justify-center w-4 h-4 transition-colors hover:text-muted-foreground touch-manipulation focus:outline-none focus-visible:outline-none"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <MdChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <span className="text-[10px] sm:text-xs text-foreground whitespace-nowrap">
            {currentMonthName} {currentYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex items-center justify-center w-4 h-4 transition-colors hover:text-muted-foreground touch-manipulation focus:outline-none focus-visible:outline-none"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <MdChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="relative flex items-stretch bg-muted"
          style={{ width: "fit-content" }}
        >
          <div className="flex items-stretch">
            <button
              type="button"
              onClick={() => setSelectedView("week")}
              className={`group relative flex items-center gap-1.5 px-2 py-1 h-7 text-[10px] sm:text-xs whitespace-nowrap border transition-colors touch-manipulation focus:outline-none focus-visible:outline-none ${
                selectedView === "week"
                  ? "text-foreground bg-background border-border"
                  : "text-muted-foreground hover:text-foreground bg-muted border-transparent"
              }`}
              style={{
                WebkitTapHighlightColor: "transparent",
                marginBottom: selectedView === "week" ? "-1px" : "0px",
                position: "relative",
                zIndex: selectedView === "week" ? 10 : 1,
              }}
            >
              <span>Week</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedView("month")}
              className={`group relative flex items-center gap-1.5 px-2 py-1 h-7 text-[10px] sm:text-xs whitespace-nowrap border transition-colors touch-manipulation focus:outline-none focus-visible:outline-none ${
                selectedView === "month"
                  ? "text-foreground bg-background border-border"
                  : "text-muted-foreground hover:text-foreground bg-muted border-transparent"
              }`}
              style={{
                WebkitTapHighlightColor: "transparent",
                marginBottom: selectedView === "month" ? "-1px" : "0px",
                position: "relative",
                zIndex: selectedView === "month" ? 10 : 1,
              }}
            >
              <span>Month</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="border border-border flex-shrink-0 w-full">
        {/* Calendar Header */}
        <div className="grid grid-cols-5 border-b border-border w-full">
          {weekDays.map((day) => (
            <div
              key={day}
              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-background text-[10px] sm:text-xs font-medium text-muted-foreground font-mono border-r border-border last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-5 gap-px bg-border w-full">
          {calendarDays.map((calendarDay, index) => {
            const { day, isPreviousMonth, isNextMonth } = calendarDay;
            const events = getEventsForDay(day, isPreviousMonth, isNextMonth);
            const keyPrefix = isPreviousMonth
              ? "prev"
              : isNextMonth
                ? "next"
                : "curr";

            return (
              <div
                key={`${keyPrefix}-${day ?? index}`}
                className={`
                min-h-[60px] sm:min-h-[75px] lg:min-h-[89px] pt-1.5 sm:pt-2 pb-1.5 sm:pb-2 px-1.5 sm:px-2 lg:px-3 text-xs sm:text-sm relative transition-all duration-100 text-left flex flex-col bg-background
                ${
                  isPreviousMonth
                    ? "before:absolute before:inset-0 before:bg-[repeating-linear-gradient(-60deg,rgba(219,219,219,0.4),rgba(219,219,219,0.4)_1px,transparent_1px,transparent_4px)] dark:before:bg-[repeating-linear-gradient(-60deg,rgba(44,44,44,0.4),rgba(44,44,44,0.4)_1px,transparent_1px,transparent_4px)] before:pointer-events-none"
                    : ""
                }
              `}
              >
                {day !== null && (
                  <>
                    <div
                      className={`mb-0.5 sm:mb-1 text-sm sm:text-base font-normal ${isPreviousMonth ? "text-muted-foreground" : "text-foreground"}`}
                    >
                      {day}
                    </div>
                    <div className="flex flex-col gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 flex-1 min-h-0">
                      {events.map((event) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, scale: 0.8, y: -4 }}
                          animate={{
                            opacity: visibleEvents.has(event.id) ? 1 : 0,
                            scale: visibleEvents.has(event.id) ? 1 : 0.8,
                            y: visibleEvents.has(event.id) ? 0 : -4,
                          }}
                          transition={{
                            duration: 0.3,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className={`
                          text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 min-h-[18px] sm:min-h-[21px] overflow-hidden cursor-pointer transition-colors
                          bg-[#F0F0F0] dark:bg-[#1D1D1D] 
                          text-[#606060] dark:text-[#878787] 
                          hover:bg-[#E8E8E8] dark:hover:bg-[#252525]
                          flex items-center
                        `}
                        >
                          <span className="truncate">{event.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Projects Table */}
      <div className="border border-border mt-4 sm:mt-6 w-full overflow-x-auto flex-shrink-0">
        <table
          className="w-full border-collapse min-w-full"
          style={{ borderSpacing: 0 }}
        >
          <thead className="sticky top-0 z-10 bg-secondary border-b border-border">
            <tr className="h-[28px] md:h-[32px]">
              <th className="min-w-[140px] md:min-w-[180px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                Project
              </th>
              <th className="min-w-[90px] md:min-w-[100px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                Time
              </th>
              <th className="min-w-[100px] md:min-w-[120px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, index) => (
              <motion.tr
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: showProjects ? 1 : 0,
                  y: showProjects ? 0 : 10,
                }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.08,
                  ease: "easeOut",
                }}
                className={`h-[28px] md:h-[32px] bg-background hover:bg-secondary transition-colors ${
                  index < projects.length - 1 ? "border-b border-border" : ""
                }`}
              >
                {/* Project */}
                <td className="min-w-[140px] md:min-w-[180px] px-1.5 md:px-2 text-[10px] md:text-[11px] border-r border-border">
                  <span className="text-foreground truncate block">
                    {project.name}
                  </span>
                </td>

                {/* Time */}
                <td className="min-w-[90px] md:min-w-[100px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-foreground border-r border-border">
                  {project.time}
                </td>

                {/* Amount */}
                <td className="min-w-[100px] md:min-w-[120px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-foreground">
                  {project.amount}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
