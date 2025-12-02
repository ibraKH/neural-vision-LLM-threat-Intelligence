import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuspectInfo {
  name: string;
  description: string;
  location: string;
  is_wanted: boolean;
  id_number: string;
  phone_number: string;
}

interface SuspectProfileProps {
  info: SuspectInfo;
  confidence: number;
  faceCropPath?: string;
  previewImage?: string;
  isRTL?: boolean;
}

export const SuspectProfile: React.FC<SuspectProfileProps> = ({
  info,
  confidence,
  previewImage,
  isRTL = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowDetails(true), 300);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Header with Alert */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">
              {isRTL ? 'هوية المشتبه به' : 'SUSPECT IDENTIFIED'}
            </h3>
            <p className="text-red-200 text-xs">
              {isRTL ? 'تطابق بيومتري' : 'Biometric Match Confirmed'}
            </p>
          </div>
          {info.is_wanted && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 1, type: 'spring', stiffness: 200 }}
              className="bg-white text-red-600 px-4 py-2 rounded-full font-black text-sm border-2 border-red-300"
            >
              {isRTL ? 'مطلوب' : 'WANTED'}
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Face Recognition Display */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Face Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="aspect-square rounded-xl overflow-hidden border-4 border-red-500 shadow-lg relative">
              <img
                src={previewImage || '/placeholder-face.jpg'}
                alt="Suspect"
                className="w-full h-full object-cover"
              />

              {/* Scanning Overlay */}
              {scanProgress < 100 && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/30 to-transparent"
                  animate={{
                    top: ['-20%', '120%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  style={{ height: '20%' }}
                />
              )}

              {/* Face Detection Grid */}
              <div className="absolute inset-0 border-2 border-red-500" style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(239, 68, 68, 0.2) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(239, 68, 68, 0.2) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }} />

              {/* Corner Brackets */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-red-500" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-red-500" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-red-500" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-red-500" />
            </div>

            {/* Scanning Progress */}
            {scanProgress < 100 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute -bottom-2 left-0 right-0"
              >
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden border border-red-300">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-400"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <div className="text-center text-red-600 text-xs mt-1 font-mono font-bold">
                  {isRTL ? 'جاري المسح' : 'SCANNING'} {scanProgress}%
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Confidence Meter */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col justify-center"
          >
            <div className="text-center mb-4">
              <div className="text-gray-500 text-sm mb-2 uppercase tracking-wider">
                {isRTL ? 'مستوى الثقة' : 'Confidence Level'}
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.5, type: 'spring', stiffness: 150 }}
                className="text-6xl font-black text-gray-900 mb-2"
              >
                {Math.round(confidence * 100)}%
              </motion.div>
            </div>

            {/* Circular Progress */}
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  stroke="rgba(239, 68, 68, 0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="60"
                  stroke="url(#confidenceGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: confidence }}
                  transition={{ duration: 2, ease: 'easeInOut', delay: 1 }}
                  strokeDasharray="377"
                />
                <defs>
                  <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>
        </div>

        {/* Suspect Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-3"
            >
              {/* Name */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="text-gray-500 text-xs mb-1">{isRTL ? 'الاسم الكامل' : 'Full Name'}</div>
                <div className="text-gray-900 font-bold text-lg">{info.name}</div>
              </motion.div>

              {/* ID Number */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="text-gray-500 text-xs mb-1">{isRTL ? 'رقم الهوية' : 'ID Number'}</div>
                <div className="text-gray-900 font-mono font-bold">{info.id_number}</div>
              </motion.div>

              {/* Phone */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="text-gray-500 text-xs mb-1">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</div>
                <div className="text-gray-900 font-mono font-bold">{info.phone_number}</div>
              </motion.div>

              {/* Location */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="text-gray-500 text-xs mb-1">{isRTL ? 'الموقع المسجل' : 'Registered Location'}</div>
                <div className="text-gray-900 font-bold">{info.location}</div>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-red-50 rounded-lg p-4 border border-red-200"
              >
                <div className="text-red-600 text-xs mb-2 font-bold uppercase">
                  {isRTL ? 'ملاحظات' : 'Notes'}
                </div>
                <div className="text-gray-900 text-sm leading-relaxed">{info.description}</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
