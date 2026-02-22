import { z } from 'zod';
import { query } from './db.js';
import { formatAddress, chooseStreetType, generateStreetName } from '@nav-map/core';

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

    const user = await query(
      `INSERT INTO users (email, phone, full_name, billing_country, device_region, sim_country, signup_country)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [email, phone, full_name, billing_country, device_region || null, sim_country || null, billing_country]
    );

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

    // Placeholder: basic street naming + formatting (to be upgraded with GPS matching & numbering)
    const streetType = chooseStreetType({});
    const streetName = generateStreetName('Hope');

    const street = await query(
      `INSERT INTO streets (name, street_type, country_id) VALUES ($1,$2,'NG') RETURNING id`,
      [streetName, streetType]
    );

    const address = await query(
      `INSERT INTO addresses (street_id, house_number, p_number, unit_designation, coordinates, country_id, user_id)
       VALUES ($1,'1',1,$2,ST_SetSRID(ST_MakePoint($3,$4),4326)::geography,'NG',$5)
       RETURNING id`,
      [street.rows[0].id, unit_designation || null, coordinates.lng, coordinates.lat, user_id]
    );

    res.status(201).json({
      address_id: address.rows[0].id,
      full_address: formatAddress({ houseNumber: '1', streetName: `${streetName} ${streetType}`, pNumber: 1, country: 'Nigeria' })
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
}
