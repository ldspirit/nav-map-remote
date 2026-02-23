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
  onSelect
}: {
  onSelect: (coords: { lat: number; lng: number }) => void;
}) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
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

  return <div ref={containerRef} className="map" />;
}
