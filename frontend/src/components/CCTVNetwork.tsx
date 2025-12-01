import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CCTVNode {
  rank: number;
  business_name: string;
  gps: { lat: number; lng: number };
  distance: string;
}

interface CCTVNetworkProps {
  nodes: CCTVNode[];
  centerPoint?: { lat: number; lng: number };
  isRTL?: boolean;
}

export const CCTVNetwork: React.FC<CCTVNetworkProps> = ({ nodes, isRTL = false }) => {
  const [activeNodes, setActiveNodes] = useState<number[]>([]);

  useEffect(() => {
    // Reset active nodes when nodes change
    setActiveNodes([]);

    // Sequentially activate each node
    const timers: number[] = [];
    nodes.forEach((_, index) => {
      const timer = window.setTimeout(() => {
        setActiveNodes(prev => [...prev, index]);
      }, index * 400);
      timers.push(timer);
    });

    // Cleanup timers on unmount
    return () => {
      timers.forEach(timer => window.clearTimeout(timer));
    };
  }, [nodes]);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">
            {isRTL ? 'شبكة المراقبة النشطة' : 'Active Surveillance Network'}
          </h3>
          <p className="text-sm text-gray-500">
            {nodes.length} {isRTL ? 'كاميرات متصلة' : 'cameras connected'}
          </p>
        </div>
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="px-3 py-1 bg-green-50 border border-green-200 rounded-full"
        >
          <span className="text-sm font-bold text-green-600">{isRTL ? 'مباشر' : 'LIVE'}</span>
        </motion.div>
      </div>
      
      {/* Camera List */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
        <AnimatePresence>
          {nodes.map((node, index) => {
            const isActive = activeNodes.includes(index);
            return (
              <motion.div
                key={node.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: isActive ? 1 : 0.3,
                  x: 0
                }}
                transition={{ delay: index * 0.4 }}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    isActive ? 'bg-blue-500' : 'bg-gray-400'
                  }`}>
                    {node.rank}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{node.business_name}</div>
                    <div className="text-xs text-gray-500">{node.distance} away</div>
                  </div>
                </div>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1"
                  >
                    <motion.div
                      className="w-2 h-2 bg-green-500 rounded-full"
                      animate={{
                        opacity: [1, 0.3, 1]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity
                      }}
                    />
                    <span className="text-xs text-green-600 font-medium">
                      {isRTL ? 'نشط' : 'Active'}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
