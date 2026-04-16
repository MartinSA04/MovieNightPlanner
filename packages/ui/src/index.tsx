import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const panelVariants = cva(
  "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6",
  {
    variants: {
      tone: {
        default: "",
        accent: "border-amber-200 bg-amber-50/70",
        muted: "bg-slate-50"
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
        "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500",
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
        accent: "bg-amber-200 text-slate-900",
        muted: "bg-slate-100 text-slate-700"
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
