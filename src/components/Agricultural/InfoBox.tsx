import { ReactNode } from 'react';

interface InfoBoxProps {
    icon: ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: 'primary' | 'success' | 'warning' | 'info';
    className?: string;
}

const InfoBox = ({
    icon,
    title,
    value,
    subtitle,
    color = 'primary',
    className = '',
}: InfoBoxProps) => {
    const colorClasses = {
        primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-200',
        success: 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 border-success-200',
        warning: 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 border-warning-200',
        info: 'bg-info-50 dark:bg-info-900/20 text-info-700 dark:text-info-400 border-info-200',
    };

    return (
        <div className={`panel border-2 ${colorClasses[color]} ${className}`}>
            <div className="flex items-center space-x-4">
                <div className="text-3xl">{icon}</div>
                <div className="flex-1">
                    <div className="text-sm font-medium opacity-80 mb-1">{title}</div>
                    <div className="text-2xl font-bold">{value}</div>
                    {subtitle && <div className="text-xs opacity-70 mt-1">{subtitle}</div>}
                </div>
            </div>
        </div>
    );
};

export default InfoBox;

