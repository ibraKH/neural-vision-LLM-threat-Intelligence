import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';

interface Detection {
  label: string;
  confidence: number;
  threat_tag: boolean;
  box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface ThreatDetectionProps {
  detections: Detection[];
  threatLevel: string;
  isRTL?: boolean;
  imageUrl?: string;
}

const getThreatColor = (level: string) => {
  switch (level.toUpperCase()) {
    case 'CRITICAL':
      return { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-500', glow: 'shadow-red-500/50', stroke: '#ef4444' };
    case 'HIGH':
      return { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-500', glow: 'shadow-orange-500/50', stroke: '#f97316' };
    case 'MEDIUM':
      return { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500', glow: 'shadow-yellow-500/50', stroke: '#eab308' };
    default:
      return { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500', glow: 'shadow-green-500/50', stroke: '#22c55e' };
  }
};

export const ThreatDetection: React.FC<ThreatDetectionProps> = ({
  detections,
  threatLevel,
  isRTL = false,
  imageUrl
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = getThreatColor(threatLevel);
  const threats = detections.filter(d => d.threat_tag);
  const normal = detections.filter(d => !d.threat_tag);
  const threatLabel = isRTL
    ? ({ CRITICAL: 'حرج', HIGH: 'مرتفع', MEDIUM: 'متوسط', LOW: 'منخفض' } as Record<string, string>)[threatLevel.toUpperCase()] || threatLevel
    : threatLevel;

  const imageRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
    }
  }, [imageUrl, isExpanded]);



  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              {isRTL ? 'تقييم التهديد' : 'Threat Assessment'}
            </h3>
            <p className="text-sm text-gray-500">
              {detections.length} {isRTL ? 'عناصر مكتشفة' : 'objects detected'}
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded(true)}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <Maximize2 size={18} className="text-gray-600" />
            </motion.button>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className={`px-4 py-2 ${colors.bg} text-white rounded-full font-bold text-sm`}
            >
              {threatLabel}
            </motion.div>
          </div>
        </div>

        {/* Image Preview with Bounding Boxes */}
        {imageUrl && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 mb-6 border border-gray-200 group cursor-pointer" onClick={() => setIsExpanded(true)}>
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Analyzed Footage"
              className="w-full h-full object-contain"
              onLoad={(e) => {
                const img = e.currentTarget;
                setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
              }}
            />
            <div className="absolute inset-0">
              {/* We use a ResizeObserver in a real app, but for now we rely on aspect-ratio */}
              {imageSize.width > 0 && (
                <BoundingBoxOverlay
                  detections={detections}
                  originalSize={imageSize}
                  isRTL={isRTL}
                />
              )}
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="bg-white/90 text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
                {isRTL ? 'تكبير الصورة' : 'Expand View'}
              </span>
            </div>
          </div>
        )}

        {/* Threat Objects List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {threats.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold text-red-600 uppercase mb-3 sticky top-0 bg-white py-2 z-10">
                {isRTL ? 'عناصر مشبوهة' : 'Suspicious Objects'}
              </h4>
              <div className="space-y-2">
                {threats.map((obj, idx) => (
                  <motion.div
                    key={`threat-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border-2 border-red-200 group-hover:border-red-300 transition-colors">
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
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Normal Objects List */}
          {normal.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 sticky top-0 bg-white py-2 z-10">
                {isRTL ? 'عناصر عادية' : 'Standard Objects'}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {normal.map((obj, idx) => (
                  <motion.div
                    key={`normal-${idx}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: threats.length * 0.1 + idx * 0.05 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors"
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
        </div>
      </div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isExpanded && imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-6xl max-h-[90vh] bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm"
              >
                <X size={24} />
              </button>

              <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
                <img
                  src={imageUrl}
                  alt="Full Analysis"
                  className="max-w-full max-h-[85vh] object-contain"
                />
                <div className="absolute inset-0 pointer-events-none">
                  <BoundingBoxOverlay
                    detections={detections}
                    originalSize={imageSize}
                    isRTL={isRTL}
                    isModal={true}
                  />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 ${colors.bg} text-white rounded-full font-bold text-sm shadow-lg`}>
                    {threatLabel}
                  </div>
                  <div className="text-white/80 text-sm font-medium">
                    {detections.length} {isRTL ? 'عناصر تم اكتشافها' : 'Objects Detected'}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Helper component for responsive bounding boxes
const BoundingBoxOverlay = ({ detections, originalSize, isRTL, isModal = false }: { detections: Detection[], originalSize: { width: number, height: number }, isRTL: boolean, isModal?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current && originalSize.width > 0) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Calculate scale based on "object-contain" logic
        const imageRatio = originalSize.width / originalSize.height;
        const containerRatio = width / height;

        let finalWidth, finalHeight;

        if (containerRatio > imageRatio) {
          finalHeight = height;
          finalWidth = height * imageRatio;
        } else {
          finalWidth = width;
          finalHeight = width / imageRatio;
        }

        setScale({
          x: finalWidth / originalSize.width,
          y: finalHeight / originalSize.height
        });
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [originalSize, isModal]);

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center">
      <div style={{
        width: originalSize.width * scale.x,
        height: originalSize.height * scale.y,
        position: 'relative'
      }}>
        {detections.map((det, idx) => {
          const isThreat = det.threat_tag;
          const color = isThreat ? '#ef4444' : '#22c55e'; // Red-500 or Green-500

          return (
            <div
              key={`overlay-box-${idx}`}
              className="absolute border-2 transition-all duration-300 group hover:bg-white/10"
              style={{
                left: `${(det.box.x1 / originalSize.width) * 100}%`,
                top: `${(det.box.y1 / originalSize.height) * 100}%`,
                width: `${((det.box.x2 - det.box.x1) / originalSize.width) * 100}%`,
                height: `${((det.box.y2 - det.box.y1) / originalSize.height) * 100}%`,
                borderColor: color,
                boxShadow: isThreat ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none'
              }}
            >
              <div
                className={`absolute -top-7 ${isRTL ? 'right-0' : 'left-0'} px-2 py-1 text-xs font-bold text-white rounded shadow-md whitespace-nowrap z-10 transition-transform group-hover:scale-110`}
                style={{ backgroundColor: color }}
              >
                {det.label} <span className="opacity-75 text-[10px] ml-1">{(det.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

