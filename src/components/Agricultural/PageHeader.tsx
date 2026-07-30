import React from 'react';
import { Link } from 'react-router-dom';
import IconArrowLeft from '../Icon/IconArrowLeft';

interface PageHeaderProps {
    title: string;
    description: string;
    /** Back button: use backTo for Link, or onBack for button (navigate -1) */
    backTo?: string;
    onBack?: () => void;
    backLabel?: string;
    /** Optional right side (e.g. primary action button) */
    rightContent?: React.ReactNode;
    /** Optional icon/emoji on the right (e.g. 🌾) */
    icon?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    backTo,
    onBack,
    backLabel = 'Back',
    rightContent,
    icon,
}) => {
    const backButton = (
        <span className="inline-flex items-center">
            <IconArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
        </span>
    );

    return (
        <div className="panel mb-6 bg-gradient-to-r from-primary-500 to-primary-700 text-white overflow-hidden">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-bold mb-2">{title}</h2>
                    <p className="text-white/80">{description}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    {(backTo || onBack) && (
                        backTo ? (
                            <Link to={backTo} className="btn btn-outline-white">
                                {backButton}
                            </Link>
                        ) : (
                            <button type="button" className="btn btn-outline-white" onClick={onBack}>
                                {backButton}
                            </button>
                        )
                    )}
                    {rightContent}
                    {icon && <span className="hidden md:inline-block text-5xl opacity-90 ml-1">{icon}</span>}
                </div>
            </div>
        </div>
    );
};

export default PageHeader;
