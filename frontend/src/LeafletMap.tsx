import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AntPath } from 'leaflet-ant-path';
import PredictionLayer from './PredictionLayer';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface PredictionData {
    prediction_id: string;
    suspect_id: string;
    timestamp: string;
    routes: Array<{
        route_id: string;
        type: string;
        destination: string;
        probability: number;
        color: string;
        speed: string;
        path: [number, number][];
        intercept_points: Array<{
            lat: number;
            lng: number;
            type: string;
        }>;
        reasoning: string;
    }>;
}

interface LeafletMapProps {
    center: [number, number];
    zoom: number;
    markers: Array<{
        position: [number, number];
        title: string;
        description: string;
        type: 'gps' | 'camera';
    }>;
    antPathPositions: [number, number][];
    isRTL: boolean;
    predictionData?: PredictionData | null;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ center, zoom, markers, antPathPositions, isRTL, predictionData }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapContainerRef.current, {
                center,
                zoom,
                zoomControl: false,
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            }).addTo(mapInstanceRef.current);
        } else {
            mapInstanceRef.current.setView(center, zoom);
        }

        const map = mapInstanceRef.current;

        map.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.Polygon || (layer as any)._path) {
                map.removeLayer(layer);
            }
        });

        const gpsIcon = L.divIcon({
            className: 'custom-gps-marker',
            html: `<div style="
        background-color: #ef4444; 
        width: 36px; 
        height: 36px; 
        border-radius: 50%; 
        border: 3px solid white; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.3); 
        display: flex; 
        align-items: center; 
        justify-content: center;
        color: white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
      </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36]
        });

        const cameraIcon = L.divIcon({
            className: 'custom-cctv-marker',
            html: `<div style="
        background-color: white;
        width: 46px;
        height: 46px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
      ">
        <img src="/cctv.png" alt="CCTV" style="width: 150%; height: 150%; object-fit: contain;" />
      </div>`,
            iconSize: [46, 46],
            iconAnchor: [23, 46],
            popupAnchor: [0, -46]
        });

        markers.forEach((marker) => {
            const icon = marker.type === 'gps' ? gpsIcon : cameraIcon;
            const m = L.marker(marker.position, { icon }).addTo(map);

            const popupContent = `
        <div style="font-family: ${isRTL ? 'Tajawal' : 'Inter'}, sans-serif; text-align: ${isRTL ? 'right' : 'left'}; min-width: 150px;">
          <div style="font-weight: bold; color: #111; margin-bottom: 4px; font-size: 14px;">${marker.title}</div>
          <div style="font-size: 12px; color: #666;">${marker.description}</div>
        </div>
      `;
            m.bindPopup(popupContent);
        });

        if (antPathPositions.length > 1) {
            try {
                const AntPathClass = (AntPath as any);
                if (AntPathClass) {
                    const path = new AntPathClass(antPathPositions, {
                        "delay": 400,
                        "dashArray": [10, 20],
                        "weight": 5,
                        "color": "#8B7355",
                        "pulseColor": "#FFFFFF",
                        "paused": false,
                        "reverse": false,
                        "hardwareAccelerated": true
                    });
                    map.addLayer(path);
                } else {
                    L.polyline(antPathPositions, { color: '#8B7355', weight: 5 }).addTo(map);
                }
            } catch (e) {
                console.error("AntPath error:", e);
                L.polyline(antPathPositions, { color: '#8B7355', weight: 5 }).addTo(map);
            }
        }

    }, [center, zoom, markers, antPathPositions, isRTL]);

    return (
        <div ref={mapContainerRef} className="w-full h-full z-0">
            {mapInstanceRef.current && predictionData && (
                <PredictionLayer data={predictionData} map={mapInstanceRef.current} />
            )}
        </div>
    );
};

export default LeafletMap;
