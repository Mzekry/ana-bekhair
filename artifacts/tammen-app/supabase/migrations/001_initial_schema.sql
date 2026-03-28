-- ============================================================
-- Ana Bekhair (أنا بخير) — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. PROFILES
--    Extends auth.users with display name, phone, timezone.
--    Auto-created via trigger on every new sign-up.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  phone        TEXT,
  timezone     TEXT        NOT NULL DEFAULT 'Asia/Riyadh',
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a profile row whenever a user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Keep updated_at current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ────────────────────────────────────────────────────────────
-- 2. EMERGENCY CONTACTS
--    Each user can have one or more contacts. Only active ones
--    receive alerts. Ordering by created_at gives "primary" first.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  phone        TEXT        NOT NULL,
  relationship TEXT,                        -- e.g. "أم", "زوجة", "صديق"
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER emergency_contacts_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id
  ON public.emergency_contacts(user_id);


-- ────────────────────────────────────────────────────────────
-- 3. USER SETTINGS
--    Per-user check-in schedule and notification preferences.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id                  UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Hour of day (0-23) by which the user must check in (local timezone)
  check_in_deadline_hour   INTEGER NOT NULL DEFAULT 22 CHECK (check_in_deadline_hour BETWEEN 0 AND 23),
  -- Minutes after deadline before the alert fires
  grace_period_minutes     INTEGER NOT NULL DEFAULT 60 CHECK (grace_period_minutes >= 0),
  -- Minutes before deadline to send a reminder push notification
  reminder_minutes_before  INTEGER NOT NULL DEFAULT 120 CHECK (reminder_minutes_before >= 0),
  notifications_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ────────────────────────────────────────────────────────────
-- 4. CHECK-INS
--    Immutable log of every time the user confirmed they're OK.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.check_ins (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- How the check-in was triggered
  method         TEXT        NOT NULL DEFAULT 'button'
                   CHECK (method IN ('button', 'auto', 'sms', 'call')),
  note           TEXT
);

CREATE INDEX IF NOT EXISTS idx_check_ins_user_date
  ON public.check_ins(user_id, checked_in_at DESC);


-- ────────────────────────────────────────────────────────────
-- 5. ALERTS
--    Log of every alert sent (or attempted) to an emergency contact.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alerts (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emergency_contact_id  UUID        REFERENCES public.emergency_contacts(id) ON DELETE SET NULL,
  type                  TEXT        NOT NULL
                          CHECK (type IN ('missed_checkin', 'emergency', 'test')),
  status                TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'sent', 'failed')),
  channel               TEXT        NOT NULL DEFAULT 'sms'
                          CHECK (channel IN ('sms', 'whatsapp', 'call', 'push')),
  message               TEXT,
  error_message         TEXT,
  sent_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id
  ON public.alerts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_status
  ON public.alerts(status) WHERE status = 'pending';


-- ────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
--    Users can only read and write their own rows.
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts             ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- emergency_contacts
CREATE POLICY "emergency_contacts: own read"
  ON public.emergency_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "emergency_contacts: own insert"
  ON public.emergency_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "emergency_contacts: own update"
  ON public.emergency_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "emergency_contacts: own delete"
  ON public.emergency_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- user_settings
CREATE POLICY "user_settings: own all"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- check_ins
CREATE POLICY "check_ins: own read"
  ON public.check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "check_ins: own insert"
  ON public.check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- alerts
CREATE POLICY "alerts: own read"
  ON public.alerts FOR SELECT
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 7. HELPER VIEW: last_check_in_per_user
--    Used by the alert scheduler to find who hasn't checked in.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.last_check_in_per_user AS
SELECT DISTINCT ON (user_id)
  user_id,
  id            AS check_in_id,
  checked_in_at
FROM public.check_ins
ORDER BY user_id, checked_in_at DESC;

-- Grant access to authenticated users (they only see their own row via RLS on the base table)
GRANT SELECT ON public.last_check_in_per_user TO authenticated;
