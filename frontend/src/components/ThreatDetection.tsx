import React from 'react';
import { motion } from 'framer-motion';

interface Detection {
  label: string;
  confidence: number;
  threat_tag: boolean;
}

interface ThreatDetectionProps {
  detections: Detection[];
  threatLevel: string;
  isRTL?: boolean;
}

const getThreatColor = (level: string) => {
  switch (level.toUpperCase()) {
    case 'CRITICAL':
      return { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-500', glow: 'shadow-red-500/50' };
    case 'HIGH':
      return { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-500', glow: 'shadow-orange-500/50' };
    case 'MEDIUM':
      return { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500', glow: 'shadow-yellow-500/50' };
    default:
      return { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500', glow: 'shadow-green-500/50' };
  }
};


export const ThreatDetection: React.FC<ThreatDetectionProps> = ({
  detections,
  threatLevel,
  isRTL = false
}) => {
  const colors = getThreatColor(threatLevel);
  const threats = detections.filter(d => d.threat_tag);
  const normal = detections.filter(d => !d.threat_tag);
  const threatLabel = isRTL
    ? ({ CRITICAL: 'حرج', HIGH: 'مرتفع', MEDIUM: 'متوسط', LOW: 'منخفض' } as Record<string, string>)[threatLevel.toUpperCase()] || threatLevel
    : threatLevel;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">
            {isRTL ? 'تقييم التهديد' : 'Threat Assessment'}
          </h3>
          <p className="text-sm text-gray-500">
            {detections.length} {isRTL ? 'عناصر مكتشفة' : 'objects detected'}
          </p>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          className={`px-4 py-2 ${colors.bg} text-white rounded-full font-bold text-sm`}
        >
          {threatLabel}
        </motion.div>
      </div>

      {/* Threat Objects */}
      {threats.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-bold text-red-600 uppercase mb-3">
            {isRTL ? 'عناصر مشبوهة' : 'Suspicious Objects'}
          </h4>
          <div className="space-y-2">
            {threats.map((obj, idx) => (
              <motion.div
                key={`threat-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative overflow-hidden"
              >
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border-2 border-red-200">
                  <div>
                    <div className="font-bold text-gray-900 capitalize text-sm">{obj.label}</div>
                    <div className="text-xs text-gray-500">
                      {Math.round(obj.confidence * 100)}% {isRTL ? 'دقة' : 'confidence'}
                    </div>
                  </div>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.5, 1]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                    className="w-3 h-3 bg-red-500 rounded-full"
                  />
                </div>

                {/* Animated Danger Stripe */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-red-300/20 to-transparent"
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: idx * 0.3
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Normal Objects */}
      {normal.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">
            {isRTL ? 'عناصر عادية' : 'Standard Objects'}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {normal.map((obj, idx) => (
              <motion.div
                key={`normal-${idx}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: threats.length * 0.1 + idx * 0.05 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-700 capitalize text-sm truncate">{obj.label}</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <motion.div
                      className="bg-blue-500 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${obj.confidence * 100}%` }}
                      transition={{ duration: 1, delay: threats.length * 0.1 + idx * 0.05 + 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Detection Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-6 pt-6 border-t border-gray-200"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-black text-gray-900">{detections.length}</div>
            <div className="text-xs text-gray-500 uppercase mt-1">
              {isRTL ? 'المجموع' : 'Total'}
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-red-600">{threats.length}</div>
            <div className="text-xs text-gray-500 uppercase mt-1">
              {isRTL ? 'تهديدات' : 'Threats'}
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-green-600">{normal.length}</div>
            <div className="text-xs text-gray-500 uppercase mt-1">
              {isRTL ? 'عادي' : 'Normal'}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
