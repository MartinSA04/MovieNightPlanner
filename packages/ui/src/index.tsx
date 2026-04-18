import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const panelVariants = cva(
  "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950/90",
  {
    variants: {
      tone: {
        default: "",
        accent:
          "border-amber-200 bg-amber-50/70 dark:border-amber-400/20 dark:bg-amber-300/10",
        muted: "bg-slate-50 dark:bg-slate-900/80"
      }
    },
    defaultVariants: {
      tone: "default"
    }
  }
);

export interface PanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelVariants> {}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { className, tone, ...props },
  ref
) {
  return <div ref={ref} className={cn(panelVariants({ tone }), className)} {...props} />;
});

export function SectionHeading(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400",
        props.className
      )}
    />
  );
}

const pillVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
  {
    variants: {
      tone: {
        neutral: "bg-slate-900 text-white",
        accent: "bg-amber-200 text-slate-900 dark:bg-amber-300 dark:text-slate-950",
        muted: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }
    },
    defaultVariants: {
      tone: "neutral"
    }
  }
);

export interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {}

export function Pill({ className, tone, ...props }: PillProps) {
  return <span className={cn(pillVariants({ tone }), className)} {...props} />;
}

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950 sm:min-h-12",
  {
    variants: {
      size: {
        sm: "px-5 py-2.5 text-sm",
        md: "px-6 py-3 text-sm"
      },
      variant: {
        primary:
          "bg-slate-950 text-white hover:bg-slate-800 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200",
        secondary:
          "border border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-400 dark:hover:bg-slate-900 dark:hover:text-white",
        ghost:
          "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "primary"
    }
  }
);

export const inputClassName =
  "w-full min-h-12 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-950 shadow-sm outline-none transition focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-300/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
