-- 0003_cleanup_otp.sql
-- Add cleanup helper: index already on expires_at, but ensure a cleanup query exists

-- No schema changes, but document cleanup command:
-- DELETE FROM otp_codes WHERE expires_at < NOW();
