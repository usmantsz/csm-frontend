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
    // Card ab white bg + shadow use karta hai (AgriculturalCard jaisa),
    // green tint hata diya. Border halki rakhi hai taake white card page ke
    // white background se merge na ho. color prop ab bhi accept hota hai
    // (backward-compatible) lekin sab ek hi style follow karte hain, taake
    // last (info) button bhi baaki jaisa hi dikhe.
    const cardClasses =
        'bg-white border-gray-100 text-stone-700 shadow-md hover:shadow-xl dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 dark:shadow-none';

    // Icon ka bg AgriculturalCard jaisa: light mode mein white + shadow,
    // dark mode mein halka green tint, koi shadow nahi.
    const iconBg =
        'bg-white shadow-xl shadow-green-900/20 ring-1 ring-green-100 dark:bg-green-900/40 dark:shadow-none dark:ring-0 group-hover:shadow-2xl group-hover:shadow-green-900/30 dark:group-hover:bg-green-900/60';
    const iconText = 'text-green-700 dark:text-green-300';

    return (
        <Link
            to={to}
            className={`${cardClasses} group rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:shadow-md`}
        >
            <div className="flex items-center space-x-3">
                <span
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${iconBg} ${iconText}`}
                >
                    {icon}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{label}</div>
                    {description && (
                        <div className="mt-1 truncate text-xs text-stone-500 dark:text-green-400/70">
                            {description}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default QuickActionButton;