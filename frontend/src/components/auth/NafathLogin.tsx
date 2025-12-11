import React, { useState } from 'react';

interface NafathLoginProps {
    onLogin: () => void;
    onBack: () => void;
}

export const NafathLogin: React.FC<NafathLoginProps> = ({ onLogin, onBack }) => {
    const [idNumber, setIdNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lang, setLang] = useState<'ar' | 'en'>('ar');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!idNumber) return;

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
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium text-lg"
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{isRTL ? 'تسجيل الدخول' : 'Log in'}</h1>
                    <p className="text-gray-500 text-lg">
                        {isRTL
                            ? 'للمواطن السعودي أو المقيم الذي يحمل إقامة سعودية'
                            : 'For Saudi citizens or residents with a Saudi Iqama'}
                    </p>
                </div>

                {/* Nafath Logo Construction (CSS Only to approximate the look) */}
                <div className="mb-12 relative w-64 h-32 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-8xl font-black text-[#609966] tracking-tighter" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
                            نفاذ
                        </h1>
                        <p className="text-[#609966] font-medium text-lg -mt-2">Nafath</p>
                    </div>
                </div>

                <div className="w-full text-center text-gray-600 mb-8 px-4 leading-relaxed">
                    {isRTL
                        ? 'يمكن الدخول عن طريق "أبشر" من خلال بوابة النفاذ الوطني الموحد لتستفيد من الخدمات الإلكترونية المقدمة من الهيئة السعودية للبيانات والذكاء الاصطناعي'
                        : 'You can log in via "Absher" through the National Single Sign-On portal to benefit from the electronic services provided by SDAIA.'}
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="w-full space-y-6">
                    <div className="space-y-2">
                        <label className="text-xl font-bold text-navy-900 block text-right text-indigo-950">
                            {isRTL ? 'رقم بطاقة الأحوال/الاقامة' : 'National/Iqama ID'}
                        </label>
                        <input
                            type="text"
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            placeholder={isRTL ? 'رقم الهوية / الإقامة' : 'ID / Iqama Number'}
                            className="w-full p-4 border border-gray-300 rounded-lg text-right text-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            dir={isRTL ? 'rtl' : 'ltr'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !idNumber}
                        className="w-full py-4 bg-[#5B5BAF] hover:bg-[#4A4A9F] text-white text-xl font-medium rounded-full shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
