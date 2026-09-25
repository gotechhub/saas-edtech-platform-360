import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...values: ClassValue[]) {
  return twMerge(clsx(values));
}

const buttonVariants = cva("rv2-button", {
  variants: {
    variant: {
      primary: "rv2-button--primary",
      secondary: "rv2-button--secondary",
      ghost: "rv2-button--ghost",
      danger: "rv2-button--danger",
    },
    size: {
      sm: "rv2-button--sm",
      md: "rv2-button--md",
      lg: "rv2-button--lg",
    },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export function Surface({ className, children, as: Element = "section", ...props }: React.HTMLAttributes<HTMLElement> & { as?: "section" | "article" | "div" }) {
  return <Element className={cn("rv2-surface", className)} {...props}>{children}</Element>;
}

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return <span className={`rv2-status rv2-status--${tone}`}>{children}</span>;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="rv2-progress">
      <div className="rv2-progress__track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe}>
        <span style={{ width: `${safe}%` }} />
      </div>
      <span className="rv2-progress__value">%{safe}</span>
    </div>
  );
}

