import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LeafletMap from './LeafletMap';
import { Upload, Shield, AlertTriangle, FileText, Camera, Scan, Globe, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface AnalysisResult {
  pipeline_id: string;
  timestamp: string;
  target_image: string;
  image_url: string;
  report_id: string;
  processed_at: string;
  modules: {
    biometrics: {
      meta: { timestamp: string; faces_detected: number };
      matches: Array<{
        face_id: number;
        identity: string;
        info: { name: string; description: string; location: string; is_wanted: boolean; id_number: string; phone_number: string };
        confidence: number;
        box: { x: number; y: number; w: number; h: number };
        face_crop_path: string;
      }>;
    };
    GPS: {
      filename: string;
      lat: number;
      lng: number;
      confidence: number;
    };
    object_detection: {
      meta: { timestamp: string; model: string; output_image: string; imgsz: number };
      summary: { total_objects: number; threat_level: string };
      detections: Array<{
        label: string;
        confidence: number;
        box: { x1: number; y1: number; x2: number; y2: number };
        threat_tag: boolean;
      }>;
    };
    ocr_environment: {
      meta: { timestamp: string; language_mode: string };
      environment_data: { location_markers: string[]; sensitive_areas: string[] };
      raw_detections: Array<{ text: string; confidence: number; tag: string }>;
    };
    cctv_retrieval: {
      meta: { search_radius: string; target_coords: { lat: number; lng: number } };
      cctv_nodes: Array<{
        rank: number;
        business_name: string;
        gps: { lat: number; lng: number };
        distance: string;
      }>;
    };
    reasoning: {
      incident_id: string;
      timestamp: string;
      classification: { priority: string; domain: string; type: string };
      report: { summary: string; detailed_narrative: string; visual_evidence: string[] };
      action_plan: { recommended_unit: string; nearest_cctv: string | null };
    };
  };
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!text) return;
    let index = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
        if (index === text.length) clearInterval(interval);
      }, 30); // Typing speed
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay]);

  return <span>{displayedText}</span>;
};

function App() {
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  const isRTL = language === 'ar';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setPreview(URL.createObjectURL(selectedFile));
      handleAnalyze(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setPreview(URL.createObjectURL(selectedFile));
      handleAnalyze(selectedFile);
    }
  };

  const handleAnalyze = async (selectedFile: File) => {
    setIsAnalyzing(true);
    setResult(null);

    const steps = [
      isRTL ? "استخراج البيانات البيومترية..." : "Extracting Biometrics...",
      isRTL ? "تحديد الموقع الجغرافي..." : "Triangulating GPS...",
      isRTL ? "الاستعلام من شبكة الكاميرات الوطنية..." : "Querying National CCTV Grid..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setAnalysisStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      console.log("API Response:", data);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  return (
    <div className={cn(
      "min-h-screen bg-bg text-gray-800 font-sans overflow-x-hidden transition-all duration-300",
      isRTL ? "font-arabic" : "font-sans"
    )} dir={isRTL ? 'rtl' : 'ltr'}>

      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
            R
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">ROYA <span className="text-gold font-light">SAQR-1</span></h1>
            <p className="text-xs text-gray-500 tracking-widest uppercase">{isRTL ? "نظام التحليل التكتيكي" : "Tactical Analysis System"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLanguage}
            className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Globe size={16} />
            {isRTL ? "English" : "العربية"}
          </button>
        </div>
      </nav>

      <main className="pt-24 px-6 pb-12 max-w-7xl mx-auto min-h-screen flex flex-col">

        <AnimatePresence mode="wait">
          {!result && !isAnalyzing ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <div
                className="w-full max-w-2xl aspect-video rounded-3xl border-2 border-dashed border-gray-300 bg-white hover:border-gold hover:bg-gold/5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="z-10 flex flex-col items-center text-center p-8">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{isRTL ? "تحميل لقطات المراقبة" : "Upload Surveillance Footage"}</h2>
                  <p className="text-gray-500 mb-8 max-w-md">{isRTL ? "قم بالسحب والإفلات أو النقر للتحميل. يدعم جميع تنسيقات الصور الرئيسية للتحليل الجنائي." : "Drag and drop or click to upload. Supports all major image formats for forensic analysis."}</p>
                  <button className="px-8 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all transform hover:-translate-y-1">
                    {isRTL ? "بدء التحقيق" : "Initiate Investigation"}
                  </button>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </motion.div>
          ) : isAnalyzing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <div className="relative w-full max-w-lg aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-black">
                {preview && <img src={preview} alt="Analyzing" className="w-full h-full object-cover opacity-50" />}

                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent h-[10%] w-full animate-scan border-b-2 border-primary shadow-[0_0_15px_rgba(96,153,102,0.8)]" />

                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />

                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center gap-3 text-primary font-mono text-lg">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                    <span className="uppercase tracking-widest">{analysisStep}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : result ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full"
            >
              <div className="lg:col-span-4 space-y-6">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full flex flex-col"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <FileText className="text-primary" size={20} />
                      <h3 className="font-bold text-gray-900">{isRTL ? "تقرير التحليل" : "Analysis Report"}</h3>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold border",
                      result.modules.reasoning.classification.priority === 'CRITICAL' ? "bg-red-50 text-red-600 border-red-200" : "bg-gold/10 text-gold border-gold/20"
                    )}>
                      {result.modules.reasoning.classification.priority} PRIORITY
                    </span>
                  </div>

                  <div className="prose prose-sm max-w-none flex-1 font-mono text-gray-600 leading-relaxed">
                    <TypewriterText text={result.modules.reasoning.report.detailed_narrative} delay={500} />
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{isRTL ? "خطة العمل الموصى بها" : "Recommended Action Plan"}</h4>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <Shield className="text-gold" size={18} />
                      <span className="text-sm font-medium text-gray-800">{result.modules.reasoning.action_plan.recommended_unit}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Scan className="text-primary" size={20} />
                    <h3 className="font-bold text-gray-900">{isRTL ? "المطابقة البيومترية" : "Biometric Match"}</h3>
                  </div>

                  {result.modules.biometrics.matches.length > 0 ? (
                    <div className="space-y-4">
                      {result.modules.biometrics.matches.map((match, idx) => (
                        <div key={idx} className="relative group">
                          <div className="aspect-square rounded-xl overflow-hidden border-2 border-red-500 shadow-lg shadow-red-500/20 relative">
                            <img src={preview!} alt="Suspect" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-gray-900">{match.info.name}</span>
                              <span className="text-red-600 text-xs font-bold">{match.info.is_wanted ? "WANTED" : "UNKNOWN"}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-red-500 h-full rounded-full" style={{ width: `${match.confidence * 100}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 mt-1 block">{Math.round(match.confidence * 100)}% {isRTL ? "تطابق" : "Match"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      {isRTL ? "لم يتم العثور على تطابق" : "No biometric matches found"}
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Camera className="text-primary" size={20} />
                    <h3 className="font-bold text-gray-900">{isRTL ? "الأشياء المكتشفة" : "Detected Objects"}</h3>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {result.modules.object_detection.detections.map((obj, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + (idx * 0.1) }}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <span className="text-sm font-medium text-gray-700 capitalize">{obj.label}</span>
                        {obj.threat_tag && <AlertTriangle size={14} className="text-red-500" />}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="lg:col-span-5">
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[600px] relative"
                >
                  <LeafletMap
                    center={[result.modules.GPS.lat, result.modules.GPS.lng]}
                    zoom={17}
                    isRTL={isRTL}
                    markers={[
                      {
                        position: [result.modules.GPS.lat, result.modules.GPS.lng],
                        title: isRTL ? "موقع الحادث" : "Incident Location",
                        description: `Confidence: ${result.modules.GPS.confidence.toFixed(2)}`,
                        type: 'gps'
                      },
                      ...result.modules.cctv_retrieval.cctv_nodes.map(cam => ({
                        position: [cam.gps.lat, cam.gps.lng] as [number, number],
                        title: cam.business_name,
                        description: `Distance: ${cam.distance}`,
                        type: 'camera' as const
                      }))
                    ]}
                    antPathPositions={[
                      [result.modules.GPS.lat, result.modules.GPS.lng],
                      ...result.modules.cctv_retrieval.cctv_nodes.map(c => [c.gps.lat, c.gps.lng] as [number, number])
                    ]}
                  />

                  <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200 max-w-xs">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{isRTL ? "مسار الهروب المحتمل" : "Potential Escape Route"}</h4>
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <MapPin size={16} />
                      <span>{result.modules.GPS.lat.toFixed(4)}, {result.modules.GPS.lng.toFixed(4)}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {result.modules.cctv_retrieval.cctv_nodes.length} {isRTL ? "كاميرات قريبة تم تحديدها" : "nearby cameras identified"}
                    </div>
                  </div>
                </motion.div>
              </div>

            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
