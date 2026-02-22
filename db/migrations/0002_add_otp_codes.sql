-- 0002_add_otp_codes.sql
-- OTP codes for phone verification

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes (phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes (expires_at);
