"use client";

import { cn } from "@midday/ui/cn";
import { Dialog, DialogTrigger } from "@midday/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { motion, type Transition, type Variants } from "motion/react";
import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";

interface MorphingDialogProps {
  children: ReactNode;
  transition?: Transition;
}

export function MorphingDialog({
  children,
  transition = {
    type: "spring",
    bounce: 0.05,
    duration: 0.25,
  },
}: MorphingDialogProps) {
  return <Dialog>{children}</Dialog>;
}

export const MorphingDialogTrigger = ({
  children,
  className,
  style,
  ...props
}: ComponentProps<typeof DialogTrigger> & {
  children: ReactNode;
  style?: React.CSSProperties;
}) => {
  return (
    <DialogTrigger asChild className={className} style={style} {...props}>
      <motion.div style={{ cursor: "pointer" }}>{children}</motion.div>
    </DialogTrigger>
  );
};

export const MorphingDialogContainer = ({
  children,
}: {
  children: ReactNode;
}) => <>{children}</>;

export const MorphingDialogContent = ({
  children,
  className,
  style,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  style?: React.CSSProperties;
}) => {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed desktop:rounded-[10px] inset-0 z-50 bg-[#f6f6f3]/60 dark:bg-[#0C0C0C]/80 data-[state=closed]:animate-[dialog-overlay-hide_100ms] data-[state=open]:animate-[dialog-overlay-show_100ms]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-auto flex-col overflow-hidden border border-border bg-background z-50 max-h-[calc(100svh-10vw)] overflow-y-scroll w-[90vw] max-w-xl data-[state=closed]:animate-[dialog-content-hide_100ms] data-[state=open]:animate-[dialog-content-show_100ms]",
          className,
        )}
        style={style}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};

export const MorphingDialogImage = ({
  src,
  alt,
  className,
  layoutId,
  ...props
}: ComponentProps<typeof Image> & {
  layoutId: string;
}) => {
  return (
    <motion.div layoutId={layoutId} className={cn("relative", className)}>
      <Image src={src} alt={alt} fill className="object-cover" {...props} />
    </motion.div>
  );
};

export const MorphingDialogTitle = ({
  children,
  className,
  layoutId,
  isInContent = false,
  ...props
}: Omit<ComponentProps<"h2">, "onDrag"> & {
  layoutId?: string;
  isInContent?: boolean;
}) => {
  if (layoutId) {
    // For morphing animation
    if (isInContent) {
      // Inside DialogContent: use DialogPrimitive.Title for accessibility, wrapped with motion for morphing
      return (
        <DialogPrimitive.Title asChild>
          <motion.h2
            layoutId={layoutId}
            className={className}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            {...(props as any)}
          >
            {children}
          </motion.h2>
        </DialogPrimitive.Title>
      );
    }
    // In trigger: use motion.h2 for morphing
    return (
      <motion.h2
        layoutId={layoutId}
        className={className}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        {...(props as any)}
      >
        {children}
      </motion.h2>
    );
  }

  // Default: use DialogPrimitive.Title if in content, otherwise regular h2
  if (isInContent) {
    return (
      <DialogPrimitive.Title className={className} {...props}>
        {children}
      </DialogPrimitive.Title>
    );
  }

  return (
    <h2 className={className} {...props}>
      {children}
    </h2>
  );
};

export const MorphingDialogSubtitle = ({
  children,
  className,
  layoutId,
  ...props
}: Omit<ComponentProps<"p">, "onDrag"> & {
  layoutId?: string;
}) => {
  if (layoutId) {
    return (
      <motion.p
        layoutId={layoutId}
        className={className}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        {...(props as any)}
      >
        {children}
      </motion.p>
    );
  }

  return (
    <p className={className} {...props}>
      {children}
    </p>
  );
};

export const MorphingDialogDescription = ({
  children,
  className,
  disableLayoutAnimation,
  variants,
  ...props
}: Omit<ComponentProps<"div">, "onDrag"> & {
  disableLayoutAnimation?: boolean;
  variants?: Variants;
}) => {
  if (disableLayoutAnimation && variants) {
    return (
      <motion.div
        className={className}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

export const MorphingDialogClose = ({ className }: { className?: string }) => (
  <DialogPrimitive.Close
    className={cn(
      "absolute right-6 top-6 opacity-70 hover:opacity-100 transition-opacity focus:outline-none disabled:pointer-events-none",
      className,
    )}
  >
    <Cross2Icon className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </DialogPrimitive.Close>
);
