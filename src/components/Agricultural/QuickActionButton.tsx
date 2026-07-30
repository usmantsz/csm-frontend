import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

interface QuickActionButtonProps {
    to: string;
    icon: ReactNode;
    label: string;
    description?: string;
    color?: 'primary' | 'success' | 'warning' | 'info';
}

const QuickActionButton = ({
    to,
    icon,
    label,
    description,
    color = 'primary',
}: QuickActionButtonProps) => {
    // Ab sab variants green family mein hain (halki shade difference ke sath),
    // taake pura dashboard ek hi (green/agricultural) theme follow kare.
    const colorClasses = {
        primary:
            'bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300 dark:border-green-800',
        success:
            'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
        warning:
            'bg-lime-50 hover:bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/20 dark:hover:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800',
        info:
            'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:hover:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
    };

    return (
        <Link
            to={to}
            className={`${colorClasses[color]} group rounded-2xl border-2 p-4 transition-all duration-200 hover:scale-105 hover:shadow-md`}
        >
            <div className="flex items-center space-x-3">
                <div className="text-2xl transition-transform group-hover:scale-110">
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="text-sm font-semibold">{label}</div>
                    {description && (
                        <div className="mt-1 text-xs opacity-70">{description}</div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default QuickActionButton;