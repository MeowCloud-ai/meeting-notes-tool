-- Issue #46: Freemium 方案 — 改為分鐘制

-- Add monthly_minutes_used column
ALTER TABLE meet_usage ADD COLUMN IF NOT EXISTS monthly_minutes_used INT NOT NULL DEFAULT 0;

-- Plan limits in minutes (free=30, starter=300, pro=1500, business=99999)
-- Enforced in check-quota edge function, not DB constraint
