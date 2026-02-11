
-- Add SKU and cost fields to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost numeric NOT NULL DEFAULT 0;

-- Add admin_notes to orders and products
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_notes text DEFAULT '';

-- Activity log table for admin actions
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text DEFAULT '',
  target_id text DEFAULT '',
  details text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs"
ON public.activity_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);
