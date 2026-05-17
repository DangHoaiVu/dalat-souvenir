import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  error?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error = false, ...props }, ref) => {
    return (
      <InputPrimitive
        type={type}
        data-slot="input"
        aria-invalid={error || props["aria-invalid"]}
        className={cn(
          "h-10 w-full min-w-0 rounded-md border border-[--color-border] bg-surface px-3 py-2 text-base text-primary outline-none transition-all duration-200 placeholder:text-tertiary file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary focus:border-[--color-accent] focus:ring-2 focus:ring-[--color-border-focus] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-disabled",
          error && "border-error focus:border-error focus:ring-error/30",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

type InputFieldProps = InputProps & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  errorMessage?: React.ReactNode;
  wrapperClassName?: string;
};

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, hint, errorMessage, wrapperClassName, id, error, className, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const hasError = Boolean(error || errorMessage);

    return (
      <div className={cn("space-y-1.5", wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-primary">
            {label}
          </label>
        )}
        <Input
          id={inputId}
          ref={ref}
          error={hasError}
          className={className}
          {...props}
        />
        {errorMessage ? (
          <p className="text-xs font-medium text-error" role="alert">
            {errorMessage}
          </p>
        ) : hint ? (
          <p className="text-xs text-tertiary">{hint}</p>
        ) : null}
      </div>
    );
  },
);
InputField.displayName = "InputField";

export { Input, InputField };
