import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const panelVariants = cva(
  "rounded-2xl border border-border/60 bg-card p-5 sm:p-6",
  {
    variants: {
      tone: {
        default: "",
        accent: "border-primary/30 bg-primary/5",
        muted: "border-transparent bg-secondary/60"
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
        "text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
        props.className
      )}
    />
  );
}

const pillVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
  {
    variants: {
      tone: {
        neutral: "bg-secondary text-secondary-foreground",
        accent: "bg-primary/15 text-primary",
        muted: "bg-muted text-muted-foreground"
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
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-9 px-3.5 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-sm"
      },
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        outline: "border border-border bg-transparent text-foreground hover:bg-secondary/60",
        ghost: "bg-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
        destructive:
          "border border-destructive/30 bg-transparent text-destructive hover:border-destructive/60 hover:bg-destructive/10"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "primary"
    }
  }
);

export const inputClassName =
  "w-full h-11 rounded-lg border border-border/60 bg-input px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring/40";
