import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LeafletMap from './LeafletMap';
import { Camera } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';


import { CCTVNetwork } from './components/CCTVNetwork';
import { SuspectProfile } from './components/SuspectProfile';

import { AuthSelection } from './components/auth/AuthSelection';
import { NafathLogin } from './components/auth/NafathLogin';
import { GovLogin } from './components/auth/GovLogin'
import { Header } from './components/Header';

interface AnalysisResult {
  pipeline_id: string;
  timestamp: string;
  target_image: string;
  language?: 'ar' | 'en';
  image_url: string;
  report_id: string;
  processed_at: string;
  modules: {
    biometrics: {
      meta: { timestamp: string; faces_detected: number };
      matches: Array<{
        face_id: number;
        identity: string;
        info: {
          name: string;
          name_en?: string;
          description: string;
          description_en?: string;
          location: string;
          location_en?: string;
          is_wanted: boolean;
          id_number: string;
          id_number_en?: string;
          phone_number: string;
          phone_number_en?: string;
        };
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
      summary: { total_objects: number; threat_level: string; threat_level_label?: string };
      detections: Array<{
        label: string;
        label_en?: string;
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
        business_name_en?: string;
        gps: { lat: number; lng: number };
        distance: string;
        distance_en?: string;
      }>;
    };
    reasoning: {
      language?: 'ar' | 'en';
      incident_id: string;
      timestamp: string;
      classification: {
        priority: string;
        domain: string;
        type: string;
        labels?: { priority_ar?: string; domain_ar?: string; type_ar?: string };
      };
      report: { summary: string; detailed_narrative: string; visual_evidence: string[] };
      report_en?: { summary: string; detailed_narrative: string; visual_evidence: string[] };
      action_plan: { recommended_unit: string; nearest_cctv: string | null; notes?: string };
      action_plan_en?: { recommended_unit: string; nearest_cctv: string | null; notes?: string };
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

const localizeText = (language: 'ar' | 'en', arText?: string | null, enText?: string | null) => {
  if (language === 'ar') {
    return arText ?? enText ?? '';
  }
  return enText ?? arText ?? '';
};

function App() {
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [language, setLanguage] = useState<'en' | 'ar'>('ar');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isRTL = language === 'ar';
  const t = (ar?: string | null, en?: string | null) => localizeText(language, ar, en);
  const priorityLabel = result?.modules?.reasoning?.classification
    ? t(result.modules.reasoning.classification.labels?.priority_ar, result.modules.reasoning.classification.priority)
    : '';
  const narrativeText = result?.modules?.reasoning?.report ? t(result.modules.reasoning.report.detailed_narrative, result.modules.reasoning.report_en?.detailed_narrative) : '';


  const localizedCctvNodes = result?.modules?.cctv_retrieval?.cctv_nodes
    ? result.modules.cctv_retrieval.cctv_nodes.map((node) => ({
      ...node,
      business_name: language === 'ar' ? node.business_name : (node.business_name_en || node.business_name),
      distance: language === 'ar' ? node.distance : (node.distance_en || node.distance),
    }))
    : [];

  const primaryMatch = result?.modules?.biometrics?.matches?.[0];
  const localizedMatchInfo = primaryMatch
    ? {
      ...primaryMatch.info,
      name: t(primaryMatch.info.name, (primaryMatch.info as any).name_en),
      description: t(primaryMatch.info.description, (primaryMatch.info as any).description_en),
      location: t(primaryMatch.info.location, (primaryMatch.info as any).location_en),
      id_number: t(primaryMatch.info.id_number, (primaryMatch.info as any).id_number_en),
      phone_number: t(primaryMatch.info.phone_number, (primaryMatch.info as any).phone_number_en),
    }
    : null;

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
      t("استخراج البصمات البيومترية...", "Extracting Biometrics..."),
      t("تثليث إحداثيات GPS...", "Triangulating GPS..."),
      t("استعلام شبكة المراقبة الوطنية...", "Querying National CCTV Grid...")
    ];

    // Show animation steps while waiting (Fast mock version)
    for (let i = 0; i < steps.length; i++) {
      setAnalysisStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    /*
    const formData = new FormData();
    formData.append('file', file);
    // ... fetch logic commented out ...
    */

    // MOCK DATA
    const MOCK_DATA: AnalysisResult = {
      pipeline_id: "pipe_12345",
      timestamp: new Date().toISOString(),
      target_image: "mock_image.jpg",
      language: "ar",
      image_url: URL.createObjectURL(file),
      report_id: "rep_9876",
      processed_at: new Date().toISOString(),
      modules: {
        biometrics: {
          meta: { timestamp: new Date().toISOString(), faces_detected: 1 },
          matches: [{
            face_id: 1,
            identity: "known_suspect",
            info: {
              name: "خالد عبد العزيز",
              name_en: "Khalid Abdulaziz",
              description: "مشتبه به في قضايا أمنية متعددة، مطلوب للتحقيق.",
              description_en: "Suspect in multiple security cases, wanted for investigation.",
              location: "الرياض، حي الملز",
              location_en: "Riyadh, Al-Malaz",
              is_wanted: true,
              id_number: "1010101010",
              phone_number: "0555555555"
            },
            confidence: 0.94,
            box: { x: 100, y: 100, w: 200, h: 200 },
            face_crop_path: URL.createObjectURL(file)
          }]
        },
        GPS: {
          filename: file.name,
          lat: 24.7136,
          lng: 46.6753,
          confidence: 0.98
        },
        object_detection: {
          meta: { timestamp: new Date().toISOString(), model: "yolo", output_image: "out.jpg", imgsz: 640 },
          summary: { total_objects: 3, threat_level: "HIGH" },
          detections: [
            { label: "حقيبة مشبوهة", label_en: "Suspicious Bag", confidence: 0.88, box: { x1: 0, y1: 0, x2: 100, y2: 100 }, threat_tag: true }
          ]
        },
        ocr_environment: {
          meta: { timestamp: new Date().toISOString(), language_mode: "ar" },
          environment_data: { location_markers: ["شارع الملك فهد"], sensitive_areas: [] },
          raw_detections: []
        },
        cctv_retrieval: {
          meta: { search_radius: "5km", target_coords: { lat: 24.7136, lng: 46.6753 } },
          cctv_nodes: [
            { rank: 1, business_name: "كاميرا برج المملكة", business_name_en: "Kingdom Tower Cam", gps: { lat: 24.711, lng: 46.674 }, distance: "200m" },
            { rank: 2, business_name: "مراقبة شارع العليا", business_name_en: "Olaya St Surveillance", gps: { lat: 24.715, lng: 46.676 }, distance: "450m" },
            { rank: 3, business_name: "مدخل الفيصلية", business_name_en: "Faisaliah Entrance", gps: { lat: 24.690, lng: 46.685 }, distance: "1.2km" },
            { rank: 4, business_name: "كاميرا المرور - التخصصي", business_name_en: "Traffic Cam - Takhassusi", gps: { lat: 24.700, lng: 46.660 }, distance: "1.5km" }
          ]
        },
        reasoning: {
          language: "ar",
          incident_id: "INC-2024-001",
          timestamp: new Date().toISOString(),
          classification: {
            priority: "CRITICAL",
            domain: "SECURITY",
            type: "WANTED_PERSON",
            labels: { priority_ar: "حرج جداً", domain_ar: "أمني", type_ar: "شخص مطلوب" }
          },
          report: {
            summary: "تم رصد شخص مطلوب في محيط برج المملكة.",
            detailed_narrative: "بناءً على تحليل الفيديو والمطابقة البيومترية، تم تحديد المدعو خالد عبد العزيز (مطلوب أمني) في تقاطع طريق الملك فهد مع شارع العليا. الموقع الجغرافي دقيق بنسبة 98%. يظهر المشتبه به وهو يحمل حقيبة، مما يستدعي رفع مستوى الحذر. توصي الأنظمة بتوجيه أقرب دورية للتحقق.",
            visual_evidence: []
          },
          report_en: {
            summary: "Wanted person detected near Kingdom Tower.",
            detailed_narrative: "Based on video analysis and biometric matching, simple suspect Khalid Abdulaziz (Wanted) was identified at King Fahd Rd / Olaya St interaction. GPS location is 98% accurate. Suspect appears to be carrying a bag, warranting increased caution. Systems recommend directing nearest patrol for verification.",
            visual_evidence: []
          },
          action_plan: {
            recommended_unit: "الدوريات الأمنية - الفرقة 4",
            nearest_cctv: "كاميرا برج المملكة (C-01)",
            notes: "الاقتراب بحذر"
          },
          action_plan_en: {
            recommended_unit: "Security Patrols - Unit 4",
            nearest_cctv: "Kingdom Tower Cam (C-01)",
            notes: "Approach with caution"
          }
        }
      }
    };

    console.log("Using MOCK Response", MOCK_DATA);
    setResult(MOCK_DATA);
    setIsAnalyzing(false);
    setAnalysisStep('');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const [view, setView] = useState<'auth-select' | 'nafath' | 'gov' | 'dashboard'>('auth-select');

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setView('dashboard');
  };

  const handleAuthSelect = (type: 'user' | 'gov') => {
    setView(type === 'user' ? 'nafath' : 'gov');
  };

  return (
    <div className={cn(
      "min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden transition-all duration-300",
      isRTL ? "font-arabic" : "font-sans"
    )} dir={isRTL ? 'rtl' : 'ltr'}>

      <Header isRTL={isRTL} onToggleLanguage={toggleLanguage} />

      {!isAuthenticated ? (
        view === 'auth-select' ? (
          <AuthSelection onSelectType={handleAuthSelect} isRTL={isRTL} />
        ) : view === 'nafath' ? (
          <NafathLogin onLogin={handleLoginSuccess} onBack={() => setView('auth-select')} isRTL={isRTL} />
        ) : (
          <GovLogin onLogin={handleLoginSuccess} onBack={() => setView('auth-select')} isRTL={isRTL} />
        )
      ) : (
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
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <Camera size={40} className="text-primary" />
                    </div>
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
                {/* Main Dashboard Grid - 9 Sections */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                  {/* --- Row 1: KPI Cards (4 Slots) --- */}

                  {/* Slot 1 (Right in RTL): Priority Level */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-200 ring-1 ring-black/5"
                  >
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                      {isRTL ? "مستوى الأولوية" : "Priority Level"}
                    </div>
                    <div className="text-4xl font-black text-gray-900">
                      {priorityLabel || result.modules.reasoning.classification.priority}
                    </div>
                  </motion.div>

                  {/* Slot 2: Biometric Match Count */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-red-100 ring-1 ring-red-500/10"
                  >
                    <div className="text-xs text-red-600 uppercase tracking-wider mb-2 font-semibold">
                      {isRTL ? "تطابقات بيومترية" : "Face Matches"}
                    </div>
                    <div className="text-4xl font-black text-red-600">
                      {result.modules.biometrics.matches.length}
                    </div>
                  </motion.div>

                  {/* Slot 3: GPS Accuracy */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-200 ring-1 ring-black/5"
                  >
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                      {isRTL ? "دقة GPS" : "GPS Accuracy"}
                    </div>
                    <div className="text-4xl font-black text-gray-900">
                      {Math.round(result.modules.GPS.confidence * 100)}%
                    </div>
                  </motion.div>

                  {/* Slot 4 (Left in RTL): Face Confidence */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-200 ring-1 ring-black/5"
                  >
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                      {isRTL ? "تطابق الوجه" : "Face Confidence"}
                    </div>
                    <div className="text-4xl font-black text-gray-900">
                      {primaryMatch ? Math.round(primaryMatch.confidence * 100) : 0}%
                    </div>
                  </motion.div>


                  {/* --- Row 2: Middle Section (2x2 Grid) --- */}
                  {/* Note: In a 4-col grid, a 2x2 section means we need to span wisely or nest a grid. 
                    The user wants "Middle Row (2x2 Grid)". 
                    We can make a container spanning full width (col-span-4) that holds this 2x2 grid.
                */}
                  <div className="col-span-1 md:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Slot 5 (Right): Input Image / Face Crop 
                      Using SuspectProfile here as it contains the Face logic + Details 
                      (User wants "Input Image/Face Crop", SuspectProfile is the best fit for 'Target' visual) 
                  */}
                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="h-full"
                    >
                      {primaryMatch && (
                        <SuspectProfile
                          info={localizedMatchInfo || primaryMatch.info}
                          confidence={primaryMatch.confidence}
                          previewImage={preview || undefined}
                          isRTL={isRTL}
                        />
                      )}
                      {!primaryMatch && (
                        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-200 ring-1 ring-black/5 h-full flex items-center justify-center">
                          <img src={preview || ''} className="max-h-96 rounded-lg" alt="Input" />
                        </div>
                      )}
                    </motion.div>

                    {/* Slot 6 (Left): Map showing Target Location (LeafletMap) */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="h-full min-h-[450px] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/5 relative"
                    >
                      <LeafletMap
                        center={[result.modules.GPS.lat, result.modules.GPS.lng]}
                        zoom={16}
                        isRTL={isRTL}
                        markers={[
                          {
                            position: [result.modules.GPS.lat, result.modules.GPS.lng],
                            title: t("الهدف المرصود", "Target Detected"),
                            description: `${t("دقة الموقع", "Location Confidence")}: ${(result.modules.GPS.confidence * 100).toFixed(1)}%`,
                            type: 'gps'
                          }
                        ]}
                      />
                    </motion.div>

                    {/* Slot 7 (Right): List of CCTV Cameras */}
                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="h-full"
                    >
                      <CCTVNetwork
                        nodes={localizedCctvNodes}
                        centerPoint={{ lat: result.modules.GPS.lat, lng: result.modules.GPS.lng }}
                        isRTL={isRTL}
                      />
                    </motion.div>

                    {/* Slot 8 (Left): Map showing CCTV Locations (LeafletMap) */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="h-[400px] bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-200 ring-1 ring-black/5 overflow-hidden relative"
                    >
                      <LeafletMap
                        center={[result.modules.GPS.lat, result.modules.GPS.lng]}
                        zoom={15}
                        isRTL={isRTL}
                        markers={[
                          {
                            position: [result.modules.GPS.lat, result.modules.GPS.lng],
                            title: t("موقع الحادث", "Incident Location"),
                            description: `${t("نسبة الثقة", "Confidence")}: ${result.modules.GPS.confidence.toFixed(2)}`,
                            type: 'gps'
                          },
                          ...localizedCctvNodes.map(cam => ({
                            position: [cam.gps.lat, cam.gps.lng] as [number, number],
                            title: language === 'ar' ? cam.business_name : (cam.business_name_en || cam.business_name),
                            description: `${t("المسافة", "Distance")}: ${language === 'ar' ? cam.distance : (cam.distance_en || cam.distance)}`,
                            type: 'camera' as const
                          }))
                        ]}
                        antPathPositions={[
                          [result.modules.GPS.lat, result.modules.GPS.lng],
                          ...localizedCctvNodes.map(c => [c.gps.lat, c.gps.lng] as [number, number])
                        ]}
                        predictionData={predictionResult}
                      />
                    </motion.div>

                  </div>

                  {/* --- Row 3: Bottom Row (Full Width) --- */}

                  {/* Slot 9: Full Reasoning/Report text + PDF Button */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="col-span-1 md:col-span-4 bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-200 ring-1 ring-black/5"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-gray-900 text-xl">{isRTL ? "تقرير الاستخبارات" : "Intelligence Report"}</h3>
                        <p className="text-sm text-gray-500">{isRTL ? "تحليل تفصيلي للحادث" : "Detailed Incident Analysis"}</p>
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none font-mono text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                      <TypewriterText text={narrativeText} delay={200} />
                    </div>

                    {/* Download PDF Button */}
                    <div className="flex justify-end">
                      <button
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-lg"
                        onClick={() => alert(isRTL ? "جاري تحميل التقرير..." : "Downloading Report...")}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        {isRTL ? "تحميل التقرير (PDF)" : "Download PDF Report"}
                      </button>
                    </div>
                  </motion.div>



                </div>
              </motion.div>
            ) : null
            }
          </AnimatePresence >
        </main>
      )}
    </div >
  );
}

export default App;
