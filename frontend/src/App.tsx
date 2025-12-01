import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LeafletMap from './LeafletMap';
import { MapPin } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TimelineJourney, createTimelineFromAnalysis } from './components/TimelineJourney';
import { GPSRadar } from './components/GPSRadar';
import { CCTVNetwork } from './components/CCTVNetwork';
import { SuspectProfile } from './components/SuspectProfile';
import { ThreatDetection } from './components/ThreatDetection';

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
      }, 30);
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
  const [predictionResult, setPredictionResult] = useState<any>(null);
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

  const handleAnalyze = async (file: File) => {
    setIsAnalyzing(true);
    setResult(null);
    setPredictionResult(null);

    const steps = [
      isRTL ? "استخراج البيانات البيومترية..." : "Extracting Biometrics...",
      isRTL ? "تحديد الموقع الجغرافي..." : "Triangulating GPS...",
      isRTL ? "الاستعلام من شبكة الكاميرات الوطنية..." : "Querying National CCTV Grid..."
    ];

    // Start the analysis request
    const formData = new FormData();
    formData.append('file', file);

    const analysisPromise = fetch('http://localhost:8000/analyze', {
      method: 'POST',
      body: formData,
    }).then(async res => {
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Analysis failed: ${err}`);
      }
      return res.json();
    });

    // Show animation steps while waiting
    for (let i = 0; i < steps.length; i++) {
      setAnalysisStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      const data = await analysisPromise;
      console.log("API Response:", data);
      setResult(data);
    } catch (error) {
      console.error("Error analyzing image:", error);
      alert("Failed to analyze image. Ensure backend is running.");
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
      "min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden transition-all duration-300",
      isRTL ? "font-arabic" : "font-sans"
    )} dir={isRTL ? 'rtl' : 'ltr'}>

      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
            R
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">ROYA <span className="text-primary font-light">SAQR-1</span></h1>
            <p className="text-xs text-gray-500 tracking-widest uppercase">{isRTL ? "نظام التحليل التكتيكي" : "Tactical Analysis System"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLanguage}
            className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 text-sm font-medium transition-colors text-gray-700"
          >
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
                className="w-full max-w-2xl aspect-video rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary/5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="z-10 flex flex-col items-center text-center p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{isRTL ? "تحميل لقطات المراقبة" : "Upload Surveillance Footage"}</h2>
                  <p className="text-gray-600 mb-8 max-w-md">{isRTL ? "قم بالسحب والإفلات أو النقر للتحميل. يدعم جميع تنسيقات الصور الرئيسية للتحليل الجنائي." : "Drag and drop or click to upload. Supports all major image formats for forensic analysis."}</p>
                  <button className="px-8 py-3 bg-gradient-to-r from-primary to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
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
              className="w-full space-y-8"
            >
              {/* Top Stats Bar */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
              >
                {/* Priority Level */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-200"
                >
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                    {isRTL ? "مستوى الأولوية" : "Priority Level"}
                  </div>
                  <div className="text-4xl font-black text-gray-900">
                    {result.modules.reasoning.classification.priority}
                  </div>
                </motion.div>

                {/* Active Cameras */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-200"
                >
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                    {isRTL ? "كاميرات نشطة" : "Active Cameras"}
                  </div>
                  <div className="text-4xl font-black text-gray-900">
                    {result.modules.cctv_retrieval.cctv_nodes.length}
                  </div>
                </motion.div>

                {/* Biometric Matches */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-200"
                >
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                    {isRTL ? "تطابقات بيومترية" : "Biometric Matches"}
                  </div>
                  <div className="text-4xl font-black text-gray-900">
                    {result.modules.biometrics.matches.length}
                  </div>
                </motion.div>

                {/* GPS Accuracy */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-200"
                >
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                    {isRTL ? "دقة GPS" : "GPS Accuracy"}
                  </div>
                  <div className="text-4xl font-black text-gray-900">
                    {Math.round(result.modules.GPS.confidence * 100)}%
                  </div>
                </motion.div>
              </motion.div>

              {/* Suspect Profile - Full Width Dramatic Reveal */}
              {result.modules.biometrics.matches.length > 0 && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <SuspectProfile
                    info={result.modules.biometrics.matches[0].info}
                    confidence={result.modules.biometrics.matches[0].confidence}
                    previewImage={preview || undefined}
                    isRTL={isRTL}
                  />
                </motion.div>
              )}

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* GPS Radar */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <GPSRadar
                      lat={result.modules.GPS.lat}
                      lng={result.modules.GPS.lng}
                      confidence={result.modules.GPS.confidence}
                      isRTL={isRTL}
                    />
                  </motion.div>

                  {/* Threat Detection */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <ThreatDetection
                      detections={result.modules.object_detection.detections}
                      threatLevel={result.modules.object_detection.summary.threat_level}
                      isRTL={isRTL}
                    />
                  </motion.div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* CCTV Network */}
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <CCTVNetwork
                      nodes={result.modules.cctv_retrieval.cctv_nodes}
                      centerPoint={{ lat: result.modules.GPS.lat, lng: result.modules.GPS.lng }}
                      isRTL={isRTL}
                    />
                  </motion.div>

                  {/* Action Plan */}
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
                  >
                    <div className="mb-6">
                      <h3 className="font-bold text-gray-900 text-lg">{isRTL ? "خطة العمل" : "Action Plan"}</h3>
                      <p className="text-sm text-gray-500">{isRTL ? "الإجراءات الموصى بها" : "Recommended Actions"}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-gold/10 to-amber-50 rounded-xl p-4 border border-gold/30">
                        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">{isRTL ? "وحدة الاستجابة" : "Response Unit"}</div>
                        <div className="text-gray-900 font-bold text-lg">{result.modules.reasoning.action_plan.recommended_unit}</div>
                      </div>

                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">{isRTL ? "أقرب كاميرا" : "Nearest Camera"}</div>
                        <div className="text-gray-900 font-bold">{result.modules.reasoning.action_plan.nearest_cctv || 'N/A'}</div>
                      </div>

                      <button
                        onClick={() => {
                          const MOCK_DATA = {
                            prediction_id: "sim_001",
                            suspect_id: "sim_suspect",
                            timestamp: new Date().toISOString(),
                            routes: [
                              {
                                route_id: "route_a",
                                type: "HIDEOUT",
                                destination: "Al-Ammariyah Compound",
                                probability: 0.85,
                                color: "red",
                                speed: "fast",
                                path: [
                                  [24.7136, 46.6753],
                                  [24.7200, 46.6800],
                                  [24.7300, 46.6900],
                                  [24.7400, 46.6850],
                                  [24.7500, 46.6600]
                                ],
                                intercept_points: [
                                  { lat: 24.7300, lng: 46.6900, type: "blockade" }
                                ],
                                reasoning: "High probability match with known associate hideout. Suspect frequent visitor."
                              },
                              {
                                route_id: "route_b",
                                type: "ESCAPE",
                                destination: "King Fahd Highway",
                                probability: 0.10,
                                color: "orange",
                                speed: "medium",
                                path: [
                                  [24.7136, 46.6753],
                                  [24.7100, 46.6700],
                                  [24.7000, 46.6600],
                                  [24.6900, 46.6500]
                                ],
                                intercept_points: [
                                  { lat: 24.7000, lng: 46.6600, type: "checkpoint" }
                                ],
                                reasoning: "Standard evasion route towards highway exit."
                              },
                              {
                                route_id: "route_c",
                                type: "HOME",
                                destination: "Al-Naseem Residence",
                                probability: 0.05,
                                color: "yellow",
                                speed: "slow",
                                path: [
                                  [24.7136, 46.6753],
                                  [24.7150, 46.6850],
                                  [24.7200, 46.7000],
                                  [24.7250, 46.7200]
                                ],
                                intercept_points: [],
                                reasoning: "Low probability return to registered address."
                              }
                            ]
                          };
                          setPredictionResult(MOCK_DATA);
                        }}
                        className="w-full py-4 bg-gradient-to-r from-primary to-green-600 text-white hover:from-primary/90 hover:to-green-700 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <MapPin size={20} />
                        {isRTL ? "توقع مسار الهروب" : "Predict Escape Route"}
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Intelligence Report */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200"
              >
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 text-xl">{isRTL ? "تقرير الاستخبارات" : "Intelligence Report"}</h3>
                  <p className="text-sm text-gray-500">{isRTL ? "تحليل تفصيلي للحادث" : "Detailed Incident Analysis"}</p>
                </div>

                <div className="prose prose-sm max-w-none font-mono text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <TypewriterText text={result.modules.reasoning.report.detailed_narrative} delay={200} />
                </div>
              </motion.div>

              {/* Map View - Full Width */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-[600px] relative"
              >
                <div className="absolute top-6 left-6 z-[400] bg-white/95 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg border border-gray-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">{isRTL ? "خريطة تكتيكية" : "Tactical Map"}</h4>
                  <div className="flex items-center gap-2 font-bold text-lg mb-2">
                    <MapPin size={18} className="text-red-500" />
                    <span className="text-gray-900">{result.modules.GPS.lat.toFixed(4)}°N, {result.modules.GPS.lng.toFixed(4)}°E</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {result.modules.cctv_retrieval.cctv_nodes.length} {isRTL ? "كاميرات متصلة" : "cameras online"}
                  </div>
                </div>

                <LeafletMap
                  center={[result.modules.GPS.lat, result.modules.GPS.lng]}
                  zoom={15}
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
                  predictionData={predictionResult}
                />
              </motion.div>

              {/* Timeline Journey */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200"
              >
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 text-xl">{isRTL ? "الجدول الزمني للحادث" : "Incident Timeline"}</h3>
                  <p className="text-sm text-gray-500">{isRTL ? "تسلسل الأحداث" : "Sequence of Events"}</p>
                </div>
                <TimelineJourney
                  events={createTimelineFromAnalysis(result, isRTL)}
                  isRTL={isRTL}
                />
              </motion.div>

            </motion.div>
          ) : null}
        </AnimatePresence>
      </main >
    </div >
  );
}

export default App;
