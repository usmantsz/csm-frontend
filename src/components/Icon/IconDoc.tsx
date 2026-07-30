import { FC } from 'react';

interface IconDocProps {
    className?: string;
    fill?: boolean;
    duotone?: boolean;
}

const IconDoc: FC<IconDocProps> = ({ className, fill = false, duotone = true }) => {
    return (
        <>
            {fill ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke={!duotone ? 'white' : 'none'}>
                    <path
                        d="M11 2H21C22.1046 2 23 2.89543 23 4V28C23 29.1046 22.1046 30 21 30H11C9.89543 30 9 29.1046 9 28V4C9 2.89543 9.89543 2 11 2Z"
                        fill="currentColor"
                    />
                    <path
                        opacity={duotone ? '0.7' : '1'}
                        d="M16 6H12V10H16V6ZM16 12H12V16H16V12ZM16 18H12V22H16V18Z"
                        fill="currentColor"
                    />
                </svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
                    <path
                        d="M18 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V4C20 2.89543 19.1046 2 18 2Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                    <path opacity={duotone ? '0.5' : '1'} d="M15 6H9V8H15V6ZM15 10H9V12H15V10ZM15 14H9V16H15V14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            )}
        </>
    );
};

export default IconDoc;
