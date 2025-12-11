import React from 'react';
import { motion } from 'framer-motion';

interface AuthSelectionProps {
    onSelectType: (type: 'user' | 'gov') => void;
    isRTL?: boolean;
}

export const AuthSelection: React.FC<AuthSelectionProps> = ({ onSelectType, isRTL = true }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6 pt-24 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] rounded-full bg-[#609966]/5 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12 z-10"
            >
                <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                    {isRTL ? "منصة التحليل الأمني الموحدة" : "Unified Security Analysis Platform"}
                </h1>
                <p className="text-xl text-gray-600 mb-2 font-medium">
                    {isRTL ? "خدمة تحليل الصور " : "Image Analysis Service - Public Security"}
                </p>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                    {isRTL
                        ? "الرجاء اختيار نوع الحساب للمتابعة إلى النظام"
                        : "Please select your account type to proceed to the system"}
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl z-10">
                {/* User / Citizen Login */}
                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => onSelectType('user')}
                    className="group relative bg-white p-8 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-2 border-transparent ring-1 ring-black/5 hover:border-[#609966]/20 hover:shadow-2xl transition-all duration-300 text-right flex flex-col items-center md:items-start"
                >
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {isRTL ? "أفراد / مقيمين" : "Individuals / Residents"}
                    </h3>
                    <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                        {isRTL
                            ? "الدخول عبر النفاذ الوطني الموحد (نفاذ) للوصول إلى الخدمات الشخصية"
                            : "Login via National Single Sign-On (Nafath) to access personal services"}
                    </p>
                    <div className="mt-auto w-full py-3 bg-gray-50 text-gray-900 font-semibold rounded-xl group-hover:bg-[#609966] group-hover:text-white transition-colors text-center">
                        {isRTL ? "دخول" : "Login"}
                    </div>
                </motion.button>

                {/* Government Login */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => onSelectType('gov')}
                    className="group relative bg-white p-8 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-2 border-transparent ring-1 ring-black/5 hover:border-[#609966]/20 hover:shadow-2xl transition-all duration-300 text-right flex flex-col items-center md:items-start"
                >
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {isRTL ? "جهات حكومية" : "Government Entities"}
                    </h3>
                    <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                        {isRTL
                            ? "بوابة الدخول الموحدة للموظفين والمشغلين المصرح لهم"
                            : "Unified access portal for authorized personnel and operators"}
                    </p>
                    <div className="mt-auto w-full py-3 bg-gray-50 text-gray-900 font-semibold rounded-xl group-hover:bg-[#609966] group-hover:text-white transition-colors text-center">
                        {isRTL ? "دخول" : "Login"}
                    </div>
                </motion.button>
            </div>
        </div>
    );
};
