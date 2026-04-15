import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const panelVariants = cva(
  "rounded-[28px] border border-white/10 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur",
  {
    variants: {
      tone: {
        default: "",
        accent: "bg-amber-50/90 border-amber-200/50",
        muted: "bg-slate-50/90 border-slate-200/70"
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
        "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500",
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
        accent: "bg-amber-200 text-amber-950",
        muted: "bg-slate-200 text-slate-700"
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
