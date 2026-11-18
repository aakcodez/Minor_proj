import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DAY_COLORS = ['#0f766e', '#2563eb', '#d97706', '#7c3aed', '#e11d48'];

function createPin(index, day, isSelected) {
  const bg = isSelected ? '#111827' : DAY_COLORS[(day - 1) % DAY_COLORS.length];
  const size = isSelected ? 36 : 28;
  return L.divIcon({
    className: 'wb-pin',
    html: `<div style="
      background:${bg};
      color:#fff;
      width:${size}px;
      height:${size}px;
      border-radius:999px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:700;
      font-size:12px;
      border:2.5px solid #fff;
      box-shadow:0 4px 14px rgba(0,0,0,0.25);
    ">${index}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

function CameraSync({ places, selectedPlace }) {
  const map = useMap();
  useEffect(() => {
    if (selectedPlace?.latitude && selectedPlace?.longitude) {
      map.flyTo([Number(selectedPlace.latitude), Number(selectedPlace.longitude)], 14, { duration: 1 });
      return;
    }
    const valid = places.filter((p) => Number(p.latitude) && Number(p.longitude));
    if (valid.length === 1) {
      map.flyTo([Number(valid[0].latitude), Number(valid[0].longitude)], 13, { duration: 0.9 });
    } else if (valid.length > 1) {
      map.fitBounds(
        L.latLngBounds(valid.map((p) => [Number(p.latitude), Number(p.longitude)])),
        { padding: [60, 60], maxZoom: 13 }
      );
    } else {
      map.flyTo([14.8, 75.8], 7, { duration: 0.7 });
    }
  }, [places, selectedPlace, map]);
  return null;
}

export default function ItineraryMap({ places = [], selectedPlace, onSelectPlace }) {
  const valid = places.filter((p) => Number(p.latitude) && Number(p.longitude));
  const byDay = valid.reduce((acc, p) => {
    const d = p.day || 1;
    (acc[d] = acc[d] || []).push([Number(p.latitude), Number(p.longitude)]);
    return acc;
  }, {});

  return (
    <MapContainer center={[14.8, 75.8]} zoom={7} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CameraSync places={valid} selectedPlace={selectedPlace} />

      {Object.entries(byDay).map(([day, coords]) =>
        coords.length > 1 ? (
          <Polyline
            key={day}
            positions={coords}
            pathOptions={{
              color: DAY_COLORS[(Number(day) - 1) % DAY_COLORS.length],
              weight: 3,
              dashArray: '6, 8',
              opacity: 0.85
            }}
          />
        ) : null
      )}

      {valid.map((place, idx) => (
        <Marker
          key={`${place.name}-${idx}`}
          position={[Number(place.latitude), Number(place.longitude)]}
          icon={createPin(idx + 1, place.day || 1, selectedPlace?.name === place.name)}
          eventHandlers={{ click: () => onSelectPlace && onSelectPlace(place) }}
        >
          <Popup>
            <strong>{place.name}</strong>
            <div style={{ fontSize: '12px', color: '#475569' }}>
              Day {place.day || 1} • {place.category} • {place.price || 'Free'}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
