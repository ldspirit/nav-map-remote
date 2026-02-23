import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

const MOCK = process.env.MOCK_DB === '1';

let store = {
  users: [],
  otp_codes: [],
  streets: [],
  addresses: []
};

function uuid() {
  return crypto.randomUUID();
}

function distanceMeters(a, b) {
  const R = 6371e3;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
}

async function mockQuery(text, params = []) {
  // Users
  if (text.includes('INSERT INTO users')) {
    const [email, phone, full_name, billing_country, device_region, sim_country, signup_country] = params;
    if (store.users.some(u => u.email === email || u.phone === phone)) {
      const err = new Error('duplicate');
      throw err;
    }
    const id = uuid();
    store.users.push({ id, email, phone, full_name, billing_country, device_region, sim_country, signup_country });
    return { rows: [{ id }] };
  }
  if (text.startsWith('SELECT phone FROM users')) {
    const id = params[0];
    const user = store.users.find(u => u.id === id);
    return { rows: user ? [{ phone: user.phone }] : [] };
  }

  // OTP
  if (text.includes('INSERT INTO otp_codes')) {
    const [phone, code, expires_at] = params;
    const id = uuid();
    store.otp_codes.push({ id, phone, code, expires_at: new Date(expires_at) });
    return { rows: [{ id }] };
  }
  if (text.startsWith('SELECT id FROM otp_codes')) {
    const [phone, code] = params;
    const now = Date.now();
    const otp = store.otp_codes.find(o => o.phone === phone && o.code === code && o.expires_at.getTime() > now);
    return { rows: otp ? [{ id: otp.id }] : [] };
  }
  if (text.startsWith('DELETE FROM otp_codes')) {
    const phone = params[0];
    store.otp_codes = store.otp_codes.filter(o => o.phone !== phone);
    return { rows: [] };
  }

  // Addresses: nearby match
  if (text.includes('FROM addresses') && text.includes('ST_DWithin') && text.includes('LIMIT 1')) {
    const lng = params[0];
    const lat = params[1];
    const country = params[2];
    let found = null;
    for (const a of store.addresses.filter(a => a.country_id === country)) {
      const d = distanceMeters({ lat, lng }, a.coordinates);
      if (d <= 12) { found = a; break; }
    }
    if (!found) return { rows: [] };
    return { rows: [{ id: found.id, street_id: found.street_id, house_number: found.house_number, p_number: found.p_number }] };
  }

  // Next P number
  if (text.includes('MAX(p_number)')) {
    const [street_id, house_number] = params;
    const nums = store.addresses.filter(a => a.street_id === street_id && a.house_number === house_number).map(a => a.p_number);
    const max = nums.length ? Math.max(...nums) : 0;
    return { rows: [{ next_p: max + 1 }] };
  }

  // Nearby street within 100m
  if (text.includes('SELECT a.street_id') && text.includes('ST_DWithin') && text.includes('100')) {
    const lng = params[0];
    const lat = params[1];
    const country = params[2];
    let street_id = null;
    for (const a of store.addresses.filter(a => a.country_id === country)) {
      const d = distanceMeters({ lat, lng }, a.coordinates);
      if (d <= 100) { street_id = a.street_id; break; }
    }
    return { rows: street_id ? [{ street_id }] : [] };
  }

  if (text.startsWith('INSERT INTO streets')) {
    const [name, street_type] = params;
    const id = uuid();
    store.streets.push({ id, name, street_type, country_id: 'NG' });
    return { rows: [{ id }] };
  }

  if (text.startsWith('SELECT house_number FROM addresses')) {
    const street_id = params[0];
    const rows = store.addresses.filter(a => a.street_id === street_id).map(a => ({ house_number: a.house_number }));
    return { rows };
  }

  if (text.includes('INSERT INTO addresses')) {
    const [street_id, house_number, p_number_or_unit, unit_designation, lng, lat, user_id] = params;
    let p_number = 1;
    let unit = null;
    if (typeof p_number_or_unit === 'number') {
      p_number = p_number_or_unit;
      unit = unit_designation;
    } else {
      unit = p_number_or_unit;
    }
    const id = uuid();
    store.addresses.push({
      id,
      street_id,
      house_number,
      p_number,
      unit_designation: unit,
      coordinates: { lat, lng },
      country_id: 'NG',
      user_id
    });
    return { rows: [{ id }] };
  }

  if (text.startsWith('SELECT a.id, a.house_number')) {
    const id = params[0];
    const addr = store.addresses.find(a => a.id === id);
    if (!addr) return { rows: [] };
    const street = store.streets.find(s => s.id === addr.street_id);
    return { rows: [{ id: addr.id, house_number: addr.house_number, p_number: addr.p_number, street_name: street?.name || 'Hope' }] };
  }

  if (text.includes('FROM addresses a JOIN streets s') && text.includes('ILIKE')) {
    const q = params[0].replace(/%/g, '').toLowerCase();
    const country = params[1];
    const rows = store.addresses
      .map(a => {
        const s = store.streets.find(st => st.id === a.street_id);
        return { id: a.id, house_number: a.house_number, p_number: a.p_number, street_name: s?.name || '' , country_id: s?.country_id || 'NG'};
      })
      .filter(r => r.country_id === country && r.street_name.toLowerCase().includes(q))
      .slice(0, 50);
    return { rows };
  }

  if (text.includes('SELECT DISTINCT s.name')) {
    return { rows: store.streets.map(s => ({ name: s.name })) };
  }

  if (text.trim() === 'SELECT 1') {
    return { rows: [{ '?column?': 1 }] };
  }

  return { rows: [] };
}

const pool = MOCK
  ? { query: mockQuery }
  : new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

export async function query(text, params) {
  return pool.query(text, params);
}
