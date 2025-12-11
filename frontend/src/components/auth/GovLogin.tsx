import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface GovLoginProps {
    onLogin: () => void;
    onBack: () => void;
}

export const GovLogin: React.FC<GovLoginProps> = ({ onLogin, onBack }) => {
    const [idNumber, setIdNumber] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lang, setLang] = useState<'ar' | 'en'>('ar');

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

    const isRTL = lang === 'ar';

    return (
        <div className={`min-h-screen bg-white flex flex-col ${isRTL ? 'font-sans' : 'font-sans'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Top Navigation */}
            <div className="p-6 flex justify-between items-center">
                <button
                    onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
                    className="flex items-center gap-2 text-[#609966] hover:text-[#609966]/80 transition-colors font-medium text-lg"
                >
                    {isRTL ? 'English' : 'عربي'}
                </button>
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 text-sm"
                >
                    {isRTL ? 'عودة' : 'Back'}
                </button>
            </div>


            <div className="flex-1 flex flex-col items-center pt-8 px-6 max-w-md mx-auto w-full">
                {/* Header Text */}
                <div className="w-full text-right mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{isRTL ? 'دخول الجهات الحكومية' : 'Government Login'}</h1>
                    <p className="text-gray-500 text-lg">
                        {isRTL
                            ? 'للموظفين المصرح لهم والجهات الأمنية المختصة'
                            : 'For authorized personnel and security agencies'}
                    </p>
                </div>

                {/* Gov Logo Construction */}
                <div className="mb-12 relative w-64 h-32 flex items-center justify-center">
                    <div className="text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-[#609966] rounded-2xl flex items-center justify-center mb-2 shadow-lg">
                            <Building2 size={40} className="text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-[#609966] tracking-tighter" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
                            {isRTL ? "حكومي" : "GOVERMENT"}
                        </h1>
                        <p className="text-[#609966] font-medium text-sm">Official Portal</p>
                    </div>
                </div>

                <div className="w-full text-center text-gray-600 mb-8 px-4 leading-relaxed">
                    {isRTL
                        ? 'هذا النظام محمي ويخضع للمراقبة الإلكترونية. الدخول مسموح فقط للمصرح لهم بموجب الأنظمة واللوائح.'
                        : 'This system is protected and monitored. Access is restricted to authorized personnel only.'}
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="w-full space-y-6">
                    <div className="space-y-2">
                        <label className="text-xl font-bold text-gray-900 block text-right">
                            {isRTL ? 'المعرف الوظيفي' : 'Employee ID'}
                        </label>
                        <input
                            type="text"
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            placeholder={isRTL ? 'رقم المعرف' : 'ID Number'}
                            className="w-full p-4 border border-gray-300 rounded-lg text-right text-lg focus:ring-2 focus:ring-[#609966] focus:border-transparent outline-none transition-all"
                            dir={isRTL ? 'rtl' : 'ltr'}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xl font-bold text-gray-900 block text-right">
                            {isRTL ? 'كلمة المرور' : 'Password'}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isRTL ? '••••••••' : '••••••••'}
                            className="w-full p-4 border border-gray-300 rounded-lg text-right text-lg focus:ring-2 focus:ring-[#609966] focus:border-transparent outline-none transition-all"
                            dir={isRTL ? 'rtl' : 'ltr'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !idNumber || !password}
                        className="w-full py-4 bg-[#609966] hover:bg-[#508855] text-white text-xl font-medium rounded-full shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="animate-pulse">{isRTL ? 'جاري التحقق...' : 'Verifying...'}</span>
                        ) : (
                            isRTL ? 'تسجيل الدخول' : 'Log in'
                        )}
                    </button>
                </form>

            </div>
            <div className="p-6 text-center">
                <div className="w-16 h-1 mx-auto bg-gray-200 rounded-full mb-4"></div>
                <p className="text-gray-400 text-sm">Official Secure Gateway</p>
            </div>
        </div >
    );
};
