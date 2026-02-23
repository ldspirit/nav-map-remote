'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm'
    }
  ]
};

export default function MapView({
  onSelect,
  markers,
  route
}: {
  onSelect: (coords: { lat: number; lng: number }) => void;
  markers: { lat: number; lng: number }[];
  route: any | null;
}) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE as any,
      center: [3.3792, 6.5244],
      zoom: 12
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.on('click', e => {
      onSelect({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker().setLngLat([e.lngLat.lng, e.lngLat.lat]).addTo(map);
      } else {
        markerRef.current.setLngLat([e.lngLat.lng, e.lngLat.lat]);
      }
    });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 13 });
      });
    }
    mapRef.current = map;
  }, [onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = markers.map(m => new maplibregl.Marker({ color: '#ff6b6b' }).setLngLat([m.lng, m.lat]).addTo(map));
  }, [markers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getSource('route')) {
      map.removeLayer('route-line');
      map.removeSource('route');
    }
    if (route) {
      map.addSource('route', { type: 'geojson', data: route });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#0f62fe', 'line-width': 4 }
      });
    }
  }, [route]);

  return <div ref={containerRef} className="map" />;
}
