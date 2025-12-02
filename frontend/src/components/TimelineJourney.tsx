import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimelineEvent {
  id: string;
  time: string;
  type: 'detection' | 'location' | 'cctv' | 'threat';
  typeLabel?: string;
  title: string;
  description: string;
  location?: string;
  color: string;
}

interface TimelineJourneyProps {
  events: TimelineEvent[];
  isRTL?: boolean;
}

export const TimelineJourney: React.FC<TimelineJourneyProps> = ({ events, isRTL = false }) => {
  const [visibleEvents, setVisibleEvents] = useState<number>(0);
  const typeLabels: Record<TimelineEvent['type'], string> = {
    detection: 'رصد',
    location: 'موقع',
    cctv: 'كاميرا',
    threat: 'تهديد'
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleEvents(prev => {
        if (prev < events.length) return prev + 1;
        clearInterval(timer);
        return prev;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [events.length]);

  return (
    <div className="relative py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Animated Central Line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary to-primary/20 transform -translate-x-1/2">
        <motion.div
          className="w-full bg-gradient-to-b from-primary to-gold"
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
      </div>

      <div className="space-y-8">
        <AnimatePresence>
          {events.slice(0, visibleEvents).map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: index * 0.3,
                type: 'spring',
                stiffness: 100
              }}
              className={`flex items-center gap-6 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
            >
              {/* Content Card */}
              <motion.div
                className={`flex-1 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-gray-400">
                      {event.time}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      event.type === 'threat' ? 'bg-red-100 text-red-600' :
                      event.type === 'detection' ? 'bg-amber-100 text-amber-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {event.typeLabel || (isRTL ? typeLabels[event.type] : event.type.toUpperCase())}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{event.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
                  {event.location && (
                    <div className="mt-3 text-xs text-gray-500">
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Timeline Node */}
              <div className="relative z-10 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: index * 0.3 + 0.2,
                    type: 'spring',
                    stiffness: 200
                  }}
                  className="relative"
                >
                  {/* Pulsing Background */}
                  <motion.div
                    className={`absolute inset-0 rounded-full ${event.color} opacity-20`}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.2, 0.1, 0.2]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    style={{ width: '60px', height: '60px' }}
                  />

                  {/* Node Circle */}
                  <div className={`relative w-14 h-14 ${event.color} rounded-full shadow-lg border-4 border-white`} />
                </motion.div>
              </div>

              {/* Empty Space for Alternating Layout */}
              <div className="flex-1" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Helper function to create timeline events from analysis result
export const createTimelineFromAnalysis = (result: any, isRTL: boolean = false) => {
  const events: TimelineEvent[] = [];
  const timestamp = new Date(result.timestamp);
  const t = (ar?: string | null, en?: string | null) => (isRTL ? (ar || en || '') : (en || ar || ''));

  // Biometric Detection
  if (result.modules.biometrics.matches.length > 0) {
    const match = result.modules.biometrics.matches[0];
    const suspectName = isRTL ? match.info.name : (match.info.name_en || match.info.name);
    events.push({
      id: 'biometric',
      time: timestamp.toLocaleTimeString(),
      type: 'detection',
      typeLabel: t('رصد', 'DETECTION'),
      title: t('تحديد الهوية البيومترية', 'Biometric Identification'),
      description: t(
        `تم التعرف على المشتبه به ${suspectName} بنسبة ثقة ${Math.round(match.confidence * 100)}%`,
        `Suspect identified as ${suspectName} with ${Math.round(match.confidence * 100)}% confidence`
      ),
      color: 'bg-amber-500'
    });
  }

  // GPS Location
  if (result.modules.GPS) {
    events.push({
      id: 'gps',
      time: new Date(timestamp.getTime() + 1000).toLocaleTimeString(),
      type: 'location',
      typeLabel: t('موقع', 'LOCATION'),
      title: t('تثليث موقع GPS', 'GPS Triangulation'),
      description: t(
        `تم تحديد الموقع بدقة ${Math.round(result.modules.GPS.confidence * 100)}%`,
        `Location pinpointed with ${Math.round(result.modules.GPS.confidence * 100)}% accuracy`
      ),
      location: `${result.modules.GPS.lat.toFixed(4)}, ${result.modules.GPS.lng.toFixed(4)}`,
      color: 'bg-blue-500'
    });
  }

  // CCTV Network
  if (result.modules.cctv_retrieval.cctv_nodes.length > 0) {
    events.push({
      id: 'cctv',
      time: new Date(timestamp.getTime() + 2000).toLocaleTimeString(),
      type: 'cctv',
      typeLabel: t('كاميرا', 'CCTV'),
      title: t('شبكة المراقبة مفعّلة', 'Surveillance Network Active'),
      description: t(
        `${result.modules.cctv_retrieval.cctv_nodes.length} كاميرا ضمن نطاق ${result.modules.cctv_retrieval.meta.search_radius}`,
        `${result.modules.cctv_retrieval.cctv_nodes.length} cameras within ${result.modules.cctv_retrieval.meta.search_radius} radius identified`
      ),
      color: 'bg-primary'
    });
  }

  // Threat Detection
  const hasThreats = result.modules.object_detection.detections.some((d: any) => d.threat_tag);
  if (hasThreats) {
    const threatList = result.modules.object_detection.detections
      .filter((d: any) => d.threat_tag)
      .map((d: any) => (isRTL ? d.label : (d.label_en || d.label)))
      .join(', ');

    events.push({
      id: 'threat',
      time: new Date(timestamp.getTime() + 3000).toLocaleTimeString(),
      type: 'threat',
      typeLabel: t('تهديد', 'THREAT'),
      title: t('كشف التهديد', 'Threat Detected'),
      description: t(`عناصر مشبوهة: ${threatList}`, `Suspicious objects identified: ${threatList}`),
      color: 'bg-red-500'
    });
  }

  return events;
};
