import { ReactNode } from 'react';

interface AgriculturalCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    subtitle?: string;
    color?: 'primary' | 'success' | 'warning' | 'info' | 'harvest' | 'crop';
    className?: string;
}

// Sab variants ab ek hi green style use kar rahe hain, bg bhi QuickActionButton
// ki tarha halka green tint hai (white nahi) — poora dashboard ek hi
// green theme follow karta hai.
const cardStyle = {
    border: 'border-transparent dark:border-green-800',
    bg: 'bg-green-50 dark:bg-green-900/20',
    iconBg: 'bg-green-100 dark:bg-green-900/40 group-hover:bg-green-200 dark:group-hover:bg-green-900/60',
    iconText: 'text-green-700 dark:text-green-300',
};

const AgriculturalCard = ({
    title,
    value,
    icon,
    trend,
    subtitle,
    color = 'primary',
    className = '',
}: AgriculturalCardProps) => {
    // color prop ab bhi accept hota hai (backward-compatible) lekin sab
    // ek hi style use karte hain.
    const styles = cardStyle;

    return (
        <div className={`panel !bg-transparent !border-none !shadow-none !p-0 ${className}`}>
            <div
    className={`group relative overflow-hidden rounded-2xl border ${styles.border} ${styles.bg} p-6 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl active:translate-y-0 active:shadow-lg`}
>
                <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-medium tracking-wide text-stone-700 dark:text-stone-300">
                        {title}
                    </div>
                    <span
                        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${styles.iconBg} ${styles.iconText}`}
                    >
                        {icon}
                    </span>
                </div>

                <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        <div className="truncate text-3xl font-bold leading-tight text-stone-900 transition-colors dark:text-white">
                            {value}
                        </div>
                        {subtitle && (
                            <div className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                                {subtitle}
                            </div>
                        )}
                    </div>

                    {trend && (
                        <div
                            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                trend.isPositive
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                            }`}
                        >
                            <span>{trend.isPositive ? '↑' : '↓'}</span>
                            <span>{Math.abs(trend.value)}%</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgriculturalCard;