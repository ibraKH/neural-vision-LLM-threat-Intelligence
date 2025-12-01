import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Radar } from 'lucide-react';

interface GPSRadarProps {
  lat: number;
  lng: number;
  confidence: number;
  isRTL?: boolean;
}

export const GPSRadar: React.FC<GPSRadarProps> = ({ lat, lng, confidence, isRTL = false }) => {

  return (
    <div className="relative w-full h-64 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-2xl overflow-hidden border border-blue-800 shadow-2xl">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Radar Sweep */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="absolute w-48 h-48 rounded-full border-2 border-blue-400"
          animate={{
            scale: [1, 2, 1],
            opacity: [0.6, 0, 0.6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut'
          }}
        />
        <motion.div
          className="absolute w-48 h-48 rounded-full border-2 border-blue-400"
          animate={{
            scale: [1, 2.5, 1],
            opacity: [0.4, 0, 0.4]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 0.5
          }}
        />

        {/* Rotating Radar Beam */}
        <motion.div
          className="absolute w-48 h-48"
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          <div className="absolute inset-0" style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(59, 130, 246, 0.6) 10%, transparent 20%)',
            filter: 'blur(4px)'
          }} />
        </motion.div>

        {/* Center Pin */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          className="relative z-10"
        >
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 border-4 border-white">
            <MapPin size={32} className="text-white" />
          </div>

          {/* Pulsing Effect */}
          <motion.div
            className="absolute inset-0 bg-red-500 rounded-full"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.6, 0, 0.6]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </motion.div>
      </div>

      {/* GPS Coordinates Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-xl p-4 border border-blue-500/30"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radar size={16} className="text-blue-400 animate-pulse" />
              <span className="text-blue-400 text-xs font-mono uppercase tracking-wider">
                {isRTL ? 'إحداثيات GPS' : 'GPS Coordinates'}
              </span>
            </div>
            <div className="font-mono text-white text-lg font-bold">
              {lat.toFixed(6)}°N, {lng.toFixed(6)}°E
            </div>
          </div>
          <div className="text-right">
            <div className="text-blue-400 text-xs font-mono uppercase mb-1">
              {isRTL ? 'الدقة' : 'Accuracy'}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-blue-950 rounded-full overflow-hidden border border-blue-700">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence * 100}%` }}
                  transition={{ duration: 1.5, delay: 1 }}
                />
              </div>
              <span className="text-green-400 font-bold text-sm">{Math.round(confidence * 100)}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scanning Lines */}
      <motion.div
        className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
        animate={{
          top: ['-10%', '110%']
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
          repeatDelay: 0.5
        }}
        style={{ filter: 'blur(2px)' }}
      />
    </div>
  );
};
