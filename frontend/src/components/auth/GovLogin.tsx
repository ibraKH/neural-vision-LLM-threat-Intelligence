import React, { useState } from 'react';
import { Building2, ArrowLeft, ArrowRight } from 'lucide-react';

interface GovLoginProps {
    onLogin: () => void;
    onBack: () => void;
    isRTL: boolean;
}

export const GovLogin: React.FC<GovLoginProps> = ({ onLogin, onBack, isRTL }) => {
    const [idNumber, setIdNumber] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!idNumber || !password) return;

        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            setIsLoading(false);
            onLogin();
        }, 800);
    };

    return (
        <div className={`min-h-screen bg-white flex flex-col pt-24 ${isRTL ? 'font-arabic' : 'font-sans'}`} dir={isRTL ? 'rtl' : 'ltr'}>

            <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 w-full max-w-xl mx-auto">

                {/* Back Button - floating above card */}
                <div className="w-full flex justify-start mb-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                        {isRTL ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                        <span>{isRTL ? 'عودة' : 'Back'}</span>
                    </button>
                </div>

                <div className="bg-white w-full rounded-3xl p-8 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/5 border border-gray-100 relative overflow-hidden">

                    {/* Header Text */}
                    <div className="w-full text-center mb-8">
                        {/* Gov Logo */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-[#609966] rounded-2xl flex items-center justify-center shadow-[0_4px_24px_rgba(96,153,102,0.3)]">
                                <Building2 size={40} className="text-white" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{isRTL ? 'دخول الجهات الحكومية' : 'Government Login'}</h1>
                        <p className="text-gray-500 text-sm">
                            {isRTL
                                ? 'للموظفين المصرح لهم والجهات الأمنية المختصة'
                                : 'For authorized personnel and security agencies'}
                        </p>
                    </div>

                    <div className="w-full text-center text-gray-600 mb-8 p-4 bg-gray-50 rounded-xl text-sm leading-relaxed border border-gray-100">
                        {isRTL
                            ? 'هذا النظام محمي ويخضع للمراقبة الإلكترونية. الدخول مسموح فقط للمصرح لهم بموجب الأنظمة واللوائح.'
                            : 'This system is protected and monitored. Access is restricted to authorized personnel only.'}
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="w-full space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900 block text-right">
                                {isRTL ? 'المعرف الوظيفي' : 'Employee ID'}
                            </label>
                            <input
                                type="text"
                                value={idNumber}
                                onChange={(e) => setIdNumber(e.target.value)}
                                placeholder={isRTL ? 'رقم المعرف' : 'ID Number'}
                                className="w-full p-4 border border-gray-300 rounded-xl text-right text-lg focus:ring-2 focus:ring-[#609966] focus:border-transparent outline-none transition-all"
                                dir={isRTL ? 'rtl' : 'ltr'}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900 block text-right">
                                {isRTL ? 'كلمة المرور' : 'Password'}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isRTL ? '••••••••' : '••••••••'}
                                className="w-full p-4 border border-gray-300 rounded-xl text-right text-lg focus:ring-2 focus:ring-[#609966] focus:border-transparent outline-none transition-all"
                                dir={isRTL ? 'rtl' : 'ltr'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !idNumber || !password}
                            className="w-full py-4 bg-[#609966] hover:bg-[#508855] text-white text-lg font-bold rounded-xl shadow-[0_4px_24px_rgba(96,153,102,0.4)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="animate-pulse">{isRTL ? 'جاري التحقق...' : 'Verifying...'}</span>
                            ) : (
                                isRTL ? 'تسجيل الدخول' : 'Log in'
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <div className="p-6 text-center">
                <p className="text-gray-400 text-xs">Official Secure Gateway</p>
            </div>
        </div>
    );
};
