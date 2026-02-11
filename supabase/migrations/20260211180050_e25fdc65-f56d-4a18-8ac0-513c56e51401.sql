
-- Add telegram_chat_id to profiles for Telegram OTP delivery
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_chat_id text DEFAULT NULL;

-- Create password_reset_tokens table
CREATE TABLE public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text DEFAULT NULL
);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role (edge functions) should access this table
-- No public RLS policies needed - accessed via security definer functions

-- Create index for fast lookups
CREATE INDEX idx_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_expires ON public.password_reset_tokens(expires_at);

-- Function to invalidate previous tokens when new one is generated
CREATE OR REPLACE FUNCTION public.invalidate_old_reset_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.password_reset_tokens
  SET used = true
  WHERE user_id = NEW.user_id AND id != NEW.id AND used = false;
  RETURN NEW;
END;
$$;

CREATE TRIGGER invalidate_old_tokens
AFTER INSERT ON public.password_reset_tokens
FOR EACH ROW
EXECUTE FUNCTION public.invalidate_old_reset_tokens();

-- Password reset activity log
CREATE TABLE public.password_reset_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  ip_address text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.password_reset_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_reset_log_user_id ON public.password_reset_log(user_id);
