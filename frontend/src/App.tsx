import { useState, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface RecognitionResult {
  location: { lat: number; lng: number }
  confidence: number
  matched_image: string
}

const translations = {
  ar: {
    appName: 'رؤيا',
    tagline: 'التعرف على الموقع بالذكاء الاصطناعي',
    selectImage: 'اختر صورة',
    dropHere: 'أو اسحب وأفلت هنا',
    noImage: 'لم يتم تحديد صورة',
    readyAnalyze: 'جاهز للتحليل',
    analyzing: 'جارٍ التحليل...',
    processingData: 'معالجة بيانات الموقع',
    locationIdentified: 'تم تحديد الموقع',
    analyzeNew: 'تحليل صورة جديدة',
    gpsCoordinates: 'إحداثيات GPS',
    matchedReference: 'المرجع المطابق',
    locationMap: 'خريطة الموقع',
    uploadedImage: 'الصورة المرفوعة'
  },
  en: {
    appName: 'Roya',
    tagline: 'AI-Powered Location Recognition',
    selectImage: 'Select Image',
    dropHere: 'or drag and drop here',
    noImage: 'No image selected',
    readyAnalyze: 'Ready to analyze',
    analyzing: 'Analyzing...',
    processingData: 'Processing location data',
    locationIdentified: 'Location identified',
    analyzeNew: 'Analyze New Image',
    gpsCoordinates: 'GPS Coordinates',
    matchedReference: 'Matched Reference',
    locationMap: 'Location Map',
    uploadedImage: 'Uploaded Image'
  }
}


const AnimatedBlob = ({ confidence }: { confidence: number }) => {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <linearGradient id="blobGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#609966" />
          <stop offset="50%" stopColor="#7DB87E" />
          <stop offset="100%" stopColor="#50805F" />
        </linearGradient>
      </defs>
      <path
        d="M47.1,-57.8C59.9,-49.3,68.4,-33.3,71.8,-16.3C75.2,0.7,73.5,18.7,65.3,33.4C57.1,48.1,42.4,59.5,26.3,65.4C10.2,71.3,-7.3,71.7,-23.5,66.8C-39.7,61.9,-54.6,51.7,-63.4,37.4C-72.2,23.1,-74.9,4.7,-71.8,-12.5C-68.7,-29.7,-59.8,-45.7,-47.1,-54.3C-34.4,-62.9,-17.2,-64.1,-0.3,-63.7C16.6,-63.3,34.3,-66.3,47.1,-57.8Z"
        transform="translate(100 100)"
        fill="url(#blobGradient)"
        className="animate-blob"
      />
      <text
        x="100"
        y="100"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-5xl font-black fill-white"
      >
        {Math.round(confidence * 100)}%
      </text>
    </svg>
  )
}

function App() {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [language, setLanguage] = useState<'ar' | 'en'>('ar')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  const t = translations[language]
  const isRTL = language === 'ar'

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar')
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    try {
      const response = await fetch(`${apiUrl}/recognize`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data: RecognitionResult = await response.json()
      setResult(data)

      // Initialize map after result is set
      setTimeout(() => {
        if (mapRef.current && !mapInstance.current) {
          const map = L.map(mapRef.current).setView([data.location.lat, data.location.lng], 13)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map)
          L.marker([data.location.lat, data.location.lng]).addTo(map)
          mapInstance.current = map
        } else if (mapInstance.current) {
          mapInstance.current.setView([data.location.lat, data.location.lng], 13)
          mapInstance.current.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
              mapInstance.current!.removeLayer(layer)
            }
          })
          L.marker([data.location.lat, data.location.lng]).addTo(mapInstance.current)
        }
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recognize location')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all text-[#609966] font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            {language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className={`text-5xl md:text-6xl font-bold mb-3 text-[#609966] ${isRTL ? 'font-arabic' : ''}`}>
            {t.appName}
          </h1>
          <p className={`text-[#8B7355] text-base ${isRTL ? 'font-arabic' : ''}`}>
            {t.tagline}
          </p>
        </div>

        {!result && !loading && (
          <div className="bg-gray-50 rounded-3xl p-8 mb-4 shadow-lg border border-gray-100 animate-fade-in">
            <div className="flex flex-col items-center mb-8">
              <div className="w-48 h-48 mb-6 relative">
                {preview ? (
                  <div className="w-full h-full rounded-full overflow-hidden relative border-4 border-[#609966]/20">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#609966]/20 to-[#7DB87E]/20"></div>
                  </div>
                ) : (
                  <div className="w-full h-full">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <defs>
                        <linearGradient id="uploadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#609966" stopOpacity="0.2" />
                          <stop offset="50%" stopColor="#7DB87E" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#50805F" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M47.1,-57.8C59.9,-49.3,68.4,-33.3,71.8,-16.3C75.2,0.7,73.5,18.7,65.3,33.4C57.1,48.1,42.4,59.5,26.3,65.4C10.2,71.3,-7.3,71.7,-23.5,66.8C-39.7,61.9,-54.6,51.7,-63.4,37.4C-72.2,23.1,-74.9,4.7,-71.8,-12.5C-68.7,-29.7,-59.8,-45.7,-47.1,-54.3C-34.4,-62.9,-17.2,-64.1,-0.3,-63.7C16.6,-63.3,34.3,-66.3,47.1,-57.8Z"
                        transform="translate(100 100)"
                        fill="url(#uploadGradient)"
                        className="animate-blob"
                      />
                      <text
                        x="100"
                        y="100"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-6xl fill-[#609966] opacity-50"
                      >
                        +
                      </text>
                    </svg>
                  </div>
                )}
              </div>

              {preview ? (
                <p className={`text-[#8B7355] text-sm mb-4 ${isRTL ? 'font-arabic' : ''}`}>{t.readyAnalyze}</p>
              ) : (
                <p className={`text-gray-400 text-sm mb-4 ${isRTL ? 'font-arabic' : ''}`}>{t.noImage}</p>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className={`bg-[#609966] hover:bg-[#50805F] text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all ${isRTL ? 'font-arabic' : ''}`}
              >
                {t.selectImage}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-[#609966] bg-[#609966]/5'
                  : 'border-gray-200 hover:border-[#609966]/50'
              }`}
            >
              <p className={`text-[#8B7355] text-sm ${isRTL ? 'font-arabic' : ''}`}>{t.dropHere}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-gray-50 rounded-3xl p-12 mb-4 shadow-lg border border-gray-100 animate-fade-in">
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 mb-6">
                <svg viewBox="0 0 200 200" className="w-full h-full animate-pulse">
                  <defs>
                    <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#609966" />
                      <stop offset="50%" stopColor="#7DB87E" />
                      <stop offset="100%" stopColor="#50805F" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M47.1,-57.8C59.9,-49.3,68.4,-33.3,71.8,-16.3C75.2,0.7,73.5,18.7,65.3,33.4C57.1,48.1,42.4,59.5,26.3,65.4C10.2,71.3,-7.3,71.7,-23.5,66.8C-39.7,61.9,-54.6,51.7,-63.4,37.4C-72.2,23.1,-74.9,4.7,-71.8,-12.5C-68.7,-29.7,-59.8,-45.7,-47.1,-54.3C-34.4,-62.9,-17.2,-64.1,-0.3,-63.7C16.6,-63.3,34.3,-66.3,47.1,-57.8Z"
                    transform="translate(100 100)"
                    fill="url(#loadingGradient)"
                    className="animate-blob"
                  />
                </svg>
              </div>
              <p className={`text-[#609966] font-semibold text-xl mb-2 ${isRTL ? 'font-arabic' : ''}`}>{t.analyzing}</p>
              <p className={`text-[#8B7355] text-sm ${isRTL ? 'font-arabic' : ''}`}>{t.processingData}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-gray-50 rounded-3xl p-6 mb-4 border-2 border-red-300 shadow-lg animate-fade-in">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gray-50 rounded-3xl p-8 shadow-lg border border-gray-100">
              <div className="flex flex-col items-center mb-6">
                <div className="w-56 h-56 mb-4">
                  <AnimatedBlob confidence={result.confidence} />
                </div>
                <p className={`text-[#8B7355] text-sm mb-2 ${isRTL ? 'font-arabic' : ''}`}>{t.locationIdentified}</p>
                <button
                  onClick={() => {
                    setResult(null)
                    setPreview(null)
                    setError(null)
                  }}
                  className={`text-[#609966] font-medium text-sm hover:text-[#50805F] ${isRTL ? 'font-arabic' : ''}`}
                >
                  {t.analyzeNew}
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-gray-200">
                  <div className="flex-1">
                    <p className={`text-[#8B7355] text-xs mb-1 ${isRTL ? 'font-arabic' : ''}`}>{t.gpsCoordinates}</p>
                    <p className="text-[#609966] font-mono text-sm font-semibold">
                      {result.location.lat.toFixed(6)}, {result.location.lng.toFixed(6)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#609966]/20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#609966] rounded-full"></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-gray-200">
                  <div className="flex-1">
                    <p className={`text-[#8B7355] text-xs mb-1 ${isRTL ? 'font-arabic' : ''}`}>{t.matchedReference}</p>
                    <p className="text-[#609966] font-mono text-sm font-semibold truncate">
                      {result.matched_image}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#7DB87E]/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded bg-[#7DB87E]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-3xl p-4 shadow-lg border border-gray-100">
              <p className={`text-[#8B7355] text-xs uppercase tracking-wider mb-3 px-2 ${isRTL ? 'font-arabic' : ''}`}>{t.locationMap}</p>
              <div ref={mapRef} className="h-80 rounded-2xl overflow-hidden border border-gray-200"></div>
            </div>

            {preview && (
              <div className="bg-gray-50 rounded-3xl p-4 shadow-lg border border-gray-100">
                <p className={`text-[#8B7355] text-xs uppercase tracking-wider mb-3 px-2 ${isRTL ? 'font-arabic' : ''}`}>{t.uploadedImage}</p>
                <div className="rounded-2xl overflow-hidden border border-gray-200">
                  <img
                    src={preview}
                    alt="Uploaded"
                    className="w-full h-auto max-h-64 object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
