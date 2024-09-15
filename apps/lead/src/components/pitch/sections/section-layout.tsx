import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import Link from "next/link";

interface SectionLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
}

/*
 * Section Layout For The slideshows on the platform
 *
 * @export
 * @param {SectionLayoutProps} { children, title }
 * @returns
 */
export function SectionLayout({
  children,
  title,
  subtitle,
}: SectionLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center transition-colors duration-300 overflow-hidden relative">
      <div className="absolute left-8 right-8 top-4 flex justify-between text-lg">
        <span className="md:text-md font-bold text-white">{title}</span>
        <span className="md:text-md font-bold text-white">
          <Link href="/">solomon-ai.app</Link>
        </span>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-16 relative z-10">
        <motion.span
          className="block mb-8 text-lg font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.span>
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Icons.Logo
            width={193}
            height={193}
            fill="none"
            className="text-white"
          />
        </motion.div>
        {subtitle && (
          <motion.h1
            className="text-4xl md:text-5xl max-w-3xl mb-16 font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {subtitle}
          </motion.h1>
        )}
        {children}
      </div>
    </div>
  );
}
