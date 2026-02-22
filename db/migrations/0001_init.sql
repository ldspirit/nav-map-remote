-- 0001_init.sql
-- Core schema for Africa Digital Map Platform (MVP)

CREATE EXTENSION IF NOT EXISTS postgis;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  billing_country VARCHAR(2) NOT NULL,
  device_region VARCHAR(2),
  sim_country VARCHAR(2),
  signup_country VARCHAR(2) NOT NULL,
  family_id UUID,
  is_family_admin BOOLEAN DEFAULT FALSE,
  subscription_status VARCHAR(20) DEFAULT 'trial',
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Streets
CREATE TABLE IF NOT EXISTS streets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  street_type VARCHAR(20) NOT NULL,
  country_id VARCHAR(2) NOT NULL,
  centerline GEOGRAPHY(LINESTRING, 4326),
  osm_way_id BIGINT,
  generated_at TIMESTAMP DEFAULT NOW(),
  is_temporary BOOLEAN DEFAULT FALSE
);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  street_id UUID NOT NULL REFERENCES streets(id),
  house_number VARCHAR(10) NOT NULL,
  p_number INTEGER NOT NULL DEFAULT 1,
  unit_designation VARCHAR(50),
  coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
  country_id VARCHAR(2) NOT NULL,
  status VARCHAR(12) DEFAULT 'ACTIVE',
  user_id UUID NOT NULL REFERENCES users(id),
  verification_level VARCHAR(12) DEFAULT 'none',
  created_at TIMESTAMP DEFAULT NOW(),
  deactivated_at TIMESTAMP,
  last_verified_at TIMESTAMP
);

-- Families
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id UUID NOT NULL REFERENCES users(id),
  max_members INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users
  ADD CONSTRAINT users_family_id_fkey
  FOREIGN KEY (family_id) REFERENCES families(id);

-- Subscriptions (optional MVP stub)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  family_id UUID REFERENCES families(id),
  plan_type VARCHAR(12) NOT NULL,
  billing_country VARCHAR(2) NOT NULL,
  base_price_usd DECIMAL(10,2) NOT NULL,
  regional_multiplier DECIMAL(4,2) NOT NULL,
  final_price_local DECIMAL(10,2) NOT NULL,
  currency_code VARCHAR(3) NOT NULL,
  status VARCHAR(12) DEFAULT 'active',
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_addresses_coords ON addresses USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_addresses_country ON addresses (country_id);
CREATE INDEX IF NOT EXISTS idx_addresses_status ON addresses (status);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_unique
  ON addresses (street_id, house_number, p_number)
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_streets_centerline ON streets USING GIST (centerline);
CREATE INDEX IF NOT EXISTS idx_streets_country ON streets (country_id);
CREATE INDEX IF NOT EXISTS idx_streets_name_country ON streets (name, country_id);
