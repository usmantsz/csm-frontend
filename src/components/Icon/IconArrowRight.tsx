import { FC } from 'react';

interface IconArrowRightProps {
    className?: string;
    fill?: boolean;
    duotone?: boolean;
}

const IconArrowRight: FC<IconArrowRightProps> = ({ className, fill = false, duotone = true }) => {
    return (
        <>
            {!fill ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
                    <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
                    <path
                        opacity={duotone ? '0.5' : '1'}
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M20.75 12C20.75 12.4142 20.4142 12.75 20 12.75H10.75V11.25H20C20.4142 11.25 20.75 11.5858 20.75 12Z"
                        fill="currentColor"
                    />
                    <path
                        d="M10.75 11.25V6C10.75 5.69668 10.5673 5.4232 10.287 5.30711C10.0068 5.19103 9.68417 5.25519 9.46967 5.46969L3.46967 11.4697C3.32902 11.6103 3.25 11.8011 3.25 12C3.25 12.1989 3.32902 12.3897 3.46967 12.5303L9.46967 18.5303C9.68417 18.7448 10.0068 18.809 10.287 18.6929C10.5673 18.5768 10.75 18.3033 10.75 18V12.75V11.25Z"
                        fill="currentColor"
                    />
                </svg>
            )}
        </>
    );
};

export default IconArrowRight;