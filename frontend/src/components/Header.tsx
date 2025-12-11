import React from 'react';

interface HeaderProps {
    isRTL: boolean;
    onToggleLanguage: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isRTL, onToggleLanguage }) => {
    return (
        <nav className="fixed top-0 w-full bg-[#609966] backdrop-blur-sm border-b border-[#4a7a4f] z-50 px-6 py-2 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Roya Logo" className="h-16 object-contain rounded-lg" />
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleLanguage}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium transition-colors text-white"
                >
                    {isRTL ? "English" : "العربية"}
                </button>
            </div>
        </nav>
    );
};
