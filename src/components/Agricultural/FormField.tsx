import React from 'react';

interface FormFieldProps {
    label: string;
    name: string;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    error?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    options?: { value: string | number; label: string }[];
    icon?: React.ReactNode;
    helpText?: string;
    className?: string;
    min?: number;
    max?: number;
    step?: number;
    rows?: number;
}

const FormField: React.FC<FormFieldProps> = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    onBlur,
    error,
    placeholder,
    required = false,
    disabled = false,
    options,
    icon,
    helpText,
    className = '',
    min,
    max,
    step,
    rows = 4,
}) => {
    const inputId = `field-${name}`;
    const hasError = !!error;

    return (
        <div className={`mb-6 ${className}`}>
            <label htmlFor={inputId} className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {type === 'textarea' ? (
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-3 text-gray-400 z-10">
                            {icon}
                        </div>
                    )}
                    <textarea
                        id={inputId}
                        name={name}
                        value={value !== null && value !== undefined ? String(value) : ''}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        required={required}
                        disabled={disabled}
                        rows={rows}
                        className={`form-textarea w-full resize-y ${hasError ? 'border-danger focus:ring-danger' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'} ${icon ? 'pl-10' : ''} transition-all duration-300 focus:ring-2 focus:border-primary-500`}
                        style={{ minHeight: `${rows * 1.5}rem` }}
                    />
                </div>
            ) : type === 'select' && options ? (
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <select
                        id={inputId}
                        name={name}
                        value={value !== null && value !== undefined ? String(value) : ''}
                        onChange={onChange}
                        onBlur={onBlur}
                        required={required}
                        disabled={disabled}
                        className={`form-select w-full ${hasError ? 'border-danger focus:ring-danger' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'} ${icon ? 'pl-10' : ''} transition-all duration-300 focus:ring-2 focus:border-primary-500`}
                    >
                        <option value="">Select {label}</option>
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="relative">
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                            <div className="text-gray-400">
                                {icon}
                            </div>
                        </div>
                    )}
                    <input
                        id={inputId}
                        name={name}
                        type={type}
                        value={value !== null && value !== undefined ? String(value) : ''}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        required={required}
                        disabled={disabled}
                        min={min}
                        max={max}
                        step={step}
                        className={`form-input w-full ${hasError ? 'border-danger focus:ring-danger' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'} ${icon ? 'pl-10' : ''} transition-all duration-300 focus:ring-2 focus:border-primary-500`}
                    />
                </div>
            )}

            {helpText && !hasError && (
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {helpText}
                </p>
            )}
            
            {hasError && (
                <p className="mt-1.5 text-sm text-danger flex items-center">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};

export default FormField;
