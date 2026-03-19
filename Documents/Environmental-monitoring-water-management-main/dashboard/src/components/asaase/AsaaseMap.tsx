import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface AsaaseMapProps {
  groundPos: [number, number];
  aquaPos: [number, number];
  groundHeatmap: any;
  aquaHeatmap: any;
  onMapClick?: (lat: number, lon: number) => void;
  waypoints?: {lat: number, lon: number}[];
  breadCrumbs?: [number, number][];
}

const MapEvents = ({ onClick }: { onClick?: (lat: number, lon: number) => void }) => {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const AsaaseMap: React.FC<AsaaseMapProps> = ({ groundPos, aquaPos, groundHeatmap, aquaHeatmap, onMapClick, waypoints, breadCrumbs }) => {
  // Center Ghana: 6.5, -1.5
  const center: [number, number] = [6.5, -1.5];

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-white/5 shadow-inner">
      <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%', background: '#0f172a' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapEvents onClick={onMapClick} />

        {/* Historical Breadcrumbs */}
        {breadCrumbs && breadCrumbs.length > 0 && (
          <Polyline 
            positions={breadCrumbs} 
            pathOptions={{ color: '#6366f1', weight: 2, opacity: 0.4, dashArray: '2, 5' }} 
          />
        )}

        {/* Intended Mission Path */}
        {waypoints && waypoints.length > 0 && (
          <Polyline 
            positions={[groundPos, ...waypoints.map(w => [w.lat, w.lon] as [number, number])]} 
            pathOptions={{ color: '#10b981', weight: 3, opacity: 0.8, dashArray: '10, 10' }} 
          />
        )}

        {/* Robot Markers */}
        <Marker position={groundPos}>
          <Popup>
            <div className="font-mono text-[10px] font-bold">
              ASAASE GROUND<br/>
              {groundPos[0].toFixed(4)}, {groundPos[1].toFixed(4)}
            </div>
          </Popup>
        </Marker>
        <Marker position={aquaPos}>
          <Popup>
            <div className="font-mono text-[10px] font-bold">
              ASAASE AQUA<br/>
              {aquaPos[0].toFixed(4)}, {aquaPos[1].toFixed(4)}
            </div>
          </Popup>
        </Marker>

        {/* Heatmaps */}
        {groundHeatmap?.features?.map((f: any, i: number) => (
          <Circle
            key={`gh-${i}`}
            center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
            radius={2000}
            pathOptions={{
              color: f.properties.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
              fillColor: f.properties.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
              fillOpacity: f.properties.severity === 'CRITICAL' ? 0.7 : 0.5
            }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-bold">Soil Contamination: {f.properties.severity}</div>
                <div>Confidence: {f.properties.confidence_score}%</div>
                <div>Action: {f.properties.dispenser_action}</div>
              </div>
            </Popup>
          </Circle>
        ))}

        {aquaHeatmap?.features?.map((f: any, i: number) => (
          <Circle
            key={`ah-${i}`}
            center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
            radius={2000}
            pathOptions={{
              color: f.properties.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
              fillColor: f.properties.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
              fillOpacity: f.properties.severity === 'CRITICAL' ? 0.7 : 0.5
            }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-bold">Water Quality: {f.properties.severity}</div>
                <div>Turbidity: {f.properties.turbidity_ntu} NTU</div>
                <div>pH: {f.properties.ph_value}</div>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Waypoints Polyline */}
        {waypoints && waypoints.length > 0 && (
          <Polyline 
            positions={waypoints.map(w => [w.lat, w.lon])} 
            pathOptions={{ color: '#10b981', dashArray: '5, 10' }} 
          />
        )}
      </MapContainer>
    </div>
  );
};

export default AsaaseMap;
