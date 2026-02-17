"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  MdOutlineExpandLess,
  MdOutlineExpandMore,
  MdOutlineMoreVert,
} from "react-icons/md";

export function CompanyEnrichmentAnimation({
  onComplete,
  shouldPlay = true,
}: {
  onComplete?: () => void;
  shouldPlay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHeader, setShowHeader] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showGeneral, setShowGeneral] = useState(false);
  const [showCompanyProfile, setShowCompanyProfile] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!shouldPlay) return;

    const headerTimer = setTimeout(() => {
      setShowHeader(true);
      setShowLogo(true);
    }, 0);
    const tagsTimer = setTimeout(() => setShowTags(true), 600);
    const generalTimer = setTimeout(() => setShowGeneral(true), 900);
    const profileTimer = setTimeout(() => setShowCompanyProfile(true), 1200);
    const detailsTimer = setTimeout(() => setShowDetails(true), 1500);

    const doneTimer = onComplete
      ? setTimeout(() => {
          onComplete();
        }, 10000)
      : undefined;

    return () => {
      clearTimeout(headerTimer);
      clearTimeout(tagsTimer);
      clearTimeout(generalTimer);
      clearTimeout(profileTimer);
      clearTimeout(detailsTimer);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [shouldPlay, onComplete]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col relative bg-background min-h-0"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showHeader ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="pt-2 md:pt-3 pb-2 md:pb-3 border-b border-border flex items-center justify-between px-2 md:px-3"
      >
        <div className="flex items-center gap-2 md:gap-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showLogo ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            className="w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-foreground/5 border border-border overflow-hidden"
          >
            <Image
              src="/images/supabase.png"
              alt="Supabase"
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          </motion.div>
          <h2 className="text-[16px] md:text-[18px] font-serif text-foreground">
            Supabase
          </h2>
        </div>
        <MdOutlineMoreVert
          className="text-sm text-muted-foreground"
          size={16}
        />
      </motion.div>

      {/* Description */}
      {showHeader && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.4 }}
          className="pt-2 md:pt-3 px-2 md:px-3 pb-1 md:pb-1.5"
        >
          <p className="text-[10px] md:text-[11px] text-muted-foreground leading-relaxed">
            <span className="md:hidden">
              A technology company that provides enterprise cloud solutions and
              data synchronization services for businesses worldwide.
            </span>
            <span className="hidden md:inline">
              A technology company that provides enterprise cloud solutions and
              data synchronization services for businesses worldwide. The
              platform enables seamless data integration across multiple
              systems, offering real-time synchronization, advanced security
              features, and comprehensive analytics for enterprise customers.
            </span>
          </p>
        </motion.div>
      )}

      {/* Tags */}
      {showTags && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-1 md:pt-1.5 pb-2 md:pb-3 px-2 md:px-3 border-b border-border flex flex-wrap gap-1.5 md:gap-2"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="px-1.5 md:px-2 py-0.5 md:py-1 bg-secondary border border-border text-[9px] md:text-[10px] text-muted-foreground"
          >
            SaaS
          </motion.span>
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
            className="px-1.5 md:px-2 py-0.5 md:py-1 bg-secondary border border-border text-[9px] md:text-[10px] text-muted-foreground"
          >
            Cloud Infrastructure
          </motion.span>
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.3 }}
            className="px-1.5 md:px-2 py-0.5 md:py-1 bg-secondary border border-border text-[9px] md:text-[10px] text-muted-foreground"
          >
            500+ employees
          </motion.span>
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.4 }}
            className="px-1.5 md:px-2 py-0.5 md:py-1 bg-secondary border border-border text-[9px] md:text-[10px] text-muted-foreground"
          >
            Series C
          </motion.span>
        </motion.div>
      )}

      {/* General Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showGeneral ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="border-b border-border md:mt-2"
      >
        <div className="pt-2 md:pt-3 pb-3 md:py-5 flex items-center justify-between px-2 md:px-3">
          <h3 className="text-[11px] md:text-[12px] text-foreground">
            General
          </h3>
          <MdOutlineExpandLess
            className="text-sm text-muted-foreground"
            size={16}
          />
        </div>
        {showGeneral && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="pt-0 pb-3 md:pb-4 space-y-2.5 md:space-y-3 px-2 md:px-3"
          >
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="text-[10px] md:text-[11px] text-muted-foreground"
            >
              <span className="text-foreground">Contact person:</span> Michael
              Thompson
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.2 }}
              className="text-[10px] md:text-[11px] text-muted-foreground"
            >
              <span className="text-foreground">Email:</span>{" "}
              finance@supabase.com
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.3 }}
              className="text-[10px] md:text-[11px] text-muted-foreground"
            >
              <span className="text-foreground">Website:</span> supabase.com
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Company Profile Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showCompanyProfile ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col md:mt-2"
      >
        <div className="pt-2 md:pt-3 pb-3 md:py-5 flex items-center justify-between px-2 md:px-3 flex-shrink-0">
          <h3 className="text-[11px] md:text-[12px] text-foreground">
            Company Profile
          </h3>
          <MdOutlineExpandLess
            className="text-sm text-muted-foreground"
            size={16}
          />
        </div>
        {showCompanyProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 overflow-y-auto pb-3 md:pb-4 px-2 md:px-3 pt-0"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 md:gap-y-3">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="text-[10px] md:text-[11px] text-muted-foreground"
              >
                <span className="text-foreground">Industry:</span> SaaS
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.2 }}
                className="text-[10px] md:text-[11px] text-muted-foreground"
              >
                <span className="text-foreground">Company Type:</span> Private
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.3 }}
                className="text-[10px] md:text-[11px] text-muted-foreground"
              >
                <span className="text-foreground">Employees:</span> 500+
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.4 }}
                className="text-[10px] md:text-[11px] text-muted-foreground"
              >
                <span className="text-foreground">Founded:</span> 2018
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.5 }}
                className="text-[10px] md:text-[11px] text-muted-foreground"
              >
                <span className="text-foreground">Funding:</span> Series C
                ($125M)
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.6 }}
                className="text-[10px] md:text-[11px] text-muted-foreground"
              >
                <span className="text-foreground">Headquarters:</span> San
                Francisco, CA
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.7 }}
                className="text-[10px] md:text-[11px] text-muted-foreground"
              >
                <span className="text-foreground">CEO / Founder:</span> David
                Rodriguez
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.8 }}
                className="text-[10px] md:text-[11px] text-muted-foreground"
              >
                <span className="text-foreground">Language:</span> English
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.9 }}
                className="text-[10px] md:text-[11px] text-muted-foreground"
              >
                <span className="text-foreground">Fiscal Year End:</span>{" "}
                December
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 1.0 }}
                className="text-[10px] md:text-[11px] text-muted-foreground"
              >
                <span className="text-foreground">Local Time:</span> 09:15 (PST)
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Details Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showDetails ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="border-t border-border"
      >
        <div className="py-2.5 md:py-3.5 flex items-center justify-between px-2 md:px-3">
          <h3 className="text-[11px] md:text-[12px] text-foreground">
            Details
          </h3>
          <MdOutlineExpandMore
            className="text-sm text-muted-foreground"
            size={16}
          />
        </div>
      </motion.div>
    </div>
  );
}
