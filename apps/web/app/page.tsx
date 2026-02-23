'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export default function Home() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [3.3792, 6.5244],
      zoom: 12
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.on('click', e => {
      setCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      setConfirmOpen(true);
    });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 13 });
      });
    }
    mapRef.current = map;
  }, []);

  async function register(e: any) {
    e.preventDefault();
    setError('');
    const form = new FormData(e.target);
    const payload = {
      email: form.get('email'),
      phone: form.get('phone'),
      full_name: form.get('name'),
      device_region: 'NG',
      coordinates: coords || { lat: 6.5244, lng: 3.3792 }
    };
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || 'Registration failed');
      return;
    }
    if (json.user_id) setUserId(json.user_id);
  }

  async function createAddress() {
    if (!coords || !userId) {
      setError('Register first and select a location');
      return;
    }
    setError('');
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/v1/addresses/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, coordinates: coords })
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || 'Address creation failed');
      return;
    }
    setAddress(json.full_address || '');
    setConfirmOpen(false);
  }

  async function searchAddress() {
    if (!search.trim()) return;
    const res = await fetch(`${API_BASE}/api/v1/addresses/search?q=${encodeURIComponent(search)}&country=NG`);
    const json = await res.json();
    setResults(json.results || []);
  }

  return (
    <div>
      <div className="header">
        <form onSubmit={register}>
          <input className="input" name="name" placeholder="Full name" required />
          <input className="input" name="email" placeholder="Email" type="email" required />
          <input className="input" name="phone" placeholder="Phone" required />
          <button className="button" type="submit" disabled={loading}>{loading ? 'Working...' : 'Register'}</button>
        </form>

        {error && <div className="error">{error}</div>}

        <div className="panel">
          <div>Selected: {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Tap map'}</div>
          <button className="button" onClick={() => setConfirmOpen(true)} disabled={!coords || loading}>{loading ? 'Working...' : 'Create Address'}</button>
          <div>Address: {address}</div>
        </div>

        <div className="panel">
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search address" />
          <button className="button" onClick={searchAddress}>Search</button>
          <ul>
            {results.map((r, i) => <li key={i}>{r.full_address}</li>)}
          </ul>
        </div>
      </div>

      {confirmOpen && coords && (
        <div className="modal">
          <div className="modal-card">
            <div>Confirm location?</div>
            <div className="panel">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>
            <button className="button" onClick={createAddress} disabled={loading}>{loading ? 'Working...' : 'Confirm'}</button>
            <button className="button" onClick={() => setConfirmOpen(false)} style={{ marginLeft: 8, background: '#666' }}>Cancel</button>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="map" />
    </div>
  );
}
