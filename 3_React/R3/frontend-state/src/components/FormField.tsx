import { forwardRef, type InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  helpText?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { id, label, error, helpText, className = '', ...props },
  ref,
) {
  const describedBy = error ? `${id}-error` : helpText ? `${id}-help` : undefined;

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
        ref={ref}
        {...props}
      />
      {helpText && !error ? (
        <div id={`${id}-help`} className="form-text">
          {helpText}
        </div>
      ) : null}
      {error ? (
        <div id={`${id}-error`} className="invalid-feedback">
          {error}
        </div>
      ) : null}
    </div>
  );
});
