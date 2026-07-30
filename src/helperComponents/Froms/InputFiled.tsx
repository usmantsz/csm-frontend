import React, { useState } from 'react';

interface InputFiledProps {
    type: string; // Input type (e.g., text, password, email)
    label?: string; // Label text
    placeholder?: string; // Placeholder text
    maxWords?: number; // Maximum allowed words
    minWords?: number; // Minimum required words
    value?: string; // Controlled value
    onChange?: (name: String, value: string) => void; // Callback for value change
    error?: boolean; // Whether the input is in error state
    errorMessage?: string; // Error message to display
    showWordCount?: boolean; // Show word count below the input
    disabled?: boolean; // Disable the input field
    name?: string;
}

const InputFiled: React.FC<InputFiledProps> = ({
    type,
    label,
    placeholder = '',
    maxWords = 0,
    minWords = 0,
    value = '',
    onChange,
    error = false,
    errorMessage = '',
    showWordCount = false,
    disabled = false,
    name = '',
}) => {
    const [internalValue, setInternalValue] = useState(value);
    const [wordCount, setWordCount] = useState(0);
    const [validationMessage, setValidationMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        // const newValue = e.target.value;
        const name = e.target.name;
        // alert(e.target.name)
        const words = newValue.trim().split(/\s+/); // Split by spaces
        const count = newValue.trim() ? words.length : 0; // Handle empty input gracefully

        setInternalValue(newValue);
        setWordCount(count);

        // Clear validation messages while typing
        if (!error) setValidationMessage('');

        // Trigger external change handler if provided
        if (onChange) {

            onChange(newValue, name);
        }
    };

    const handleBlur = () => {
        // Validation on blur
        if (minWords && wordCount < minWords) {
            setValidationMessage(`Please enter at least ${minWords} words.`);
        } else if (maxWords && wordCount > maxWords) {
            setValidationMessage(`Please enter no more than ${maxWords} words.`);
        } else {
            setValidationMessage(''); // Clear validation message if valid
        }
    };



    return (
        <div className="input-container" style={{ marginBottom: '1rem' }}>
            {label && (
                <label htmlFor="input" className="form-label">
                    {label}
                </label>
            )}
            <input
                id="input"
                type={type}
                name={name}
                placeholder={placeholder}
                value={value || internalValue}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${validationMessage || error ? 'error-border' : ''}`}
                style={{
                    border: validationMessage || error ? '2px solid red' : '1px solid #ccc',
                    backgroundColor: disabled ? '#f5f5f5' : 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    outline: 'none',
                    cursor: disabled ? 'not-allowed' : 'text',
                }}
                disabled={disabled}
            />
            {(validationMessage || errorMessage) && (
                <p className="error-text" style={{ color: 'red', fontSize: '12px' }}>
                    {validationMessage || errorMessage}
                </p>
            )}
            {showWordCount && (
                <p className="word-count" style={{ fontSize: '12px', marginTop: '4px', color: 'gray' }}>
                    Words: {wordCount} {maxWords ? `/ Max: ${maxWords}` : ''} {minWords ? `/ Min: ${minWords}` : ''}
                </p>
            )}
        </div>
    );
};

export default InputFiled;
