import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const panelVariants = cva(
  "rounded-xl border border-border bg-card p-5 sm:p-6",
  {
    variants: {
      tone: {
        default: "",
        accent: "border-accent/30 bg-accent/10",
        muted: "bg-secondary"
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
        "text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground",
        props.className
      )}
    />
  );
}

const pillVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
  {
    variants: {
      tone: {
        neutral: "bg-primary text-primary-foreground",
        accent: "bg-accent/20 text-accent",
        muted: "bg-secondary text-secondary-foreground"
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
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-12",
  {
    variants: {
      size: {
        sm: "px-5 py-2.5 text-sm",
        md: "px-6 py-3 text-sm"
      },
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "primary"
    }
  }
);

export const inputClassName =
  "w-full min-h-12 rounded-lg border border-border bg-input px-4 py-3.5 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus-visible:ring-2 focus-visible:ring-ring/50";
