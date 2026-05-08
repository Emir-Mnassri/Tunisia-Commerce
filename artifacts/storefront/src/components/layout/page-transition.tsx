import { motion } from "framer-motion";
import { ReactNode } from "react";

export function PageTransition({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`min-h-screen flex flex-col ${className}`}
    >
      {children}
    </motion.div>
  );
}
