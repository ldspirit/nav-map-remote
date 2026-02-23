import { z } from 'zod';
import { query } from './db.js';
import { formatAddress, chooseStreetType, nextHouseNumber, formatByCountry, pickStreetName } from '@nav-map/core';

export function registerRoutes(app) {
  app.post('/api/v1/auth/register', async (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      phone: z.string().min(6),
      full_name: z.string().min(2),
      device_region: z.string().min(2).max(2).optional(),
      sim_country: z.string().min(2).max(2).optional(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      })
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

    const { email, phone, full_name, device_region, sim_country, coordinates } = parsed.data;

    // Simplified: billing country = device_region || sim_country || 'NG'
    const billing_country = device_region || sim_country || 'NG';

    try {
      var user = await query(
        `INSERT INTO users (email, phone, full_name, billing_country, device_region, sim_country, signup_country)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id`,
        [email, phone, full_name, billing_country, device_region || null, sim_country || null, billing_country]
      );
    } catch (e) {
      if (String(e).includes('users_email') || String(e).includes('users_phone') || String(e).includes('duplicate')) {
        return res.status(409).json({ error: 'user_exists' });
      }
      throw e;
    }

    // Create OTP (6-digit, 10 min expiry)
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await query(
      `INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1,$2,$3)`
      , [phone, code, expires]
    );

    res.status(201).json({
      user_id: user.rows[0].id,
      phone_verification_required: true,
      otp_sent_to: phone.replace(/.(?=.{3})/g, '*'),
      detected_conflicts: {
        device_region: device_region || null,
        sim_country: sim_country || null,
        gps_country: billing_country,
        ip_country: billing_country,
        conflict_detected: false
      }
    });
  });

  app.post('/api/v1/auth/verify-phone', async (req, res) => {
    const schema = z.object({
      user_id: z.string().uuid(),
      otp_code: z.string().min(4)
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

    const { user_id, otp_code } = parsed.data;

    const userRes = await query('SELECT phone FROM users WHERE id=$1', [user_id]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'user_not_found' });

    const phone = userRes.rows[0].phone;
    const otpRes = await query(
      `SELECT id FROM otp_codes WHERE phone=$1 AND code=$2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
      [phone, otp_code]
    );
    if (otpRes.rows.length === 0) return res.status(401).json({ error: 'invalid_otp' });

    res.json({ ok: true });
  });

  app.post('/api/v1/addresses/create', async (req, res) => {
    const schema = z.object({
      user_id: z.string().uuid(),
      coordinates: z.object({ lat: z.number(), lng: z.number() }),
      property_type: z.string().optional(),
      unit_designation: z.string().optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

    const { user_id, coordinates, unit_designation } = parsed.data;

    // 1) GPS match to existing address (P-system)
    const nearby = await query(
      `SELECT id, street_id, house_number, p_number
       FROM addresses
       WHERE country_id = 'NG'
         AND ST_DWithin(
           coordinates::geography,
           ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
           12
         )
       ORDER BY created_at ASC
       LIMIT 1`,
      [coordinates.lng, coordinates.lat]
    );

    if (nearby.rows.length > 0) {
      const existing = nearby.rows[0];
      const nextP = await query(
        `SELECT COALESCE(MAX(p_number),0) + 1 AS next_p
         FROM addresses WHERE street_id=$1 AND house_number=$2`,
        [existing.street_id, existing.house_number]
      );
      const pNumber = nextP.rows[0].next_p;

      const created = await query(
        `INSERT INTO addresses (street_id, house_number, p_number, unit_designation, coordinates, country_id, user_id)
         VALUES ($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($5,$6),4326)::geography,'NG',$7)
         RETURNING id`,
        [existing.street_id, existing.house_number, pNumber, unit_designation || null, coordinates.lng, coordinates.lat, user_id]
      );

      return res.status(201).json({
        address_id: created.rows[0].id,
        full_address: formatByCountry({
          countryCode: 'NG',
          number: existing.house_number,
          street: `Hope Street P${pNumber}`,
          unit: unit_designation || '',
          postal: '100001',
          city: 'Lagos',
          state: 'Lagos State'
        }),
        components: {
          house_number: existing.house_number,
          street_name: 'Hope Street',
          p_number: pNumber,
          postal_code: '100001',
          city: 'Lagos',
          state: 'Lagos State',
          country: 'Nigeria'
        }
      });
    }

    // 2) Try attach to nearest existing street within 100m
    const nearbyStreet = await query(
      `SELECT a.street_id
       FROM addresses a
       WHERE a.country_id='NG'
         AND ST_DWithin(
           a.coordinates::geography,
           ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
           100
         )
       ORDER BY ST_Distance(a.coordinates::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography)
       LIMIT 1`,
      [coordinates.lng, coordinates.lat]
    );

    if (nearbyStreet.rows.length > 0) {
      const streetId = nearbyStreet.rows[0].street_id;
      const existingNumbersRes = await query(
        `SELECT house_number FROM addresses WHERE street_id=$1`,
        [streetId]
      );
      const existingNumbers = existingNumbersRes.rows.map(r => r.house_number);
      const houseNumber = nextHouseNumber(existingNumbers);

      const address = await query(
        `INSERT INTO addresses (street_id, house_number, p_number, unit_designation, coordinates, country_id, user_id)
         VALUES ($1,$2,1,$3,ST_SetSRID(ST_MakePoint($4,$5),4326)::geography,'NG',$6)
         RETURNING id`,
        [streetId, houseNumber, unit_designation || null, coordinates.lng, coordinates.lat, user_id]
      );

      return res.status(201).json({
        address_id: address.rows[0].id,
        full_address: formatByCountry({
          countryCode: 'NG',
          number: houseNumber,
          street: `Hope Street P1`,
          unit: unit_designation || '',
          postal: '100001',
          city: 'Lagos',
          state: 'Lagos State'
        }),
        components: {
          house_number: houseNumber,
          street_name: 'Hope Street',
          p_number: 1,
          postal_code: '100001',
          city: 'Lagos',
          state: 'Lagos State',
          country: 'Nigeria'
        }
      });
    }

    // 3) New street + sequential numbering
    const streetType = chooseStreetType({});

    // ensure street name uniqueness within 5km radius (addresses as proxy)
    let streetName = pickStreetName('NG');
    const existingNames = await query(
      `SELECT DISTINCT s.name
       FROM streets s
       JOIN addresses a ON a.street_id = s.id
       WHERE s.country_id='NG'
         AND ST_DWithin(
           a.coordinates::geography,
           ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,
           5000
         )`,
      [coordinates.lng, coordinates.lat]
    );
    const used = new Set(existingNames.rows.map(r => r.name));
    let attempts = 0;
    while (used.has(streetName) && attempts < 10) {
      streetName = pickStreetName('NG');
      attempts++;
    }

    const street = await query(
      `INSERT INTO streets (name, street_type, country_id) VALUES ($1,$2,'NG') RETURNING id`,
      [streetName, streetType]
    );

    const existingNumbersRes = await query(
      `SELECT house_number FROM addresses WHERE street_id=$1`,
      [street.rows[0].id]
    );
    const existingNumbers = existingNumbersRes.rows.map(r => r.house_number);
    const houseNumber = nextHouseNumber(existingNumbers);

    const address = await query(
      `INSERT INTO addresses (street_id, house_number, p_number, unit_designation, coordinates, country_id, user_id)
       VALUES ($1,$2,1,$3,ST_SetSRID(ST_MakePoint($4,$5),4326)::geography,'NG',$6)
       RETURNING id`,
      [street.rows[0].id, houseNumber, unit_designation || null, coordinates.lng, coordinates.lat, user_id]
    );

    res.status(201).json({
      address_id: address.rows[0].id,
      full_address: formatByCountry({
        countryCode: 'NG',
        number: houseNumber,
        street: `${streetName} ${streetType} P1`,
        unit: unit_designation || '',
        postal: '100001',
        city: 'Lagos',
        state: 'Lagos State'
      }),
      components: {
        house_number: houseNumber,
        street_name: `${streetName} ${streetType}`,
        p_number: 1,
        postal_code: '100001',
        city: 'Lagos',
        state: 'Lagos State',
        country: 'Nigeria'
      }
    });
  });

  app.get('/api/v1/addresses/:id', async (req, res) => {
    const { id } = req.params;
    const row = await query(
      `SELECT a.id, a.house_number, a.p_number, s.name AS street_name
       FROM addresses a JOIN streets s ON a.street_id=s.id WHERE a.id=$1`,
      [id]
    );
    if (row.rows.length === 0) return res.status(404).json({ error: 'not_found' });
    res.json(row.rows[0]);
  });

  app.get('/api/v1/addresses/search', async (req, res) => {
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.json({ results: [], count: 0, query: q });

    const rows = await query(
      `SELECT a.id, a.house_number, a.p_number, s.name AS street_name
       FROM addresses a JOIN streets s ON a.street_id=s.id
       WHERE s.name ILIKE $1
       LIMIT 10`,
      [`%${q}%`]
    );

    res.json({
      results: rows.rows.map(r => ({
        address_id: r.id,
        full_address: `${r.house_number} ${r.street_name} P${r.p_number}`
      })),
      count: rows.rows.length,
      query: q
    });
  });
}
