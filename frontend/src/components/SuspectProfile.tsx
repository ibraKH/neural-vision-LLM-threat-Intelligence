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
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
      {/* Header with Alert */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-700 font-bold text-lg">
              {isRTL ? 'هوية المشتبه به' : 'SUSPECT IDENTIFIED'}
            </h3>
            <p className="text-red-500 text-xs">
              {isRTL ? 'تطابق بيومتري' : 'Biometric Match Confirmed'}
            </p>
          </div>
          {info.is_wanted && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 1, type: 'spring', stiffness: 200 }}
              className="bg-white text-red-600 px-4 py-2 rounded-full font-black text-sm"
            >
              {isRTL ? 'مطلوب' : 'WANTED'}
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Face Recognition Display */}
        <div className="mb-6">
          {/* Face Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative w-full"
          >
            <div className="h-72 w-full rounded-xl overflow-hidden border-4 border-red-500 shadow-lg relative">
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

              {/* Scanning Progress Overlay (moved inside for cleaner full layout) */}
              {scanProgress < 100 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-black/60 backdrop-blur-sm px-4 py-1 rounded-full border border-red-500/50"
                  >
                    <div className="text-red-500 text-xs font-mono font-bold">
                      {isRTL ? 'جاري المسح' : 'SCANNING'} {scanProgress}%
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Original Scanning Bar (keeping it if preferred, but overlay is nicer for full image. I'll stick to original logic but adapted if needed. actually the original was outside. I will keep it simple and clean as requested).
                 The original had it outside. I'll remove the outside one since I added an overlay one above, or just restore the original outside one.
                 Let's stick to the original logic for the progress bar to minimize unexpected visual changes, just remove the grid.
             */}
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
              <div className="grid grid-cols-2 gap-3">
                {/* Name */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="text-gray-500 text-xs mb-1">{isRTL ? 'الاسم الكامل' : 'Full Name'}</div>
                  <div className="text-gray-900 font-bold text-lg leading-tight">{info.name}</div>
                </motion.div>

                {/* ID Number */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="text-gray-500 text-xs mb-1">{isRTL ? 'رقم الهوية' : 'ID Number'}</div>
                  <div className="text-gray-900 font-mono font-bold">{info.id_number}</div>
                </motion.div>

                {/* Phone */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="text-gray-500 text-xs mb-1">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</div>
                  <div className="text-gray-900 font-mono font-bold">{info.phone_number}</div>
                </motion.div>

                {/* Location */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="text-gray-500 text-xs mb-1">{isRTL ? 'الموقع المسجل' : 'Registered Location'}</div>
                  <div className="text-gray-900 font-bold leading-tight">{info.location}</div>
                </motion.div>
              </div>

              {/* Description - Full Width */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
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
