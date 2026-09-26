import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...values: ClassValue[]) {
  return twMerge(clsx(values));
}

export const buttonVariants = cva("rv2-button", {
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

export type TextFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({ id, label, hint, error, required, className, ...props }: TextFieldProps) {
  const generatedId = React.useId();
  const controlId = id ?? generatedId;
  const descriptionId = hint || error ? `${controlId}-description` : undefined;
  return (
    <label className={cn("rv2-field", error && "is-error", className)} htmlFor={controlId}>
      <span className="rv2-field__label">{label}{required ? <b aria-hidden="true">*</b> : null}</span>
      <input id={controlId} required={required} aria-invalid={Boolean(error)} aria-describedby={descriptionId} {...props} />
      {hint || error ? <small id={descriptionId}>{error ?? hint}</small> : null}
    </label>
  );
}

export type SelectFieldProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
};

export function SelectField({ id, label, hint, error, options, required, className, ...props }: SelectFieldProps) {
  const generatedId = React.useId();
  const controlId = id ?? generatedId;
  const descriptionId = hint || error ? `${controlId}-description` : undefined;
  return (
    <label className={cn("rv2-field", error && "is-error", className)} htmlFor={controlId}>
      <span className="rv2-field__label">{label}{required ? <b aria-hidden="true">*</b> : null}</span>
      <select id={controlId} required={required} aria-invalid={Boolean(error)} aria-describedby={descriptionId} {...props}>
        {options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
      </select>
      {hint || error ? <small id={descriptionId}>{error ?? hint}</small> : null}
    </label>
  );
}

export type ToggleFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string;
};

export function ToggleField({ label, description, className, ...props }: ToggleFieldProps) {
  return (
    <label className={cn("rv2-toggle", className)}>
      <input type="checkbox" {...props} />
      <span className="rv2-toggle__control" aria-hidden="true"><i /></span>
      <span className="rv2-toggle__copy"><strong>{label}</strong>{description ? <small>{description}</small> : null}</span>
    </label>
  );
}
