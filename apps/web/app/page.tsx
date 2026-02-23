'use client';

import { useEffect, useRef, useState } from 'react';
import MapView from './components/MapView';
import RegisterForm from './components/RegisterForm';
import AddressPanel from './components/AddressPanel';
import SearchBar from './components/SearchBar';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export default function Home() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<any | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const searchTimer = useRef<any>(null);

  useEffect(() => {
    if (currentPos || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, [currentPos]);

  async function register(data: any) {
    setError('');
    const payload = {
      email: data.email,
      phone: data.phone,
      full_name: data.name,
      device_region: 'NG',
      coordinates: coords || { lat: 6.5244, lng: 3.3792 }
    };
    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Registration failed');
      return;
    }
    if (json.user_id) setUserId(json.user_id);
  }

  async function createAddress() {
    if (!coords || !userId) {
      setError('Register first and select a location');
      setConfirmOpen(false);
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
      setConfirmOpen(false);
      return;
    }
    setAddress(json.full_address || '');
    setToast('Address created');
    setTimeout(() => setToast(''), 1500);
    setConfirmOpen(false);
  }

  async function searchAddress(term?: string) {
    const q = (term ?? search).trim();
    if (!q) return;
    const res = await fetch(`${API_BASE}/api/v1/addresses/search?q=${encodeURIComponent(q)}&country=NG`);
    const json = await res.json();
    setResults(json.results || []);
  }

  async function selectResult(r: any, idx: number) {
    if (!r?.components) return;
    setSelected(idx);
    setAddress(r.full_address);
    if (!r.coordinates) return;

    const start = currentPos || coords;
    if (!start) return;

    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${r.coordinates.lng},${r.coordinates.lat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.routes && json.routes[0]) {
      setRoute({ type: 'Feature', geometry: json.routes[0].geometry });
      const stepList = json.routes[0].legs[0].steps.map((s: any) => s.maneuver.instruction);
      setSteps(stepList);
    }
  }

  return (
    <div>
      <div className="header">
        <RegisterForm onRegister={register} />
        {error && <div className="error">{error}</div>}

        <AddressPanel
          coords={coords}
          address={address}
          loading={loading}
          onCreate={() => setConfirmOpen(true)}
          onCopy={async () => {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setToast('Copied to clipboard');
            setTimeout(() => { setCopied(false); setToast(''); }, 1500);
          }}
        />

        {steps.length > 0 && (
          <div className="panel">
            <div><strong>Directions</strong></div>
            <ol>
              {steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        )}

        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            if (searchTimer.current) clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => searchAddress(val), 300);
          }}
          onSearch={() => searchAddress()}
          onClear={() => { setResults([]); setSearch(''); setSelected(null); }}
          results={results}
          onSelect={selectResult}
          selected={selected}
        />
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

      {toast && (
        <div style={{ position: 'absolute', bottom: 16, left: 16, background: '#2e7d32', color: 'white', padding: '8px 12px', borderRadius: 6, zIndex: 20 }}>
          {toast}
        </div>
      )}

      <MapView
        onSelect={(c) => { setCoords(c); setConfirmOpen(true); }}
        markers={results.map(r => r.coordinates).filter(Boolean)}
        route={route}
      />
    </div>
  );
}
