
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_shutdown boolean NOT NULL DEFAULT false,
  shutdown_message text NOT NULL DEFAULT 'This site is currently under maintenance. Please check back later.',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert single settings row
INSERT INTO public.site_settings (id, is_shutdown, shutdown_message)
VALUES ('00000000-0000-0000-0000-000000000001', false, 'This site is currently under maintenance. Please check back later.');

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed to check shutdown status)
CREATE POLICY "Anyone can read site settings"
ON public.site_settings FOR SELECT
TO public
USING (true);

-- Only admins can update
CREATE POLICY "Admins can update site settings"
ON public.site_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
