-- Run this in your Supabase SQL Editor to support Firebase Push Notifications
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS push_token TEXT;
