import { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

interface PosFormFieldProps {
    label: string;
    hint?: string;
    error?: string;
    required?: boolean;
    className?: string;
    children?: React.ReactNode;
}

export const PosFormField = ({ label, hint, error, required, className = '', children }: PosFormFieldProps) => (
    <div className={`form-group ${className}`}>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
            {required && <span className="text-danger ltr:ml-0.5 rtl:mr-0.5">*</span>}
        </label>
        {children}
        {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
);

interface PosInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
    label: string;
    hint?: string;
    error?: string;
    required?: boolean;
    wrapperClass?: string;
    inputClass?: string;
}

export const PosInput = ({ label, hint, error, required, wrapperClass = '', inputClass = '', ...props }: PosInputProps) => (
    <PosFormField label={label} hint={hint} error={error} required={required} className={wrapperClass}>
        <input
            className={`form-input w-full rounded-lg border border-white-dark/20 bg-white dark:bg-white/5 focus:border-primary focus:ring-primary/20 ${inputClass}`}
            {...props}
        />
    </PosFormField>
);

interface PosSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
    label: string;
    hint?: string;
    error?: string;
    required?: boolean;
    options: { value: string; label: string }[];
    wrapperClass?: string;
    selectClass?: string;
}

export const PosSelect = ({ label, hint, error, required, options, wrapperClass = '', selectClass = '', ...props }: PosSelectProps) => (
    <PosFormField label={label} hint={hint} error={error} required={required} className={wrapperClass}>
        <select
            className={`form-select w-full rounded-lg border border-white-dark/20 bg-white dark:bg-white/5 focus:border-primary focus:ring-primary/20 ${selectClass}`}
            {...props}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </PosFormField>
);
