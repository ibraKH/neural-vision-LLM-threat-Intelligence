import React, { useEffect } from 'react';
import L from 'leaflet';
import { Shield } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';

interface PredictionData {
    prediction_id: string;
    suspect_id: string;
    timestamp: string;
    routes: Array<{
        route_id: string;
        type: string;
        destination: string;
        destination_en?: string;
        probability: number;
        color: string;
        speed: string;
        speed_en?: string;
        path: [number, number][];
        intercept_points: Array<{
            lat: number;
            lng: number;
            type: string;
            type_en?: string;
        }>;
        reasoning: string;
        reasoning_en?: string;
        type_en?: string;
    }>;
}

interface PredictionLayerProps {
    data: PredictionData;
    map: L.Map;
    isRTL?: boolean;
}

const PredictionLayer: React.FC<PredictionLayerProps> = ({ data, map, isRTL = false }) => {

    useEffect(() => {
        if (!map || !data) {
            return;
        }

        const t = (ar?: string | null, en?: string | null) => (isRTL ? (ar || en || '') : (en || ar || ''));
        const layers: L.Layer[] = [];

        const fetchRouteGeometry = async (waypoints: [number, number][]): Promise<[number, number][]> => {
            try {
                // Build OSRM API URL with waypoints
                const coordinates = waypoints.map(point => `${point[1]},${point[0]}`).join(';');
                const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.code === 'Ok' && data.routes && data.routes[0]) {
                    return data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                }
            } catch (error) {
                console.error('Failed to fetch route from OSRM:', error);
            }
            return waypoints;
        };

        const addPoliceStations = () => {
            const policeStations = [
                {
                    name: 'مركز شرطة العليا',
                    name_en: 'Olaya Police Station',
                    lat: 24.7150,
                    lng: 46.6770,
                    units: 3
                },
                {
                    name: 'مركز شرطة المروج',
                    name_en: 'Al-Muruj Police Station',
                    lat: 24.7100,
                    lng: 46.6720,
                    units: 2
                }
            ];

            policeStations.forEach(station => {
                const iconHtml = ReactDOMServer.renderToString(
                    <div className="relative flex items-center justify-center w-12 h-12">
                        <div className="absolute inset-0 rounded-full opacity-30 animate-pulse bg-blue-500"></div>
                        <div className="relative z-10 w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                        </div>
                    </div>
                );

                const icon = L.divIcon({
                    className: 'custom-police-icon',
                    html: iconHtml,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                    popupAnchor: [0, -20]
                });

                const marker = L.marker([station.lat, station.lng], { icon }).addTo(map);

                const popupContent = ReactDOMServer.renderToString(
                    <div className="font-sans min-w-[180px]">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0.5">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                </svg>
                            </div>
                            <span className="font-bold text-gray-900">{t(station.name, station.name_en)}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                            <p>{t('الوحدات المتاحة', 'Available Units')}: <span className="font-bold text-blue-600">{station.units}</span></p>
                            <p className="mt-1 text-gray-500">{t('الحالة', 'Status')}: <span className="text-green-600">{t('نشط', 'Active')}</span></p>
                        </div>
                    </div>
                );

                marker.bindPopup(popupContent, {
                    className: 'glass-popup',
                    closeButton: false,
                    maxWidth: 200
                });

                layers.push(marker);
            });
        };

        addPoliceStations();

        const processRoutes = async () => {
            for (const route of data.routes) {
                const routeType = t(route.type, route.type_en);
                const routeDestination = t(route.destination, route.destination_en);
                const reasoningText = t(route.reasoning, route.reasoning_en);
                let color = '#f59e0b';
                let className = 'animate-dash-medium';
                let weight = 4;
                let opacity = 0.7;

                if (route.probability > 0.7) {
                    color = '#ef4444';
                    className = 'animate-dash-fast route-pulse';
                    weight = 6;
                    opacity = 0.9;
                } else if (route.probability < 0.3) {
                    color = '#eab308';
                    className = 'animate-dash-slow';
                    weight = 3;
                    opacity = 0.6;
                }

                const roadPath = await fetchRouteGeometry(route.path);

                const polyline = L.polyline(roadPath, {
                    color: color,
                    weight: weight,
                    opacity: opacity,
                    dashArray: '10, 10',
                    className: className,
                    lineCap: 'round',
                    lineJoin: 'round',
                    interactive: true
                }).addTo(map);

                if ((polyline as any).bringToFront) {
                    (polyline as any).bringToFront();
                }

                layers.push(polyline);

                if (roadPath.length > 0) {
                    const endPoint = roadPath[roadPath.length - 1];

                    const iconHtml = ReactDOMServer.renderToString(
                        <div className="relative flex items-center justify-center w-8 h-8">
                            <div className={`absolute inset-0 rounded-full opacity-30 animate-ping ${route.probability > 0.7 ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                            <div className={`relative z-10 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${route.probability > 0.7 ? 'bg-red-600' : 'bg-amber-500'}`}>
                                <Shield size={12} className="text-white" />
                            </div>
                        </div>
                    );

                    const icon = L.divIcon({
                        className: 'custom-intercept-icon',
                        html: iconHtml,
                        iconSize: [32, 32],
                        iconAnchor: [16, 16],
                        popupAnchor: [0, -16]
                    });

                    const marker = L.marker(endPoint, { icon }).addTo(map);

                    const popupContent = ReactDOMServer.renderToString(
                        <div className="font-sans min-w-[200px]">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${route.probability > 0.7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {Math.round(route.probability * 100)}% {t('ثقة', 'Confidence')}
                                </span>
                                <span className="text-xs text-gray-500">{routeType}</span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-sm mb-1">{routeDestination}</h3>
                            <p className="text-xs text-gray-600 leading-relaxed">{reasoningText}</p>
                        </div>
                    );

                    marker.bindPopup(popupContent, {
                        className: 'glass-popup',
                        closeButton: false,
                        maxWidth: 250
                    });

                    layers.push(marker);
                }
            }

            if (layers.length > 0) {
                const allLatLngs: [number, number][] = [];
                data.routes.forEach(route => {
                    route.path.forEach(point => allLatLngs.push(point));
                });

                if (allLatLngs.length > 0) {
                    const bounds = L.latLngBounds(allLatLngs);
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            }
        };

        processRoutes();

        return () => {
            layers.forEach(layer => map.removeLayer(layer));
        };
    }, [map, data]);

    return null;
};

export default PredictionLayer;
